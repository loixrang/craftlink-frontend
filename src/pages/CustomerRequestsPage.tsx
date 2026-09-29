import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { ApiError } from '../services/api'
import { getServiceRequests, requestStatuses } from '../services/serviceRequests'

export function CustomerRequestsPage() {
  const { session } = useAuth()
  const { requestId } = useParams()
  const [params, setParams] = useSearchParams()
  const rawPage = params.get('page') ?? '1'
  const page = Number(rawPage)
  const validPage = /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(page)
  const requests = useQuery({
    queryKey: ['service-requests', session?.user.id, requestId ?? 'history', requestId ? null : page],
    enabled: !!session && (validPage || !!requestId),
    queryFn: async ({ signal }) => {
      const token = session!.accessToken
      if (!requestId) return getServiceRequests(page, token, signal)
      // No detail endpoint exists: resolve only within this customer's collection.
      let result = await getServiceRequests(1, token, signal)
      for (let next = 2; !result.data.some(item => item.id === requestId) && next <= result.pagination.totalPages; next++) {
        result = await getServiceRequests(next, token, signal)
      }
      return result
    },
  })
  const data = requests.isError ? undefined : requests.data
  const detail = data?.data.find(item => item.id === requestId)
  const changePage = (next: number) => setParams({ page: String(next) })
  const error = requests.error
  const errorMessage = error instanceof ApiError && error.status === 401
    ? 'Your session has expired. Sign out and log in again to view your requests.'
    : error instanceof ApiError && error.status === 403
      ? 'Your account cannot access these requests.' : 'We could not load your requests. Please try again.'

  return <section className="mx-auto max-w-3xl space-y-6">
    <Link className="inline-flex min-h-11 items-center" to={requestId ? '/customer/requests' : '/customer'}>{requestId ? 'Back to request history' : 'Back to dashboard'}</Link>
    <header><h1 className="text-3xl tracking-tight sm:text-4xl">{requestId ? 'Request details' : 'Request history'}</h1><p className="mt-3 text-ink-muted">Follow your service requests and their current status.</p></header>
    {!validPage && !requestId ? <EmptyState title="Invalid history page" description="Return to the first page to see your requests."><Button onClick={() => changePage(1)}>First page</Button></EmptyState> : <>
      {requests.isPending && <LoadingState label="Loading requests..." />}
      {requests.isError && <ErrorState title="Requests unavailable" description={errorMessage} onRetry={requests.isFetching ? undefined : () => { void requests.refetch() }} />}
      {requests.isFetching && !requests.isPending && <LoadingState label="Refreshing requests..." />}
      {data && <>
        <Button variant="secondary" pending={requests.isFetching} onClick={() => { void requests.refetch() }}>Refresh status</Button>
        {requestId ? detail ? <article className="space-y-6 border-t border-line pt-6">
          <Badge>{requestStatuses[detail.status]}</Badge>
          <dl className="space-y-5">
            <div><dt className="text-sm text-ink-muted">Project description</dt><dd className="mt-2 whitespace-pre-wrap break-words">{detail.description}</dd></div>
            <div><dt className="text-sm text-ink-muted">Request reference</dt><dd className="mt-1 break-all">{detail.id}</dd></div>
            <div><dt className="text-sm text-ink-muted">Service reference</dt><dd className="mt-1 break-all">{detail.serviceId}</dd></div>
            <div><dt className="text-sm text-ink-muted">Preferred date</dt><dd className="mt-1">{detail.preferredDate ? <time dateTime={detail.preferredDate}>{detail.preferredDate.slice(0, 10)}</time> : 'Not specified'}</dd></div>
            {detail.createdAt && <div><dt className="text-sm text-ink-muted">Submitted</dt><dd><time dateTime={detail.createdAt}>{new Date(detail.createdAt).toLocaleDateString()}</time></dd></div>}
          </dl>
          <p className="text-sm text-ink-muted">The preferred date is a suggestion, not a confirmed booking. Refresh to check for status updates.</p>
          <Link className="inline-flex min-h-11 items-center" to={`/artisans/${encodeURIComponent(detail.artisanId)}`}>View artisan profile</Link>
        </article> : <EmptyState title="Request not found" description="This request is not in your history. Return to request history to find your available requests." /> : <>
          {data.data.length ? <ul className="divide-y divide-line border-y border-line">{data.data.map(item => <li key={item.id} className="py-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><Badge>{requestStatuses[item.status]}</Badge>{item.createdAt && <time className="text-sm text-ink-muted" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time>}</div>
            <p className="my-3 line-clamp-2 break-words">{item.description}</p>
            <Link className="inline-flex min-h-11 items-center" to={`/customer/requests/${encodeURIComponent(item.id)}`} aria-label={`View request ${item.id}`}>View details</Link>
          </li>)}</ul> : <EmptyState title={page === 1 ? 'No requests yet' : 'No requests on this page'} description={page === 1 ? 'Find an artisan and choose a service to start your first request.' : 'Return to the first page or browse previous requests.'}><Link to="/artisans">Find an artisan</Link>{page > 1 && <Button onClick={() => changePage(1)}>First page</Button>}</EmptyState>}
          <nav aria-label="Request history pages" className="flex flex-wrap items-center gap-4"><Button variant="secondary" disabled={page <= 1 || requests.isFetching} onClick={() => changePage(page - 1)}>Previous</Button><span>Page {page} of {Math.max(1, data.pagination.totalPages)}</span><Button variant="secondary" disabled={page >= data.pagination.totalPages || requests.isFetching} onClick={() => changePage(page + 1)}>Next</Button></nav>
        </>}
      </>}
    </>}
  </section>
}
