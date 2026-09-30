import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'
import { getAdminCredentials, getAdminStats, verifyCredential, type AdminCredential } from '../services/admin'

const id = 'c567fcea-841e-4be7-95f4-55487865b403'
const item: AdminCredential = { id, artisanId: id, title: 'Trade certificate', issuer: 'Trade school', issuedAt: null, verificationStatus: 'PENDING', documentUrl: 'https://example.com/private-download?signature=secret', createdAt: '2026-09-01T00:00:00.000Z' }
const stats = { users: 12, artisans: 7, serviceRequests: 23, reviews: 4, pendingCredentials: 1 }
const session: AuthSession = { accessToken: 'token', user: { id: 'admin-user', email: 'admin@example.com', role: 'ADMIN' } }
const response = (data: unknown) => new Response(JSON.stringify({ data }))
function collection(items: unknown[] = [item], page = 1, total = items.length) {
  return new Response(JSON.stringify({ data: items, pagination: { page, limit: 20, total, totalPages: Math.ceil(total / 20) } }))
}
function mount(path = '/admin', current: AuthSession | null = session) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: current, status: current ? 'authenticated' : 'anonymous', signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>)
  return { ...view, client }
}
function mockApi() {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async url => String(url).endsWith('/stats') ? response(stats) : collection())
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

