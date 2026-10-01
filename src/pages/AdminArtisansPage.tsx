import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { ApiError } from '../services/api'
import { accountStatus, getAdminArtisans, verificationLabels, type AccountStatus, type AdminArtisan } from '../services/admin'

const pageSize = 20

function adminArtisansError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.'
    if (error.status === 403) return 'Your account no longer has access to administration.'
    if (error.status === 400) return 'The request could not be accepted. Reset the filters and try again.'
  }
  return 'We could not load artisan profiles. Refresh to try again.'
}

function ratingLabel(artisan: AdminArtisan) {
  return artisan.averageRating === null || artisan.reviewCount === 0
    ? 'No reviews yet'
    : `${artisan.averageRating.toFixed(1)} from ${artisan.reviewCount.toLocaleString()} ${artisan.reviewCount === 1 ? 'review' : 'reviews'}`
}

export function AdminArtisansPage() {
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const rawPage = params.get('page') ?? '1'
  const page = Number(rawPage)
  const rawStatus = params.get('status') ?? 'ALL'
  const parsedStatus = rawStatus === 'ALL' ? undefined : accountStatus.safeParse(rawStatus)
  const status: AccountStatus | undefined = parsedStatus && 'success' in parsedStatus && parsedStatus.success ? parsedStatus.data : undefined
  const valid = /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(page) && page <= 1_000_000
    && (rawStatus === 'ALL' || (parsedStatus !== undefined && 'success' in parsedStatus && parsedStatus.success))
  const artisans = useQuery({
    queryKey: ['admin', session?.user.id, 'artisans', page, rawStatus],
    enabled: session?.user.role === 'ADMIN' && valid,
    queryFn: ({ signal }) => getAdminArtisans(page, pageSize, status, session!.accessToken, signal),
  })
  const navigate = (nextPage: number, nextStatus = rawStatus) => {
    const next = new URLSearchParams()
    if (nextPage !== 1) next.set('page', String(nextPage))
    if (nextStatus !== 'ALL') next.set('status', nextStatus)
    setParams(next)
  }
  const busy = artisans.isFetching
  const data = artisans.isError ? undefined : artisans.data

  return <div className="space-y-8">
    <header>
      <Link to="/admin" className="inline-flex min-h-11 items-center">Back to admin dashboard</Link>
      <h1 className="mt-5 text-3xl tracking-tight sm:text-4xl">Artisan management</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">Review artisan profiles, account access and marketplace summaries. Contact details and private documents are not shown here.</p>
    </header>
    <section aria-label="Artisan filters" className="flex flex-wrap items-end gap-4 border-y border-line py-5">
      <label className="grid gap-2 text-sm font-medium">Owner account status
        <select className="min-h-11 rounded-control border border-control-border bg-surface px-3" value={rawStatus} onChange={event => navigate(1, event.target.value)}>
          {!valid && rawStatus !== 'ALL' && <option value={rawStatus}>Invalid status</option>}
          <option value="ALL">All account statuses</option>
          {accountStatus.options.map(value => <option key={value} value={value}>{value === 'ACTIVE' ? 'Active' : 'Suspended'}</option>)}
        </select>
      </label>
      <Button variant="secondary" pending={busy} disabled={!valid} onClick={() => { void artisans.refetch() }}>Refresh artisans</Button>
    </section>
    {!valid ? <EmptyState title="Invalid artisan filters" description="Reset the filters to review artisan profiles."><Button onClick={() => navigate(1, 'ALL')}>Reset filters</Button></EmptyState> : <>
      {artisans.isPending && <LoadingState label="Loading artisan profiles..." />}
      {artisans.isFetching && !artisans.isPending && <LoadingState label="Refreshing artisan profiles..." />}
      {artisans.isError && <ErrorState title="Artisan profiles unavailable" description={adminArtisansError(artisans.error)} onRetry={busy ? undefined : () => { void artisans.refetch() }} />}
      {data && <>
        {data.data.length ? <>
          <p role="status" className="text-sm text-ink-muted">Showing {data.data.length} of {data.pagination.total.toLocaleString()} artisan profiles</p>
          <ul className="divide-y divide-line border-y border-line">{data.data.map(artisan => <li key={artisan.id} className="space-y-4 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{artisan.displayName}</h2><p className="mt-1 break-all text-sm text-ink-muted">{artisan.email}</p><p className="mt-1 text-sm text-ink-muted">{artisan.city}, {artisan.state} · {artisan.yearsExperience} {artisan.yearsExperience === 1 ? 'year' : 'years'} experience</p></div>
              <div className="flex flex-wrap gap-2"><Badge tone={artisan.accountStatus === 'ACTIVE' ? 'accent' : 'neutral'}>{artisan.accountStatus === 'ACTIVE' ? 'Active account' : 'Suspended account'}</Badge><Badge tone={artisan.isAvailable ? 'accent' : 'neutral'}>{artisan.isAvailable ? 'Available' : 'Unavailable'}</Badge><Badge>{verificationLabels[artisan.verificationStatus]} credentials</Badge></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-ink-muted">{ratingLabel(artisan)} · Joined <time dateTime={artisan.createdAt}>{new Date(artisan.createdAt).toLocaleDateString()}</time></p>{artisan.accountStatus === 'ACTIVE' && <Link to={`/artisans/${artisan.id}`} className="inline-flex min-h-11 items-center font-medium">View public profile<span className="sr-only">: {artisan.displayName}</span></Link>}</div>
          </li>)}</ul>
        </> : <EmptyState title={page === 1 ? 'No artisan profiles found' : 'No artisan profiles on this page'} description="Try another account status or refresh for new profiles.">{page > 1 && <Button onClick={() => navigate(1)}>First page</Button>}</EmptyState>}
        <nav aria-label="Artisan pages" className="flex flex-wrap items-center gap-4"><Button variant="secondary" disabled={page <= 1 || busy} onClick={() => navigate(page - 1)}>Previous</Button><span>Page {page} of {Math.max(1, data.pagination.totalPages)}</span><Button variant="secondary" disabled={page >= data.pagination.totalPages || busy} onClick={() => navigate(page + 1)}>Next</Button></nav>
      </>}
    </>}
  </div>
}
