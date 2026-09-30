import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'
import { getIncomingRequests, requestActions, updateIncomingRequest, type IncomingRequest } from '../services/incomingRequests'

const id = 'c567fcea-841e-4be7-95f4-55487865b403'
const item: IncomingRequest = { id, artisanId: id, serviceId: null, serviceTitle: 'Kitchen repair', description: 'Repair the kitchen cabinets.', preferredDate: null, status: 'PENDING', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }
const session: AuthSession = { accessToken: 'token', user: { id: 'owner', email: 'ada@example.com', role: 'ARTISAN' } }
const response = (data: unknown) => new Response(JSON.stringify({ data }))
function collection(items: IncomingRequest[] = [item], page = 1, total = items.length) {
  return new Response(JSON.stringify({ data: items, pagination: { page, limit: 20, total, totalPages: Math.ceil(total / 20) } }))
}
function mount(path = '/artisan/requests', current: AuthSession | null = session) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: current, status: current ? 'authenticated' : 'anonymous', signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>)
  return { ...view, client }
}
function mockApi() {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => collection())
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
async function openDetails() {
  await screen.findByText('Kitchen repair')
  fireEvent.click(screen.getByText('View request details'))
  // jsdom does not consistently implement native details activation.
  screen.getByText('View request details').closest('details')!.open = true
}
afterEach(() => vi.unstubAllGlobals())

