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

async function reviewSetup(post = vi.fn<() => Promise<Response>>().mockResolvedValue(new Response(JSON.stringify({ data: {} })))) {
  const fetcher = vi.fn().mockImplementation((_url: string, options: RequestInit) => options.method === 'POST'
    ? post() : Promise.resolve(response([{ ...item, status: 'COMPLETED' }])))
  vi.stubGlobal('fetch', fetcher)
  const view = mount('/customer/requests/r1')
  await screen.findByRole('form', { name: 'Review' })
  return { ...view, fetcher, post }
}
function fillReview() {
  fireEvent.change(screen.getByLabelText('Rating'), { target: { value: '5' } })
  fireEvent.change(screen.getByLabelText('Your review'), { target: { value: '  Thoughtful, tidy work.  ' } })
}
it.each(['PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'CANCELLED'])('does not offer reviews for %s', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([{ ...item, status }])))
  mount('/customer/requests/r1')
  await screen.findByText('Service reference')
  expect(screen.queryByRole('form', { name: 'Review' })).not.toBeInTheDocument()
})
it('validates rating and a nonblank comment before sending', async () => {
  const { post } = await reviewSetup()
  fireEvent.click(screen.getByRole('button', { name: 'Submit review' }))
  expect(await screen.findByText('Choose a rating from 1 to 5.')).toBeVisible()
  expect(screen.getByText('Describe your experience.')).toBeVisible()
  expect(post).not.toHaveBeenCalled()
})
it('submits the exact authenticated review and remembers success on navigation', async () => {
  const { fetcher, client } = await reviewSetup()
  client.setQueryData(['artisan-profile', 'a1'], {})
  client.setQueryData(['artisans', 'search'], {})
  fillReview()
  fireEvent.click(screen.getByRole('button', { name: 'Submit review' }))
  expect(await screen.findByText('Review submitted')).toBeVisible()
  const call = fetcher.mock.calls.find(([, options]) => options.method === 'POST')
  expect(call?.[0]).toBe('/api/v1/reviews')
  expect(JSON.parse(call?.[1].body)).toEqual({ serviceRequestId: 'r1', rating: 5, comment: 'Thoughtful, tidy work.' })
  expect(new Headers(call?.[1].headers).get('Authorization')).toBe('Bearer secret-token')
  expect(client.getQueryState(['artisan-profile', 'a1'])?.isInvalidated).toBe(true)
  expect(client.getQueryState(['artisans', 'search'])?.isInvalidated).toBe(true)
  fireEvent.click(screen.getByRole('link', { name: 'Back to request history' }))
  fireEvent.click(await screen.findByRole('link', { name: 'View request r1' }))
  expect(await screen.findByText('Review submitted')).toBeVisible()
  expect(screen.queryByRole('form', { name: 'Review' })).not.toBeInTheDocument()
  expect(JSON.stringify(client.getMutationCache().getAll().map(m => m.state))).not.toContain('secret-token')
})
it('disables pending controls and prevents duplicate events', async () => {
  let finish!: (response: Response) => void
  const post = vi.fn().mockReturnValue(new Promise<Response>(resolve => { finish = resolve }))
  await reviewSetup(post)
  fillReview()
  const form = screen.getByRole('form', { name: 'Review' })
  fireEvent.submit(form)
  fireEvent.submit(form)
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1))
  expect(screen.getByLabelText('Rating')).toBeDisabled()
  expect(screen.getByLabelText('Your review')).toBeDisabled()
  await act(async () => { finish(new Response(JSON.stringify({ data: {} }))) })
  expect(await screen.findByText('Review submitted')).toBeVisible()
})
it.each([400, 401, 403, 404, 409, 422, 429, 503])('handles review HTTP %s without retrying or losing inputs', async status => {
  const post = vi.fn().mockResolvedValue(new Response('{}', { status }))
  await reviewSetup(post)
  fillReview()
  fireEvent.click(screen.getByRole('button', { name: 'Submit review' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Review not confirmed')
  expect(screen.getByLabelText('Your review')).toHaveValue('  Thoughtful, tidy work.  ')
  expect(post).toHaveBeenCalledTimes(1)
  expect(screen.queryByText('Review submitted')).not.toBeInTheDocument()
})
it('recovers from an uncertain network result on explicit resubmission', async () => {
  const post = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(new Response(JSON.stringify({ data: {} })))
  await reviewSetup(post)
  fillReview()
  fireEvent.click(screen.getByRole('button', { name: 'Submit review' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('We could not confirm whether your review was received')
  fireEvent.click(screen.getByRole('button', { name: 'Submit review' }))
  expect(await screen.findByText('Review submitted')).toBeVisible()
  expect(post).toHaveBeenCalledTimes(2)
})
