import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../components/ui/Feedback'
import { ApiError } from '../services/api'
import { accountRole, accountStatus, getAdminUsers, updateAdminUserStatus, type AccountRole, type AccountStatus } from '../services/admin'

const pageSize = 20
const roleLabels: Record<AccountRole, string> = { CUSTOMER: 'Customer', ARTISAN: 'Artisan', ADMIN: 'Admin' }
const statusLabels: Record<AccountStatus, string> = { ACTIVE: 'Active', SUSPENDED: 'Suspended' }

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.'
    if (error.status === 403) return 'Your account no longer has access to administration.'
    if (error.code === 'USER_NOT_FOUND') return 'This account no longer exists. Refresh the list.'
    if (error.code === 'SELF_SUSPENSION_NOT_ALLOWED') return 'You cannot suspend your own administrator account.'
    if (error.status === 400) return 'The request could not be accepted. Refresh and try again.'
  }
  return 'We could not confirm the latest account information. Refresh before trying again.'
}

export function AdminUsersPage() {
  const { session } = useAuth()
  const client = useQueryClient()
  const [params, setParams] = useSearchParams()
  const rawPage = params.get('page') ?? '1'
  const page = Number(rawPage)
  const rawRole = params.get('role') ?? 'ALL'
  const roleResult = rawRole === 'ALL' ? undefined : accountRole.safeParse(rawRole)
  const role = roleResult && 'success' in roleResult && roleResult.success ? roleResult.data : undefined
  const rawStatus = params.get('status') ?? 'ALL'
  const statusResult = rawStatus === 'ALL' ? undefined : accountStatus.safeParse(rawStatus)
  const status = statusResult && 'success' in statusResult && statusResult.success ? statusResult.data : undefined
  const valid = /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(page) && page <= 1_000_000
    && (rawRole === 'ALL' || (roleResult !== undefined && 'success' in roleResult && roleResult.success))
    && (rawStatus === 'ALL' || (statusResult !== undefined && 'success' in statusResult && statusResult.success))
  const scope = ['admin', session?.user.id]
  const users = useQuery({
    queryKey: [...scope, 'users', page, rawRole, rawStatus], enabled: session?.user.role === 'ADMIN' && valid,
    queryFn: ({ signal }) => getAdminUsers(page, pageSize, role, status, session!.accessToken, signal),
  })
  const [selection, setSelection] = useState<{ id: string; email: string; status: AccountStatus } | null>(null)
  const lock = useRef(false)
  const mutation = useMutation({
    retry: false,
    mutationFn: (change: NonNullable<typeof selection>) => updateAdminUserStatus(change.id, change.status, session!.accessToken),
    onSettled: async () => { await client.invalidateQueries({ queryKey: [...scope, 'users'] }); await client.invalidateQueries({ queryKey: [...scope, 'stats'] }) },
  })
  const navigate = (nextPage: number, nextRole = rawRole, nextStatus = rawStatus) => {
    setSelection(null); mutation.reset()
    const next = new URLSearchParams()
    if (nextPage !== 1) next.set('page', String(nextPage))
    if (nextRole !== 'ALL') next.set('role', nextRole)
    if (nextStatus !== 'ALL') next.set('status', nextStatus)
    setParams(next)
  }
  const refresh = () => { setSelection(null); mutation.reset(); void users.refetch() }
  const busy = users.isFetching || mutation.isPending
  const submit = () => {
    if (!selection || lock.current || busy) return
    lock.current = true
    mutation.mutate(selection, { onSettled: () => { lock.current = false; setSelection(null) } })
  }
  const data = users.isError ? undefined : users.data
  return <div className="space-y-8">
    <header><h1 className="text-3xl tracking-tight sm:text-4xl">User management</h1><p className="mt-3 max-w-2xl text-ink-muted">Review account roles and access status. Suspending an account prevents access until an administrator reactivates it.</p></header>
    <section aria-label="Account filters" className="flex flex-wrap items-end gap-4 border-y border-line py-5">
      <label className="grid gap-2 text-sm font-medium">Role<select className="min-h-11 rounded-control border border-control-border bg-surface px-3" value={rawRole} disabled={mutation.isPending} onChange={event => navigate(1, event.target.value)}><option value="ALL">All roles</option>{accountRole.options.map(value => <option key={value} value={value}>{roleLabels[value]}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-medium">Account status<select className="min-h-11 rounded-control border border-control-border bg-surface px-3" value={rawStatus} disabled={mutation.isPending} onChange={event => navigate(1, rawRole, event.target.value)}><option value="ALL">All statuses</option>{accountStatus.options.map(value => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></label>
      <Button variant="secondary" pending={busy} onClick={refresh}>Refresh accounts</Button>
    </section>
    {mutation.isSuccess && <SuccessState title="Account status updated" />}
    {mutation.isError && <ErrorState title="Account status update not confirmed" description={errorMessage(mutation.error)} onRetry={busy ? undefined : refresh} />}
    {!valid ? <EmptyState title="Invalid account filters" description="Reset the filters to review accounts."><Button onClick={() => navigate(1)}>Reset filters</Button></EmptyState> : <>
      {users.isPending && <LoadingState label="Loading accounts..." />}
      {users.isFetching && !users.isPending && <LoadingState label="Refreshing accounts..." />}
      {users.isError && <ErrorState title="Accounts unavailable" description={errorMessage(users.error)} onRetry={busy ? undefined : refresh} />}
      {data && (data.data.length ? <>
        <p role="status" className="text-sm text-ink-muted">Showing {data.data.length} of {data.pagination.total.toLocaleString()} accounts</p>
        <ul className="divide-y divide-line border-y border-line">{data.data.map(user => {
          const isSelf = user.id === session?.user.id
          const nextStatus: AccountStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
          return <li key={user.id} className="space-y-4 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-all text-lg font-semibold">{user.email}</h2><p className="mt-1 text-sm text-ink-muted">Joined <time dateTime={user.createdAt}>{new Date(user.createdAt).toLocaleDateString()}</time></p></div><div className="flex flex-wrap gap-2"><Badge>{roleLabels[user.role]}</Badge><Badge tone={user.status === 'ACTIVE' ? 'accent' : 'neutral'}>{statusLabels[user.status]}</Badge></div></div>
            {isSelf ? <p className="text-sm text-ink-muted">Your administrator account cannot be suspended here.</p> : <>
              {selection?.id === user.id ? <div className="space-y-3 bg-surface-muted p-4" role="group" aria-label={`Confirm ${nextStatus.toLowerCase()} for ${user.email}`}><p>{nextStatus === 'SUSPENDED' ? `Suspend ${user.email}? They will lose access until reactivated.` : `Reactivate ${user.email}?`}</p><div className="flex flex-wrap gap-3"><Button pending={mutation.isPending} disabled={users.isFetching} onClick={submit}>{mutation.isPending ? 'Saving status...' : 'Confirm status'}</Button><Button variant="secondary" disabled={mutation.isPending} onClick={() => setSelection(null)}>Cancel</Button></div></div> : <Button variant={nextStatus === 'SUSPENDED' ? 'secondary' : 'primary'} disabled={busy || mutation.isError} onClick={() => { mutation.reset(); setSelection({ id: user.id, email: user.email, status: nextStatus }) }}>{nextStatus === 'SUSPENDED' ? 'Suspend account' : 'Reactivate account'}<span className="sr-only">: {user.email}</span></Button>}
            </>}
          </li>
        })}</ul>
        <nav aria-label="Account pages" className="flex flex-wrap items-center gap-4"><Button variant="secondary" disabled={page <= 1 || busy} onClick={() => navigate(page - 1)}>Previous</Button><span>Page {page} of {Math.max(1, data.pagination.totalPages)}</span><Button variant="secondary" disabled={page >= data.pagination.totalPages || busy} onClick={() => navigate(page + 1)}>Next</Button></nav>
      </> : <EmptyState title="No accounts found" description="Try another role or status filter." />)}
    </>}
  </div>
}