it('loads authenticated, account-scoped requests, keeps deleted-service details and strips private extras', async () => {
  const fetcher = mockApi()
  fetcher.mockResolvedValueOnce(collection([{ ...item, customerId: 'private', documentUrl: 'private' } as IncomingRequest]))
  const { client } = mount(); await openDetails()
  expect(screen.getByText(item.description)).toBeVisible()
  expect(screen.getByText(/This service has been removed/)).toBeVisible()
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/v1/service-requests/me?page=1&limit=20')
  expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer token')
  expect(JSON.stringify(client.getQueryData(['incoming-requests', 'owner', 1]))).not.toContain('private')
})
it.each([
  ['PENDING', ['ACCEPTED', 'DECLINED']], ['ACCEPTED', ['IN_PROGRESS']], ['IN_PROGRESS', ['COMPLETED']],
  ['COMPLETED', []], ['DECLINED', []], ['CANCELLED', []],
] as const)('only exposes permitted transitions from %s', (status, expected) => {
  expect(requestActions(status)).toEqual(expected)
})
it('confirms an exact PATCH, prevents duplicate submission and refreshes the status', async () => {
  const fetcher = mockApi()
  let current = item
  let resolve!: (value: Response) => void
  fetcher.mockImplementation(async (_url, init) => init?.method === 'PATCH' ? new Promise(done => { resolve = done }) : collection([current]))
  mount(); await openDetails()
  fireEvent.click(screen.getByRole('button', { name: 'Accept request' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(fetcher.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Accept request' }))
  const confirm = screen.getByRole('button', { name: 'Confirm change' })
  fireEvent.click(confirm); fireEvent.click(confirm)
  await waitFor(() => expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PATCH')).toHaveLength(1))
  expect(screen.getByRole('button', { name: 'Updating status...' })).toBeDisabled()
  const call = fetcher.mock.calls.find(([, init]) => init?.method === 'PATCH')!
  expect(call[0]).toBe(`/api/v1/service-requests/${id}/status`)
  expect(JSON.parse(call[1]?.body as string)).toEqual({ status: 'ACCEPTED' })
  expect(new Headers(call[1]?.headers).get('Authorization')).toBe('Bearer token')
  current = { ...item, status: 'ACCEPTED' }
  await act(async () => resolve(response(current)))
  expect(await screen.findByText('Request status updated')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Start work' })).toBeEnabled()
  expect(screen.queryByRole('button', { name: 'Accept request' })).not.toBeInTheDocument()
})
it.each([401, 403, 404, 409, 503])('handles failed mutations (%s) and refreshes before retry', async status => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async (_url, init) => init?.method === 'PATCH' ? new Response('{}', { status }) : collection())
  mount(); await openDetails()
  fireEvent.click(screen.getByRole('button', { name: 'Decline request' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm change' }))
  expect(await screen.findByText('Status update not confirmed')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Decline request' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Decline request' })).toBeEnabled())
})
it('paginates using the URL and supports returning from an empty page', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async url => String(url).includes('page=2') ? collection([], 2, 0) : collection())
  mount('/artisan/requests?page=2')
  await screen.findByText('No requests on this page')
  fireEvent.click(screen.getByRole('button', { name: 'First page' }))
  await screen.findByText('Kitchen repair')
  expect(fetcher.mock.calls.at(-1)?.[0]).toBe('/api/v1/service-requests/me?page=1&limit=20')
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
})
it.each(['0', 'NaN', '1000001', '-1', '1.5'])('rejects invalid page %s without fetching', page => {
  const fetcher = mockApi(); mount(`/artisan/requests?page=${page}`)
  expect(screen.getByText('Invalid request page')).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()
})
it('moves between full pages with next and previous controls', async () => {
  const fetcher = mockApi()
  const firstPage = Array.from({ length: 20 }, (_, i) => ({ ...item, id: `c567fcea-841e-4be7-95f4-${String(i).padStart(12, '0')}`, serviceTitle: `Project ${i}` }))
  fetcher.mockImplementation(async url => String(url).includes('page=2') ? collection([item], 2, 21) : collection(firstPage, 1, 21))
  mount(); await screen.findByText('Page 1 of 2')
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  await screen.findByText('Page 2 of 2'); expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  expect(screen.getByText('Kitchen repair')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
  await screen.findByText('Page 1 of 2'); expect(screen.getByText('Project 0')).toBeVisible()
})
it('shows loading, empty and recoverable errors and hides stale data on refresh failure', async () => {
  const fetcher = mockApi(); fetcher.mockResolvedValueOnce(new Response('{}', { status: 503 }))
  mount(); expect(screen.getByText('Loading incoming requests...')).toBeVisible()
  await screen.findByText('Requests unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' })); await screen.findByText('Kitchen repair')
  fetcher.mockResolvedValueOnce(new Response('{}', { status: 503 }))
  fireEvent.click(screen.getByRole('button', { name: 'Refresh requests' })); await screen.findByText('Requests unavailable')
  expect(screen.queryByText('Kitchen repair')).not.toBeInTheDocument()
  fetcher.mockResolvedValueOnce(collection([]))
  fireEvent.click(screen.getByRole('button', { name: 'Try again' })); await screen.findByText('No incoming requests yet')
})
it.each(['CUSTOMER', 'ADMIN'] as const)('blocks %s access without fetching', role => {
  const fetcher = mockApi(); mount('/artisan/requests', { ...session, user: { ...session.user, role } })
  expect(screen.getByText('Access unavailable')).toBeVisible(); expect(fetcher).not.toHaveBeenCalled()
})
it('redirects anonymous visitors to login without fetching requests', () => {
  const fetcher = mockApi(); mount('/artisan/requests', null)
  expect(screen.getByRole('heading', { name: /Log in/ })).toBeVisible(); expect(fetcher).not.toHaveBeenCalled()
})
it('aborts loading on unmount', async () => {
  const fetcher = mockApi(); fetcher.mockImplementation(() => new Promise(() => {}))
  const view = mount(); await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  view.unmount(); expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
})
it('rejects invalid collections and unconfirmed status responses', async () => {
  const fetcher = mockApi(); fetcher.mockResolvedValueOnce(collection([{ ...item, status: 'UNKNOWN' } as unknown as IncomingRequest]))
  await expect(getIncomingRequests(1, 'token', new AbortController().signal)).rejects.toThrow('Incoming requests could not be read')
  fetcher.mockResolvedValueOnce(response(item))
  await expect(updateIncomingRequest(item, 'ACCEPTED', 'token')).rejects.toThrow('Status update could not be confirmed')
  await expect(updateIncomingRequest({ ...item, status: 'COMPLETED' }, 'ACCEPTED', 'token')).rejects.toThrow('This action is not available')
})
