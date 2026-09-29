import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'

const session: AuthSession = { accessToken: 'private-token', user: { id: 'customer-1', email: 'customer@example.com', role: 'CUSTOMER' } }
const categoryData = [{ id: 'plumbing-1', name: 'Plumbing' }, { id: 'fashion/id &1', name: 'Tailoring' }]
const response = (data: unknown = categoryData) => new Response(JSON.stringify({ data }))
afterEach(() => vi.unstubAllGlobals())

function Location() {
  const location = useLocation()
  return <output aria-label="Location">{location.pathname + location.search}</output>
}
function mount(currentSession: AuthSession | null = session, status: 'authenticated' | 'anonymous' | 'restoring' = currentSession ? 'authenticated' : 'anonymous') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  const view = render(<QueryClientProvider client={client}>
    <AuthContext.Provider value={{ session: currentSession, status, retry: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }}>
      <MemoryRouter initialEntries={['/customer']}><AppRoutes /><Location /></MemoryRouter>
    </AuthContext.Provider>
  </QueryClientProvider>)
  return { ...view, client }
}

it('shows the signed-in customer and loads real categories without exposing credentials', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response())
  vi.stubGlobal('fetch', fetcher)
  mount()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Customer dashboard')
  expect(screen.getByText('customer@example.com')).toBeVisible()
  expect(screen.getByText('Loading services...')).toBeVisible()
  expect(await screen.findByRole('link', { name: 'Plumbing' })).toHaveAttribute('href', '/artisans?categoryId=plumbing-1')
  expect(screen.getByRole('link', { name: 'Tailoring' })).toHaveAttribute('href', '/artisans?categoryId=fashion%2Fid+%261')
  expect(screen.getByRole('link', { name: 'Browse all artisans' })).toHaveAttribute('href', '/artisans')
  expect(document.body).not.toHaveTextContent('private-token')
  expect(fetcher).toHaveBeenCalledTimes(1)
  const [url, options] = fetcher.mock.calls[0]!
  expect(url).toBe('/api/v1/categories')
  expect(new Headers(options?.headers).has('Authorization')).toBe(false)
  expect(options?.signal).toBeInstanceOf(AbortSignal)
  expect(screen.getByRole('link', { name: 'View request history' })).toBeVisible()
})

it.each([['  repair & fit  ', '/artisans?q=repair+%26+fit'], ['   ', '/artisans']])('searches using trimmed keyword %j', async (keyword, target) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()))
  mount()
  await screen.findByRole('link', { name: 'Plumbing' })
  fireEvent.change(screen.getByRole('searchbox', { name: 'Service or keyword' }), { target: { value: keyword } })
  fireEvent.submit(screen.getByRole('form', { name: 'Search for artisans' }))
  expect(screen.getByLabelText('Location')).toHaveTextContent(target)
  expect(screen.getByRole('heading', { name: 'Find an artisan' })).toBeVisible()
})

it('opens discovery with the selected server category', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()))
  mount()
  fireEvent.click(await screen.findByRole('link', { name: 'Tailoring' }))
  expect(screen.getByLabelText('Location')).toHaveTextContent('/artisans?categoryId=fashion%2Fid+%261')
  expect(screen.getByText('Selected: Tailoring')).toBeVisible()
})

it('keeps discovery available for an empty category collection', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([])))
  mount()
  expect(await screen.findByText('No service categories yet')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Search artisans' })).toBeEnabled()
  expect(screen.queryByRole('link', { name: 'Plumbing' })).not.toBeInTheDocument()
})

it.each(['network', 'server', 'malformed'])('recovers from %s category failure without losing the dashboard', async failure => {
  const fetcher = vi.fn<typeof fetch>()
  if (failure === 'network') fetcher.mockRejectedValueOnce(new TypeError('offline'))
  else fetcher.mockResolvedValueOnce(failure === 'server' ? new Response('{}', { status: 503 }) : response([{ name: 'Missing ID' }]))
  fetcher.mockResolvedValueOnce(response())
  vi.stubGlobal('fetch', fetcher)
  mount()
  expect(await screen.findByRole('alert')).toHaveTextContent('Services are unavailable')
  expect(screen.getByText('customer@example.com')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Search artisans' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('link', { name: 'Plumbing' })).toBeVisible()
})

it('announces refresh and hides categories after a failed refresh', async () => {
  let rejectRefresh!: (error: Error) => void
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(response()).mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectRefresh = reject }))
  vi.stubGlobal('fetch', fetcher)
  const { client } = mount()
  await screen.findByRole('link', { name: 'Plumbing' })
  act(() => { void client.invalidateQueries({ queryKey: ['categories'] }) })
  expect(await screen.findByText('Refreshing services...')).toBeVisible()
  await act(async () => { rejectRefresh(new TypeError('offline')) })
  expect(await screen.findByRole('alert')).toBeVisible()
  expect(screen.queryByRole('link', { name: 'Plumbing' })).not.toBeInTheDocument()
})

it('cancels category loading when leaving the dashboard', async () => {
  const fetcher = vi.fn<typeof fetch>().mockReturnValue(new Promise(() => {}))
  vi.stubGlobal('fetch', fetcher)
  const view = mount()
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  const signal = fetcher.mock.calls[0]?.[1]?.signal
  view.unmount()
  expect(signal?.aborted).toBe(true)
})

it.each(['ARTISAN', 'ADMIN'] as const)('denies %s access without fetching categories', role => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  mount({ ...session, user: { ...session.user, role } })
  expect(screen.getByRole('heading', { name: 'Access unavailable' })).toBeVisible()
  expect(screen.queryByText('customer@example.com')).not.toBeInTheDocument()
  expect(fetcher).not.toHaveBeenCalled()
})

it.each(['anonymous', 'restoring'] as const)('withholds dashboard content and requests while %s', status => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  mount(null, status)
  expect(screen.queryByRole('heading', { name: 'Customer dashboard' })).not.toBeInTheDocument()
  if (status === 'anonymous') expect(screen.getByRole('heading', { name: 'Log in' })).toBeVisible()
  else expect(screen.getByText(/Restoring your session/)).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()
})
