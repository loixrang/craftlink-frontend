import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'
import { serviceRequestSchema } from '../schemas/serviceRequest'

const session: AuthSession = { accessToken: 'private-token', user: { id: 'c1', email: 'c@example.com', role: 'CUSTOMER' } }
const profile = { id: 'ada', displayName: 'Ada Works', bio: null, yearsExperience: 4, city: null, state: null, isAvailable: true, profileImageUrl: null, phone: null, whatsapp: null, verificationStatus: 'PENDING', averageRating: null, reviewCount: 0, services: [{ id: 's1', categoryId: 'cat', title: 'Sink repair', description: 'Leaks' }], portfolio: [], credentials: [] }
const response = (data: unknown = profile) => new Response(JSON.stringify({ data }))
afterEach(() => vi.unstubAllGlobals())
function Location() { const location = useLocation(); return <output>{JSON.stringify(location.state)}</output> }
function mount(current: AuthSession | null = session, status: 'authenticated' | 'anonymous' | 'restoring' = current ? 'authenticated' : 'anonymous') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  return { client, ...render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: current, status, retry: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }}><MemoryRouter initialEntries={['/customer/requests/new/ada']}><AppRoutes /><Location /></MemoryRouter></AuthContext.Provider></QueryClientProvider>) }
}
async function fill() {
  await screen.findByRole('option', { name: 'Sink repair' })
  fireEvent.change(screen.getByLabelText('Service'), { target: { value: 's1' } })
  fireEvent.change(screen.getByLabelText('Describe your project'), { target: { value: '  Fix my leaking sink.  ' } })
}
function submit() { fireEvent.submit(screen.getByRole('form', { name: 'Service request' })) }

it.each([false, true])('sends exact authenticated payload with optional date %s and prevents duplicate submission', async withDate => {
  let resolve!: (value: Response) => void
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(response()).mockImplementationOnce(() => new Promise(r => { resolve = r }))
  vi.stubGlobal('fetch', fetcher)
  const { client } = mount()
  expect(screen.getByText('Loading artisan services...')).toBeVisible()
  await fill()
  if (withDate) fireEvent.change(screen.getByLabelText('Preferred date (optional)'), { target: { value: '2026-12-10' } })
  submit(); submit()
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  expect(screen.getByRole('button', { name: 'Sending request...' })).toBeDisabled()
  const [url, options] = fetcher.mock.calls[1]!
  expect(url).toBe('/api/v1/service-requests')
  expect(options?.method).toBe('POST')
  expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer private-token')
  expect(JSON.parse(options?.body as string)).toEqual({ artisanId: 'ada', serviceId: 's1', description: 'Fix my leaking sink.', ...(withDate ? { preferredDate: '2026-12-10T00:00:00.000Z' } : {}) })
  expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).has('Authorization')).toBe(false)
  await act(async () => resolve(response({})))
  expect(await screen.findByText('Request sent')).toBeVisible()
  expect(screen.queryByRole('form')).not.toBeInTheDocument()
  expect(JSON.stringify(client.getMutationCache().getAll().map(m => m.state))).not.toContain('private-token')
})

it('validates empty and whitespace-only fields without posting', async () => {
  const fetcher = vi.fn().mockResolvedValue(response()); vi.stubGlobal('fetch', fetcher)
  mount(); await screen.findByRole('option', { name: 'Sink repair' })
  fireEvent.change(screen.getByLabelText('Describe your project'), { target: { value: '   ' } }); submit()
  expect(await screen.findByText('Choose a service.')).toBeVisible()
  expect(screen.getByText('Describe the work you need.')).toBeVisible()
  expect(fetcher).toHaveBeenCalledTimes(1)
})
it.each(['2026-02-30', 'garbage'])('rejects invalid preferred date %s', preferredDate => {
  expect(serviceRequestSchema.safeParse({ serviceId: 's1', description: 'Fix', preferredDate }).success).toBe(false)
})
it.each([400, 401, 403, 404, 409, 422, 429, 503, 0])('preserves input after error %s and never retries automatically', async status => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(response())
  if (status) fetcher.mockResolvedValueOnce(new Response('{}', { status }))
  else fetcher.mockRejectedValueOnce(new TypeError('offline'))
  fetcher.mockResolvedValueOnce(response({}))
  vi.stubGlobal('fetch', fetcher); mount(); await fill(); submit()
  expect(await screen.findByRole('alert')).toHaveTextContent('Request not confirmed')
  expect(screen.getByLabelText('Describe your project')).toHaveValue('  Fix my leaking sink.  ')
  expect(fetcher).toHaveBeenCalledTimes(2)
  if (status === 0 || status === 503) expect(screen.getByRole('alert')).toHaveTextContent('duplicate')
  submit(); expect(await screen.findByText('Request sent')).toBeVisible()
})
it('offers profile loading retry and an empty services state', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(response({ ...profile, services: [] })))
  mount(); expect(await screen.findByRole('alert')).toHaveTextContent('Services unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('No services to request')).toBeVisible()
  expect(screen.queryByRole('form')).not.toBeInTheDocument()
})
it.each(['ARTISAN', 'ADMIN'] as const)('denies %s without requests', role => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher)
  mount({ ...session, user: { ...session.user, role } })
  expect(screen.getByText('Access unavailable')).toBeVisible(); expect(fetcher).not.toHaveBeenCalled()
})
it.each(['anonymous', 'restoring'] as const)('withholds form while %s', status => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); mount(null, status)
  expect(screen.queryByRole('form', { name: 'Service request' })).not.toBeInTheDocument()
  if (status === 'anonymous') expect(screen.getByRole('status')).toHaveTextContent('/customer/requests/new/ada')
  expect(fetcher).not.toHaveBeenCalled()
})
it('cancels profile loading when the page unmounts', async () => {
  const fetcher = vi.fn<typeof fetch>().mockReturnValue(new Promise(() => {})); vi.stubGlobal('fetch', fetcher)
  const view = mount(); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  view.unmount(); expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
})

it('rejects a service not belonging to the loaded artisan', async () => {
  const fetcher = vi.fn().mockResolvedValue(response()); vi.stubGlobal('fetch', fetcher)
  mount(); await fill()
  const select = screen.getByLabelText('Service')
  const option = document.createElement('option'); option.value = 'foreign-service'; option.textContent = 'Foreign'
  select.appendChild(option)
  fireEvent.change(select, { target: { value: 'foreign-service' } }); submit()
  expect(await screen.findByText('Choose a service listed by this artisan.')).toBeVisible()
  expect(fetcher).toHaveBeenCalledTimes(1)
})
