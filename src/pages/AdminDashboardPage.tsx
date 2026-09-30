import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import { useAuth } from '../app/authContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../components/ui/Feedback'
import { ApiError } from '../services/api'
import { getAdminCredentials, getAdminStats, verificationLabels, verificationStatus, verifyCredential, type VerificationStatus } from '../services/admin'

function adminError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.'
    if (error.status === 403) return 'Your account no longer has access to administration.'
    if (error.status === 404) return 'This credential has been removed. Refresh the list.'
    if (error.status === 400) return 'The request could not be accepted. Refresh and try again.'
    if (error.status === 409) return 'This credential changed. Refresh before reviewing it again.'
  }
  return 'We could not confirm the latest information. Refresh before trying again.'
}

function PrivateDocument({ url, expiresAt }: { url: string | null; expiresAt: number }) {
  const [now, setNow] = useState(Date.now)
  // Also honor an earlier provider expiry, if supplied.
  const providerExpiry = url ? Number(new URL(url).searchParams.get('expires_at')) * 1000 : 0
  const deadline = providerExpiry > 0 ? Math.min(expiresAt, providerExpiry) : expiresAt
  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, deadline - Date.now()))
    return () => window.clearTimeout(timer)
  }, [deadline])
  if (!url) return <p className="text-sm text-ink-muted">Document unavailable. Refresh to check again; a replacement upload may be needed.</p>
  if (now >= deadline) return <p className="text-sm text-ink-muted">Document link expired. Refresh credentials to get a new link.</p>
  return <div><a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="inline-flex min-h-11 items-center gap-2" onClick={event => {
    if (Date.now() >= deadline) { event.preventDefault(); setNow(Date.now()) }
  }}>Open private document <ExternalLink size={16} aria-hidden="true" /><span className="sr-only"> (new tab)</span></a><p className="text-sm text-ink-muted">Private download links expire within five minutes. Refresh if the download fails.</p></div>
}

