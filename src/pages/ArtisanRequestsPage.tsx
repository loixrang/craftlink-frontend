import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../components/ui/Feedback'
import { ApiError } from '../services/api'
import { actionLabels, getIncomingRequests, requestActions, updateIncomingRequest, type IncomingRequest, type RequestAction } from '../services/incomingRequests'
import { requestStatuses } from '../services/serviceRequests'

function requestError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.'
    if (error.status === 403) return 'Your account cannot manage these requests.'
    if (error.status === 404) return 'This request is no longer available. Refresh the list.'
    if (error.status === 409) return 'This request changed or the action is no longer allowed. Refresh to see its current status.'
  }
  return 'We could not confirm the latest request status. Refresh before trying again.'
}

function RequestDetails({ item, refreshing, onRefresh }: { item: IncomingRequest; refreshing: boolean; onRefresh: () => void }) {
  const { session } = useAuth()
  const client = useQueryClient()
  const lock = useRef(false)
  const [confirmation, setConfirmation] = useState<RequestAction | null>(null)
  const mutation = useMutation({
    retry: false,
    mutationFn: (status: RequestAction) => updateIncomingRequest(item, status, session!.accessToken),
    // Do not insert mutation responses into caches after navigation or sign-out.
    onSettled: async () => { await client.invalidateQueries({ queryKey: ['incoming-requests', session?.user.id] }) },
  })
  const submit = () => {
    if (!confirmation || lock.current || refreshing) return
    lock.current = true
    mutation.mutate(confirmation, { onSettled: () => { lock.current = false; setConfirmation(null) } })
  }
  return <div className="mt-4 space-y-5 border-l-2 border-line pl-4">
    <dl className="space-y-4">
      <div><dt className="text-sm text-ink-muted">Project description</dt><dd className="mt-1 whitespace-pre-wrap break-words">{item.description}</dd></div>
      <div><dt className="text-sm text-ink-muted">Preferred date</dt><dd>{item.preferredDate ? <time dateTime={item.preferredDate}>{new Date(item.preferredDate).toLocaleDateString()}</time> : 'Not specified'}</dd></div>
      <div><dt className="text-sm text-ink-muted">Request reference</dt><dd className="break-all text-sm">{item.id}</dd></div>
    </dl>
    {!item.serviceId && <p className="text-sm text-ink-muted">This service has been removed. You can still manage this request.</p>}
    <p className="text-sm text-ink-muted">The preferred date is a suggestion, not a confirmed booking.</p>
    {mutation.isSuccess && <SuccessState title="Request status updated" />}
    {mutation.isError && <ErrorState title="Status update not confirmed" description={requestError(mutation.error)} onRetry={refreshing ? undefined : () => { mutation.reset(); onRefresh() }} />}
    {confirmation ? <div className="space-y-3" role="group" aria-label="Confirm status change">
      <p>{actionLabels[confirmation]}? This changes the status shown to the customer.</p>
      <div className="flex flex-wrap gap-3"><Button pending={mutation.isPending} disabled={refreshing} onClick={submit}>{mutation.isPending ? 'Updating status...' : 'Confirm change'}</Button><Button variant="secondary" disabled={mutation.isPending} onClick={() => setConfirmation(null)}>Cancel</Button></div>
    </div> : <div className="flex flex-wrap gap-3">{requestActions(item.status).map(action => <Button key={action} variant={action === 'DECLINED' ? 'secondary' : 'primary'} disabled={refreshing || mutation.isPending || mutation.isError} onClick={() => { mutation.reset(); setConfirmation(action) }}>{actionLabels[action]}</Button>)}</div>}
    {!requestActions(item.status).length && <p className="text-sm text-ink-muted">No further actions are available for this request.</p>}
  </div>
}

export function ArtisanRequestsPage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const rawPage = params.get('page') ?? '1'
  const page = Number(rawPage)
  const validPage = /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(page) && page <= 1_000_000
  const requests = useQuery({
    queryKey: ['incoming-requests', session?.user.id, page],
    enabled: session?.user.role === 'ARTISAN' && validPage,
    queryFn: ({ signal }) => getIncomingRequests(page, session!.accessToken, signal),
  })
  const data = requests.isError ? undefined : requests.data
  const refresh = () => { void requests.refetch() }
  return <section className="mx-auto max-w-3xl space-y-6">
    <Link className="inline-flex min-h-11 items-center" to="/artisan">Back to dashboard</Link>
    <header><h1 className="text-3xl tracking-tight sm:text-4xl">Incoming requests</h1><p className="mt-3 text-ink-muted">Review customer projects and keep them informed as your work progresses.</p></header>
    {!validPage ? <EmptyState title="Invalid request page" description="Return to the first page to see your requests."><Button onClick={() => setParams({ page: '1' })}>First page</Button></EmptyState> : <>
      {requests.isPending && <LoadingState label="Loading incoming requests..." />}
      {requests.isError && <ErrorState title="Requests unavailable" description={requestError(requests.error)} onRetry={requests.isFetching ? undefined : refresh} />}
      {requests.isFetching && !requests.isPending && <LoadingState label="Refreshing requests..." />}
      {data && <>
        <Button variant="secondary" pending={requests.isFetching} onClick={refresh}>Refresh requests</Button>
        {data.data.length ? <ul className="divide-y divide-line border-y border-line">{data.data.map(item => <li key={item.id} className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="break-words text-lg">{item.serviceTitle}</h2><Badge>{requestStatuses[item.status]}</Badge></div>
          <p className="mt-2 text-sm text-ink-muted">Received <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time></p>
          <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 font-medium">View request details<span className="sr-only"> for {item.serviceTitle}, reference {item.id}</span></summary><RequestDetails key={`${session?.user.id}:${item.id}`} item={item} refreshing={requests.isFetching} onRefresh={refresh} /></details>
        </li>)}</ul> : <EmptyState title={page === 1 ? 'No incoming requests yet' : 'No requests on this page'} description={page === 1 ? 'Customer requests will appear here when they choose one of your services.' : 'Return to the first page to see your latest requests.'}>{page > 1 && <Button onClick={() => setParams({ page: '1' })}>First page</Button>}</EmptyState>}
        <nav aria-label="Incoming request pages" className="flex flex-wrap items-center gap-4"><Button variant="secondary" disabled={page <= 1 || requests.isFetching} onClick={() => setParams({ page: String(page - 1) })}>Previous</Button><span>Page {page} of {Math.max(1, data.pagination.totalPages)}</span><Button variant="secondary" disabled={page >= data.pagination.totalPages || requests.isFetching} onClick={() => setParams({ page: String(page + 1) })}>Next</Button></nav>
      </>}
    </>}
  </section>
}