it('loads real statistics and authenticated scoped credentials, strips unknown private fields', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async url => String(url).endsWith('/stats') ? response(stats) : collection([{ ...item, storageId: 'never-cache', account: 'never-cache' }]))
  const { client } = mount()
  expect(screen.getByText('Loading statistics...')).toBeVisible()
  expect(screen.getByText('Loading credentials...')).toBeVisible()
  await screen.findByText(item.title)
  expect(screen.getByText('23')).toBeVisible()
  expect(screen.getByText(item.issuer)).toBeVisible()
  const call = fetcher.mock.calls.find(([url]) => String(url).includes('/credentials'))!
  expect(call[0]).toBe('/api/v1/admin/credentials?page=1&limit=20&verificationStatus=PENDING')
  expect(new Headers(call[1]?.headers).get('Authorization')).toBe('Bearer token')
  expect(JSON.stringify(client.getQueryData(['admin', 'admin-user', 'credentials', 1, 'PENDING']))).not.toContain('never-cache')
  const link = screen.getByRole('link', { name: /Open private document/ })
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(link).toHaveAttribute('referrerpolicy', 'no-referrer')
  expect(link).toHaveAttribute('target', '_blank')
})
it.each(['CUSTOMER', 'ARTISAN'] as const)('denies %s without any admin requests', role => {
  const fetcher = mockApi(); mount('/admin', { ...session, user: { ...session.user, role } })
  expect(screen.getByText('Access unavailable')).toBeVisible(); expect(fetcher).not.toHaveBeenCalled()
})
it('redirects anonymous visitors without fetching', () => {
  const fetcher = mockApi(); mount('/admin', null)
  expect(screen.getByRole('heading', { name: /Log in/ })).toBeVisible(); expect(fetcher).not.toHaveBeenCalled()
})
it('confirms exact writes once, refreshes totals and filtered list, and invalidates public verification', async () => {
  const fetcher = mockApi()
  let updated = false
  let resolve!: (value: Response) => void
  fetcher.mockImplementation(async (url, init) => {
    if (init?.method === 'PATCH') return new Promise(done => { resolve = done })
    if (String(url).endsWith('/stats')) return response({ ...stats, pendingCredentials: updated ? 0 : 1 })
    return collection(updated ? [] : [item])
  })
  const { client } = mount()
  client.setQueryData(['artisan-profile', id], { verificationStatus: 'PENDING' })
  client.setQueryData(['artisans', {}], [])
  await screen.findByText(item.title)
  fireEvent.click(screen.getByRole('button', { name: /Verify credential/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(fetcher.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: /Verify credential/ }))
  const confirm = screen.getByRole('button', { name: 'Confirm status' })
  fireEvent.click(confirm); fireEvent.click(confirm)
  await waitFor(() => expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(1))
  expect(screen.getByRole('button', { name: 'Saving verification...' })).toBeDisabled()
  const call = fetcher.mock.calls.find(([, init]) => init?.method === 'PATCH')!
  expect(call[0]).toBe(`/api/v1/admin/credentials/${id}`)
  expect(JSON.parse(call[1]?.body as string)).toEqual({ verificationStatus: 'VERIFIED' })
  expect(new Headers(call[1]?.headers).get('Authorization')).toBe('Bearer token')
  updated = true
  await act(async () => resolve(response({ ...item, verificationStatus: 'VERIFIED' })))
  expect(await screen.findByText('Credential status updated')).toBeVisible()
  expect(screen.getByText('No credentials to review')).toBeVisible()
  expect(screen.getByText('0')).toBeVisible()
  expect(client.getQueryState(['artisan-profile', id])?.isInvalidated).toBe(true)
  expect(client.getQueryState(['artisans', {}])?.isInvalidated).toBe(true)
  expect(JSON.stringify(client.getMutationCache().getAll().map(m => m.state))).not.toContain('signature=secret')
})
it.each([
  ['VERIFIED', 'Reopen review', 'PENDING'], ['PENDING', 'Reject credential', 'REJECTED'],
] as const)('supports correction from %s with %s', async (initial, action, next) => {
  const fetcher = mockApi()
  let current = { ...item, verificationStatus: initial as AdminCredential['verificationStatus'] }
  fetcher.mockImplementation(async (url, init) => {
    if (init?.method === 'PATCH') { current = { ...current, verificationStatus: next }; return response(current) }
    return String(url).endsWith('/stats') ? response(stats) : collection([current])
  })
  mount('/admin?status=ALL'); await screen.findByText(item.title)
  fireEvent.click(screen.getByRole('button', { name: new RegExp(action) }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm status' }))
  await screen.findByText('Credential status updated')
  expect(fetcher.mock.calls.find(([, init]) => init?.method === 'PATCH')?.[1]?.body).toBe(JSON.stringify({ verificationStatus: next }))
})
it.each([401, 403, 404, 409, 503])('handles verification failure %s without retrying the write', async code => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async (url, init) => init?.method === 'PATCH' ? new Response('{}', { status: code }) : String(url).endsWith('/stats') ? response(stats) : collection())
  mount(); await screen.findByText(item.title)
  fireEvent.click(screen.getByRole('button', { name: /Reject credential/ })); fireEvent.click(screen.getByRole('button', { name: 'Confirm status' }))
  await screen.findByText('Verification update not confirmed')
  expect(screen.getByRole('button', { name: /Reject credential/ })).toBeDisabled()
  expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await waitFor(() => expect(screen.getByRole('button', { name: /Reject credential/ })).toBeEnabled())
})
it('paginates and resets to page one on a status change', async () => {
  const fetcher = mockApi()
  const firstPage = Array.from({ length: 20 }, (_, i) => ({ ...item, id: `c567fcea-841e-4be7-95f4-${String(i).padStart(12, '0')}`, title: `Certificate ${i}` }))
  fetcher.mockImplementation(async url => String(url).endsWith('/stats') ? response(stats) : String(url).includes('page=2') ? collection([item], 2, 21) : collection(firstPage, 1, 21))
  mount(); await screen.findByText('Page 1 of 2')
  fireEvent.click(screen.getByRole('button', { name: 'Next' })); await screen.findByText('Page 2 of 2')
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Verification status'), { target: { value: 'ALL' } })
  await screen.findByText('Page 1 of 2')
  expect(fetcher.mock.calls.at(-1)?.[0]).toBe('/api/v1/admin/credentials?page=1&limit=20')
})
it('recovers an empty out-of-range page', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async url => String(url).endsWith('/stats') ? response(stats) : String(url).includes('page=2') ? collection([], 2) : collection())
  mount('/admin?page=2'); await screen.findByText('No credentials on this page')
  fireEvent.click(screen.getByRole('button', { name: 'First page' })); await screen.findByText(item.title)
})
it.each(['page=0', 'page=1000001', 'page=NaN', 'status=INVALID'])('rejects invalid filters %s without credential fetch', async query => {
  const fetcher = mockApi(); mount(`/admin?${query}`)
  expect(screen.getByText('Invalid credential filters')).toBeVisible()
  await screen.findByText('23')
  expect(fetcher.mock.calls.every(([url]) => String(url).endsWith('/stats'))).toBe(true)
})
it('hides stale documents on failed refresh and recovers', async () => {
  const fetcher = mockApi(); mount(); await screen.findByText(item.title)
  fetcher.mockResolvedValueOnce(new Response('{}', { status: 503 }))
  fireEvent.click(screen.getByRole('button', { name: 'Refresh credentials' }))
  await screen.findByText('Credentials unavailable')
  expect(screen.queryByRole('link', { name: /Open private document/ })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' })); await screen.findByText(item.title)
})
it('allows credential review when statistics fail and retries statistics independently', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async url => String(url).endsWith('/stats') ? new Response('{}', { status: 503 }) : collection())
  mount(); await screen.findByText('Statistics unavailable'); expect(await screen.findByText(item.title)).toBeVisible()
  fetcher.mockImplementation(async url => String(url).endsWith('/stats') ? response(stats) : collection())
  fireEvent.click(screen.getByRole('button', { name: 'Try again' })); await screen.findByText('23')
})
it('handles null private documents without creating a link', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async url => String(url).endsWith('/stats') ? response(stats) : collection([{ ...item, documentUrl: null }]))
  mount(); await screen.findByText(/Document unavailable/)
  expect(screen.queryByRole('link', { name: /Open private document/ })).not.toBeInTheDocument()
})
it('expires private links and obtains a fresh link on explicit refresh', async () => {
  mockApi()
  vi.useFakeTimers()
  await act(async () => { mount() })
  await act(async () => { vi.advanceTimersByTime(10) })
  expect(screen.getByRole('link', { name: /Open private document/ })).toBeVisible()
  await act(async () => { vi.advanceTimersByTime(241_000) })
  expect(screen.getByText(/Document link expired/)).toBeVisible()
  expect(screen.queryByRole('link', { name: /Open private document/ })).not.toBeInTheDocument()
  vi.useRealTimers()
  fireEvent.click(screen.getByRole('button', { name: 'Refresh credentials' }))
  expect(await screen.findByRole('link', { name: /Open private document/ })).toBeVisible()
})
it('honors expired provider URLs immediately', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async url => String(url).endsWith('/stats') ? response(stats) : collection([{ ...item, documentUrl: 'https://example.com/download?expires_at=1' }]))
  mount(); await screen.findByText(/Document link expired/)
  expect(screen.queryByRole('link', { name: /Open private document/ })).not.toBeInTheDocument()
})
it('aborts admin reads on navigation and removes credential cache after unmount', async () => {
  const fetcher = mockApi(); fetcher.mockImplementation(() => new Promise(() => {}))
  const view = mount(); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  view.unmount()
  expect(fetcher.mock.calls.every(([, init]) => init?.signal?.aborted)).toBe(true)
  await waitFor(() => expect(view.client.getQueryCache().findAll({ queryKey: ['admin', 'admin-user', 'credentials'] })).toHaveLength(0))
})
it.each(['javascript:alert(1)', 'http://example.com/file', 'https://user:pass@example.com/file'])('rejects unsafe private document URL %s', async documentUrl => {
  const fetcher = mockApi(); fetcher.mockResolvedValueOnce(collection([{ ...item, documentUrl }]))
  await expect(getAdminCredentials(1, undefined, 'token', new AbortController().signal)).rejects.toThrow('Credentials could not be read')
})
it('rejects malformed statistics, pagination, mismatched filters and unconfirmed writes', async () => {
  const fetcher = mockApi()
  fetcher.mockResolvedValueOnce(response({ ...stats, users: -1 }))
  await expect(getAdminStats('token', new AbortController().signal)).rejects.toThrow('Statistics could not be read')
  fetcher.mockResolvedValueOnce(collection([item], 2))
  await expect(getAdminCredentials(1, undefined, 'token', new AbortController().signal)).rejects.toThrow('Credentials could not be read')
  fetcher.mockResolvedValueOnce(collection([item]))
  await expect(getAdminCredentials(1, 'VERIFIED', 'token', new AbortController().signal)).rejects.toThrow('Credentials could not be read')
  fetcher.mockResolvedValueOnce(response(item))
  await expect(verifyCredential(id, 'VERIFIED', 'token')).rejects.toThrow('Verification update could not be confirmed')
})