export function AdminDashboardPage() {
  const { session } = useAuth()
  const client = useQueryClient()
  const [params, setParams] = useSearchParams()
  const rawPage = params.get('page') ?? '1'
  const page = Number(rawPage)
  const rawStatus = params.get('status') ?? 'PENDING'
  const status = verificationStatus.safeParse(rawStatus)
  const valid = /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(page) && page <= 1_000_000 && (rawStatus === 'ALL' || status.success)
  const scope = ['admin', session?.user.id]
  const stats = useQuery({ queryKey: [...scope, 'stats'], enabled: session?.user.role === 'ADMIN', queryFn: ({ signal }) => getAdminStats(session!.accessToken, signal) })
  const credentials = useQuery({
    queryKey: [...scope, 'credentials', page, rawStatus], enabled: session?.user.role === 'ADMIN' && valid,
    queryFn: ({ signal }) => getAdminCredentials(page, status.success ? status.data : undefined, session!.accessToken, signal),
    gcTime: 0, staleTime: 0,
  })
  const [selection, setSelection] = useState<{ id: string; title: string; artisanId: string; status: VerificationStatus } | null>(null)
  const lock = useRef(false)
  const mutation = useMutation({
    retry: false, gcTime: 0,
    mutationFn: (change: NonNullable<typeof selection>) => verifyCredential(change.id, change.status, session!.accessToken),
    onSettled: async (_data, _error, change) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin', session?.user.id] }),
        client.invalidateQueries({ queryKey: ['artisan-profile', change.artisanId] }),
        client.invalidateQueries({ queryKey: ['artisans'] }),
      ])
    },
  })
  const refresh = () => { setSelection(null); mutation.reset(); void credentials.refetch() }
  const navigate = (nextPage: number, nextStatus = rawStatus) => { setSelection(null); mutation.reset(); setParams({ page: String(nextPage), status: nextStatus }) }
  const data = credentials.isError ? undefined : credentials.data
  const busy = credentials.isFetching || mutation.isPending
  const submit = () => {
    if (!selection || lock.current || busy) return
    lock.current = true
    mutation.mutate(selection, { onSettled: () => { lock.current = false; setSelection(null) } })
  }
  return <div className="space-y-10">
    <header><p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-muted"><ShieldCheck size={18} aria-hidden="true" />Administration</p><h1 className="text-3xl tracking-tight sm:text-4xl">Admin dashboard</h1><p className="mt-3 text-ink-muted">Monitor marketplace activity and review artisan credentials.</p></header>
    <section aria-labelledby="stats-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="stats-title" className="text-xl">Marketplace overview</h2><Button variant="secondary" pending={stats.isFetching} disabled={mutation.isPending} onClick={() => { void stats.refetch() }}>Refresh statistics</Button></div>
      {stats.isPending && <LoadingState label="Loading statistics..." />}
      {stats.isError && <ErrorState title="Statistics unavailable" description={adminError(stats.error)} onRetry={stats.isFetching ? undefined : () => { void stats.refetch() }} />}
      {!stats.isError && stats.data && <><dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-6 sm:grid-cols-3 lg:grid-cols-5">{([
        ['users', 'Users'], ['artisans', 'Artisan profiles'], ['serviceRequests', 'Service requests'], ['reviews', 'Reviews'], ['pendingCredentials', 'Pending credentials'],
      ] as const).map(([key, label]) => <div key={key}><dt className="text-sm text-ink-muted">{label}</dt><dd className="mt-2 text-3xl font-semibold tabular-nums">{stats.data[key].toLocaleString()}</dd></div>)}</dl><p className="text-sm text-ink-muted">Totals include suspended accounts and their records. Pending credentials counts documents awaiting review.</p></>}
    </section>
    <section aria-labelledby="credentials-title" className="space-y-5">
      <header><h2 id="credentials-title" className="text-2xl">Credential verification</h2><p className="mt-2 text-ink-muted">Review the document and issuer before changing its status. Credential verification is not an identity or background check.</p></header>
      <div className="flex flex-wrap items-end gap-4"><label className="grid gap-2 text-sm font-medium">Verification status<select className="min-h-11 rounded-control border border-control-border bg-surface px-3" value={rawStatus} disabled={mutation.isPending} onChange={event => navigate(1, event.target.value)}>{!status.success && rawStatus !== 'ALL' && <option value={rawStatus}>Invalid status</option>}<option value="ALL">All statuses</option>{verificationStatus.options.map(value => <option key={value} value={value}>{verificationLabels[value]}</option>)}</select></label><Button variant="secondary" pending={busy} disabled={!valid} onClick={refresh}>Refresh credentials</Button></div>
      {mutation.isSuccess && <SuccessState title="Credential status updated" />}
      {mutation.isError && <ErrorState title="Verification update not confirmed" description={adminError(mutation.error)} onRetry={busy ? undefined : refresh} />}
      {!valid ? <EmptyState title="Invalid credential filters" description="Reset the filters to review pending credentials."><Button onClick={() => navigate(1, 'PENDING')}>Reset filters</Button></EmptyState> : <>
        {credentials.isPending && <LoadingState label="Loading credentials..." />}
        {credentials.isFetching && !credentials.isPending && <LoadingState label="Refreshing credentials..." />}
        {credentials.isError && <ErrorState title="Credentials unavailable" description={adminError(credentials.error)} onRetry={busy ? undefined : refresh} />}
        {data && <>
          {data.data.length ? <ul className="divide-y divide-line border-y border-line">{data.data.map(item => <li key={item.id} className="space-y-4 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg">{item.title}</h3><Badge>{verificationLabels[item.verificationStatus]}</Badge></div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-ink-muted">Issuer</dt><dd className="break-words">{item.issuer}</dd></div><div><dt className="text-ink-muted">Issued</dt><dd>{item.issuedAt ? new Date(item.issuedAt).toLocaleDateString() : 'Not specified'}</dd></div><div><dt className="text-ink-muted">Submitted</dt><dd>{new Date(item.createdAt).toLocaleDateString()}</dd></div><div><dt className="text-ink-muted">Artisan profile</dt><dd><Link to={`/artisans/${item.artisanId}`} className="inline-flex min-h-11 items-center break-all">{item.artisanId}</Link></dd></div></dl>
            <PrivateDocument key={`${item.id}:${data.documentExpiresAt}`} url={item.documentUrl} expiresAt={data.documentExpiresAt} />
            {selection?.id === item.id ? <div className="space-y-3 bg-surface-muted p-4" role="group" aria-label={`Confirm verification for ${item.title}`}><p>Mark {selection.title} as {verificationLabels[selection.status].toLowerCase()}?</p><p className="text-sm text-ink-muted">This affects the artisan's public verification summary. Another administrator's latest saved change takes precedence.</p><div className="flex flex-wrap gap-3"><Button pending={mutation.isPending} disabled={credentials.isFetching} onClick={submit}>{mutation.isPending ? 'Saving verification...' : 'Confirm status'}</Button><Button variant="secondary" disabled={mutation.isPending} onClick={() => setSelection(null)}>Cancel</Button></div></div> : <div className="flex flex-wrap gap-3">{verificationStatus.options.filter(value => value !== item.verificationStatus).map(value => <Button key={value} variant={value === 'VERIFIED' ? 'primary' : 'secondary'} disabled={busy || mutation.isError} onClick={() => { mutation.reset(); setSelection({ id: item.id, title: item.title, artisanId: item.artisanId, status: value }) }}>{value === 'PENDING' ? 'Reopen review' : value === 'VERIFIED' ? 'Verify credential' : 'Reject credential'}<span className="sr-only">: {item.title}</span></Button>)}</div>}
          </li>)}</ul> : <EmptyState title={page === 1 ? 'No credentials to review' : 'No credentials on this page'} description="Try another status filter or refresh for new submissions.">{page > 1 && <Button onClick={() => navigate(1)}>First page</Button>}</EmptyState>}
          <nav aria-label="Credential pages" className="flex flex-wrap items-center gap-4"><Button variant="secondary" disabled={page <= 1 || busy} onClick={() => navigate(page - 1)}>Previous</Button><span>Page {page} of {Math.max(1, data.pagination.totalPages)}</span><Button variant="secondary" disabled={page >= data.pagination.totalPages || busy} onClick={() => navigate(page + 1)}>Next</Button></nav>
        </>}
      </>}
    </section>
  </div>
}
