import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'
import { requestStatuses } from '../services/serviceRequests'

const session: AuthSession = { accessToken: 'secret-token', user: { id: 'c1', email: 'customer@example.com', role: 'CUSTOMER' } }
const item = { id: 'r1', artisanId: 'a1', serviceId: 's1', description: 'Fix the kitchen tap', status: 'PENDING', preferredDate: '2026-10-02T00:00:00.000Z' }
const response = (data: unknown = [item], page = 1, total = 1) => new Response(JSON.stringify({ data, pagination: { page, limit: 20, total, totalPages: Math.ceil(total / 20) } }))
afterEach(() => vi.unstubAllGlobals())
function mount(path = '/customer/requests', current: AuthSession | null = session, status: 'authenticated' | 'anonymous' | 'restoring' = current ? 'authenticated' : 'anonymous') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  const view = render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: current, status, retry: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }}><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>)
  return { ...view, client }
}
it('loads authenticated history and opens details without a detail endpoint', async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  mount()
  expect(screen.getByText('Loading requests...')).toBeVisible()
  fireEvent.click(await screen.findByRole('link', { name: 'View request r1' }))
  expect(await screen.findByText('Service reference')).toBeVisible()
  expect(screen.getByText('2026-10-02')).toBeVisible()
  expect(screen.getByRole('link', { name: 'View artisan profile' })).toHaveAttribute('href', '/artisans/a1')
  for (const [url, options] of fetcher.mock.calls) {
    expect(url).toBe('/api/v1/service-requests/me?page=1&limit=20')
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer secret-token')
  }
  expect(document.body).not.toHaveTextContent('secret-token')
})
it.each(Object.entries(requestStatuses))('displays status %s', async (status, label) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([{ ...item, status }])))
  mount()
  expect(await screen.findByText(label)).toBeVisible()
})
it('paginates history and supports previous navigation', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(response([item], 1, 21)).mockResolvedValueOnce(response([{ ...item, id: 'r2' }], 2, 21))
  vi.stubGlobal('fetch', fetcher)
  mount()
  await screen.findByRole('link', { name: 'View request r1' })
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(await screen.findByRole('link', { name: 'View request r2' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
  expect(await screen.findByRole('link', { name: 'View request r1' })).toBeVisible()
})
it('resolves a direct detail link across collection pages', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(response([{ ...item, id: 'other' }], 1, 21)).mockResolvedValueOnce(response([item], 2, 21))
  vi.stubGlobal('fetch', fetcher)
  mount('/customer/requests/r1')
  expect(await screen.findByText('Service reference')).toBeVisible()
  expect(fetcher).toHaveBeenCalledTimes(2)
})
it.each(['/customer/requests', '/customer/requests/missing'])('shows empty or missing state at %s', async path => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([], 1, 0)))
  mount(path)
  expect(await screen.findByText(path.endsWith('missing') ? 'Request not found' : 'No requests yet')).toBeVisible()
})
it.each([401, 403, 503])('handles HTTP %s and retries', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}', { status })).mockResolvedValueOnce(response()))
  mount()
  expect(await screen.findByRole('alert')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText(item.description)).toBeVisible()
})
it('rejects malformed statuses', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([{ ...item, status: 'UNKNOWN' }])))
  mount()
  expect(await screen.findByRole('alert')).toBeVisible()
  expect(screen.queryByText(item.description)).not.toBeInTheDocument()
})
it('hides stale status after failed refresh', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response()).mockRejectedValueOnce(new TypeError('offline')))
  const { client } = mount()
  await screen.findByText('Pending')
  await act(async () => { await client.invalidateQueries({ queryKey: ['service-requests'] }) })
  expect(await screen.findByRole('alert')).toBeVisible()
  expect(screen.queryByText('Pending')).not.toBeInTheDocument()
})
it('cancels loading when leaving', async () => {
  const fetcher = vi.fn<typeof fetch>().mockReturnValue(new Promise(() => {}))
  vi.stubGlobal('fetch', fetcher)
  const view = mount()
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  view.unmount()
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
})
it.each(['ARTISAN', 'ADMIN'] as const)('denies %s without fetching private requests', role => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  mount('/customer/requests/r1', { ...session, user: { ...session.user, role } })
  expect(screen.getByRole('heading', { name: 'Access unavailable' })).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()
})
it.each(['anonymous', 'restoring'] as const)('withholds requests while %s', status => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  mount('/customer/requests', null, status)
  expect(screen.queryByRole('heading', { name: 'Request history' })).not.toBeInTheDocument()
  expect(fetcher).not.toHaveBeenCalled()
})
it('rejects invalid page links without a request', () => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  mount('/customer/requests?page=-2')
  expect(screen.getByText('Invalid history page')).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()
})
