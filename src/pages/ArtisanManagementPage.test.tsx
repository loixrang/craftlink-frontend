import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'
import { profileFormSchema, profileDefaults, serviceFormSchema } from '../services/artisanManagement'
const session: AuthSession = { accessToken: 'token', user: { id: 'owner', email: 'owner@example.com', role: 'ARTISAN' } }
const owner = { id: 'profile-1', displayName: 'Ada Repairs', bio: 'Repairs', yearsExperience: 4, phone: null, whatsapp: null, city: 'Ikeja', state: 'Lagos', latitude: 6, longitude: 3, isAvailable: true, profileImageUrl: null }
const service = { id: 'service-1', categoryId: 'category-1', title: 'Repairs', description: 'Household repairs', priceFrom: 25 }
const detail = { ...owner, verificationStatus: 'PENDING', averageRating: null, reviewCount: 0, services: [service], portfolio: [], credentials: [] }
const response = (data: unknown) => new Response(JSON.stringify({ data }))
function mockApi(options: { missing?: boolean; write?: (init: RequestInit) => Promise<Response> } = {}) {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
    if (init?.method !== 'GET') return options.write ? options.write(init!) : response(owner)
    if (String(url).endsWith('/categories')) return response([{ id: 'category-1', name: 'Plumbing' }])
    if (String(url).endsWith('/artisans/me')) return options.missing ? new Response(JSON.stringify({ error: { code: 'ARTISAN_PROFILE_NOT_FOUND' } }), { status: 404 }) : response({ ...owner, privateDocument: 'secret' })
    return response(detail)
  })
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
function mount(current: AuthSession | null = session) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  const view = render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: current, status: current ? 'authenticated' : 'anonymous', signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}><MemoryRouter initialEntries={['/artisan/profile']}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>)
  return { ...view, client }
}
const change = (name: string, value: string) => fireEvent.change(screen.getByLabelText(new RegExp(name)), { target: { value } })
afterEach(() => vi.unstubAllGlobals())
it('loads owner fields only in an owner-scoped cache and saves exact authenticated profile fields', async () => {
  const fetcher = mockApi()
  const { client } = mount()
  expect(screen.getByText('Loading profile settings...')).toBeVisible()
  await screen.findByDisplayValue('Ada Repairs')
  expect(client.getQueryData(['editable-artisan-profile', 'owner'])).toEqual(owner)
  change('Business name', ' Updated name ')
  fireEvent.click(screen.getByRole('button', { name: 'Clear coordinates' }))
  fireEvent.click(screen.getByLabelText('Available for work'))
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  await screen.findByText('Profile saved')
  const call = fetcher.mock.calls.find(([, init]) => init?.method === 'PUT')!
  expect(call[0]).toBe('/api/v1/artisans/me')
  expect(new Headers(call[1]?.headers).get('Authorization')).toBe('Bearer token')
  expect(JSON.parse(String(call[1]?.body))).toEqual({ displayName: 'Updated name', bio: 'Repairs', yearsExperience: 4, phone: null, whatsapp: null, city: 'Ikeja', state: 'Lagos', latitude: null, longitude: null, isAvailable: false, profileImageUrl: null })
})
it('supports missing-profile setup and blocks invalid submission', async () => {
  const fetcher = mockApi({ missing: true }); mount()
  await screen.findByText('Set up your profile')
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  await screen.findByText('Check the highlighted profile fields.')
  expect(fetcher.mock.calls.every(([, init]) => init?.method === 'GET')).toBe(true)
  expect(screen.queryByText('Your services')).not.toBeInTheDocument()
  change('Business name', 'New business'); change('City', 'Ikeja'); change('State', 'Lagos')
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  await screen.findByText('Profile saved')
  expect(await screen.findByText('Your services')).toBeVisible()
})
it.each([401, 403, 422, 429, 503])('preserves draft on %s and allows correction/retry', async status => {
  mockApi({ write: async () => new Response('{}', { status }) }); mount()
  await screen.findByDisplayValue('Ada Repairs'); change('Business name', 'Unsaved name')
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  await screen.findByText('Profile save not confirmed')
  expect(screen.getByLabelText(/Business name/)).toHaveValue('Unsaved name')
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled()
})
it('prevents duplicate writes while saving', async () => {
  let resolve!: (response: Response) => void
  const fetcher = mockApi({ write: () => new Promise(done => { resolve = done }) }); mount()
  await screen.findByDisplayValue('Ada Repairs')
  fireEvent.submit(screen.getByRole('form', { name: 'Business profile' }))
  fireEvent.submit(screen.getByRole('form', { name: 'Business profile' }))
  await waitFor(() => expect(fetcher.mock.calls.filter(([, i]) => i?.method === 'PUT')).toHaveLength(1))
  expect(screen.getByRole('button', { name: 'Saving profile...' })).toBeDisabled()
  await act(async () => resolve(response(owner)))
  await screen.findByText('Profile saved')
})
it('creates and edits services with exact payload and refreshes list', async () => {
  const fetcher = mockApi(); mount(); await screen.findByText('Your services')
  fireEvent.click(await screen.findByRole('button', { name: 'Add service' }))
  await screen.findByRole('form', { name: 'New service' })
  change('Category', 'category-1'); change('Service title', ' New service '); change('Service description', ' Description '); change('Starting price', '0')
  fireEvent.click(screen.getByRole('button', { name: 'Save service' }))
  await screen.findByText('Service saved')
  const call = fetcher.mock.calls.find(([, i]) => i?.method === 'POST')!
  expect(call[0]).toBe('/api/v1/artisans/me/services')
  expect(JSON.parse(String(call[1]?.body))).toEqual({ categoryId: 'category-1', title: 'New service', description: 'Description', priceFrom: 0 })
  expect(new Headers(call[1]?.headers).get('Authorization')).toBe('Bearer token')
  fireEvent.click(screen.getByRole('button', { name: 'Edit Repairs' }))
  change('Starting price', '')
  fireEvent.click(screen.getByRole('button', { name: 'Save service' }))
  await screen.findByText('Service saved')
  const patch = fetcher.mock.calls.find(([, i]) => i?.method === 'PATCH')!
  expect(patch[0]).toBe('/api/v1/artisans/me/services/service-1')
  expect(JSON.parse(String(patch[1]?.body)).priceFrom).toBeNull()
  expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/artisans/profile-1')).length).toBeGreaterThan(1)
})
it('requires confirmation for deleting a service and supports cancellation', async () => {
  const fetcher = mockApi(); mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Delete Repairs' }))
  expect(fetcher.mock.calls.some(([, i]) => i?.method === 'DELETE')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Cancel deletion' }))
  fireEvent.click(screen.getByRole('button', { name: 'Delete Repairs' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))
  await screen.findByText('Service deleted')
  expect(fetcher.mock.calls.find(([, i]) => i?.method === 'DELETE')?.[0]).toBe('/api/v1/artisans/me/services/service-1')
})
it('keeps service input after failed save', async () => {
  mockApi({ write: async () => new Response('{}', { status: 409 }) }); mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Edit Repairs' }))
  change('Service title', 'Updated repairs')
  fireEvent.click(screen.getByRole('button', { name: 'Save service' }))
  await screen.findByText('Service save not confirmed')
  expect(screen.getByLabelText(/Service title/)).toHaveValue('Updated repairs')
})
it('uses browser coordinates only as a draft and ignores callbacks after manual edits', async () => {
  let success!: PositionCallback
  const getCurrentPosition = vi.fn((callback: PositionCallback) => { success = callback })
  vi.stubGlobal('isSecureContext', true); vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
  const fetcher = mockApi(); mount(); await screen.findByDisplayValue('Ada Repairs')
  expect(getCurrentPosition).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Use my location' }))
  act(() => success({ coords: { latitude: 0, longitude: 0 } } as GeolocationPosition))
  expect(screen.getByLabelText('Latitude')).toHaveValue('0')
  expect(fetcher.mock.calls.every(([, i]) => i?.method === 'GET')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Use my location' }))
  change('Latitude', '12')
  act(() => success({ coords: { latitude: 40, longitude: 30 } } as GeolocationPosition))
  expect(screen.getByLabelText('Latitude')).toHaveValue('12')
})
it('offers manual fallback on browser permission denial', async () => {
  vi.stubGlobal('isSecureContext', true); vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: (_s: PositionCallback, fail: PositionErrorCallback) => fail({ code: 1 } as GeolocationPositionError) } })
  mockApi(); mount(); await screen.findByDisplayValue('Ada Repairs')
  fireEvent.click(screen.getByRole('button', { name: 'Use my location' }))
  expect(screen.getByText(/Location permission was denied/)).toBeVisible()
  expect(screen.getByLabelText(/City/)).toBeEnabled()
})
it.each(['CUSTOMER', 'ADMIN'] as const)('blocks %s from management', role => {
  const fetcher = mockApi(); mount({ ...session, user: { ...session.user, role } })
  expect(screen.getByText('Access unavailable')).toBeVisible(); expect(fetcher).not.toHaveBeenCalled()
})
it('validates paired coordinates, boundaries, unsafe image URLs and price precision', () => {
  const defaults = profileDefaults(owner)
  expect(profileFormSchema.safeParse({ ...defaults, latitude: '0', longitude: '0' }).success).toBe(true)
  for (const values of [{ latitude: '91' }, { longitude: '' }, { latitude: 'NaN' }, { profileImageUrl: 'javascript:alert(1)' }]) expect(profileFormSchema.safeParse({ ...defaults, ...values }).success).toBe(false)
  for (const priceFrom of ['-1', '1.234', 'Infinity']) expect(serviceFormSchema.safeParse({ ...service, priceFrom }).success).toBe(false)
})
it('shows load failure, retries, and cancels owner reads on unmount', async () => {
  const fetcher = mockApi()
  fetcher.mockResolvedValueOnce(response({ ...owner, latitude: 'invalid' }))
  const view = mount()
  await screen.findByText('Settings unavailable')
  expect(screen.queryByRole('form')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await screen.findByDisplayValue('Ada Repairs')
  view.unmount()
  fetcher.mockImplementation(() => new Promise(() => {}))
  const pending = mount()
  await waitFor(() => expect(fetcher.mock.calls.at(-1)?.[0]).toBe('/api/v1/artisans/me'))
  pending.unmount()
  expect(fetcher.mock.calls.at(-1)?.[1]?.signal?.aborted).toBe(true)
})
it('does not repopulate owner cache when a save completes after leaving the page', async () => {
  let resolve!: (response: Response) => void
  const fetcher = mockApi({ write: () => new Promise(done => { resolve = done }) })
  const view = mount(); await screen.findByDisplayValue('Ada Repairs')
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  await waitFor(() => expect(fetcher.mock.calls.some(([, i]) => i?.method === 'PUT')).toBe(true))
  view.unmount(); view.client.clear()
  await act(async () => resolve(response(owner)))
  expect(view.client.getQueryData(['editable-artisan-profile', 'owner'])).toBeUndefined()
})
it('shows empty services and permits cancelling when categories are empty', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async url => response(String(url).endsWith('/categories') ? [] : String(url).endsWith('/artisans/me') ? owner : { ...detail, services: [] }))
  mount(); await screen.findByText('No services yet')
  fireEvent.click(screen.getByRole('button', { name: 'Add service' }))
  await screen.findByText('No categories available')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel service editing' }))
  expect(screen.getByRole('button', { name: 'Add service' })).toBeEnabled()
})
