import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'
import { getAdminArtisans } from '../services/admin'

const id = 'c567fcea-841e-4be7-95f4-55487865b403'
const adminId = '94382e91-a45f-43ab-8062-8b49574ecbd5'
const artisan = { id, email: 'artisan@example.com', accountStatus: 'ACTIVE', displayName: 'Ada Repairs', yearsExperience: 8, city: 'Ikeja', state: 'Lagos', isAvailable: true, verificationStatus: 'VERIFIED', averageRating: 4.8, reviewCount: 12, createdAt: '2026-09-01T00:00:00.000Z' }
const session: AuthSession = { accessToken: 'token', user: { id: adminId, email: 'admin@example.com', role: 'ADMIN' } }
const response = (data: unknown) => new Response(JSON.stringify(data))
const collection = (data: unknown[] = [artisan], page = 1, limit = 20, total = data.length) => ({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
function mount(path = '/admin/artisans', current: AuthSession | null = session) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return { ...render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: current, status: current ? 'authenticated' : 'anonymous', signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>), client }
}
function mockApi() {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => response(collection()))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('loads safe artisan summaries through the authenticated list contract', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async () => response(collection([{ ...artisan, phone: 'private', latitude: 6.5, credentials: [{ documentUrl: 'private' }] }])))
  const { client } = mount()
  expect(await screen.findByRole('heading', { name: 'Ada Repairs' })).toBeVisible()
  expect(screen.getByText('artisan@example.com')).toBeVisible()
  expect(screen.getByText('Ikeja, Lagos · 8 years experience')).toBeVisible()
  expect(screen.getByText(/4\.8 from 12 reviews/)).toBeVisible()
  expect(screen.getByText('Verified credentials')).toBeVisible()
  expect(screen.getByRole('link', { name: /View public profile/ })).toHaveAttribute('href', `/artisans/${id}`)
  expect(JSON.stringify(client.getQueryData(['admin', adminId, 'artisans', 1, 'ALL']))).not.toContain('phone')
  expect(JSON.stringify(client.getQueryData(['admin', adminId, 'artisans', 1, 'ALL']))).not.toContain('latitude')
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/v1/admin/artisans?page=1&limit=20')
  expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get('Authorization')).toBe('Bearer token')
})

it('filters owner status, paginates, and recovers empty out-of-range pages', async () => {
  const fetcher = mockApi()
  const firstPage = Array.from({ length: 20 }, (_, index) => ({ ...artisan, id: `c567fcea-841e-4be7-95f4-${String(index).padStart(12, '0')}`, displayName: `Artisan ${index}` }))
  fetcher.mockImplementation(async url => String(url).includes('page=2') ? response(collection([{ ...artisan, id: 'd567fcea-841e-4be7-95f4-55487865b403', displayName: 'Last Artisan' }], 2, 20, 21)) : response(collection(firstPage, 1, 20, 21)))
  mount('/admin/artisans?status=ACTIVE')
  await screen.findByText('Page 1 of 2')
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/v1/admin/artisans?page=1&limit=20&status=ACTIVE')
  fireEvent.change(screen.getByLabelText('Owner account status'), { target: { value: 'ALL' } })
  await screen.findByRole('heading', { name: 'Artisan 0' })
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  await screen.findByRole('heading', { name: 'Last Artisan' })
  expect(screen.getByText('Page 2 of 2')).toBeVisible()
  cleanup()
  const outOfRangeApi = mockApi()
  outOfRangeApi.mockImplementation(async url => response(String(url).includes('page=9') ? collection([], 9, 20, 0) : collection([], 1, 20, 0)))
  mount('/admin/artisans?page=9')
  await screen.findByText('No artisan profiles on this page')
  fireEvent.click(screen.getByRole('button', { name: 'First page' }))
  await screen.findByText('No artisan profiles found')
})

it('guards anonymous and wrong-role routes without making admin requests', async () => {
  const fetcher = mockApi()
  mount('/admin/artisans', null)
  expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()
  cleanup()
  mount('/admin/artisans', { ...session, user: { ...session.user, role: 'ARTISAN' } })
  expect(await screen.findByRole('heading', { name: 'Access unavailable' })).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()
})

it('rejects malformed, inconsistent and filter-mismatched service responses', async () => {
  const fetcher = mockApi()
  const signal = new AbortController().signal
  await expect(getAdminArtisans(1, 20, undefined, 'token', signal)).resolves.toEqual(collection())
  fetcher.mockResolvedValueOnce(response(collection([{ ...artisan, averageRating: 6 }])))
  await expect(getAdminArtisans(1, 20, undefined, 'token', signal)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  fetcher.mockResolvedValueOnce(response(collection([{ ...artisan, accountStatus: 'ACTIVE' }])))
  await expect(getAdminArtisans(1, 20, 'SUSPENDED', 'token', signal)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
})

it('shows explicit request failures and invalid URL filter recovery', async () => {
  const fetcher = mockApi()
  fetcher.mockResolvedValueOnce(new Response('{}', { status: 503 }))
  mount()
  expect(await screen.findByText('Artisan profiles unavailable')).toBeVisible()
  cleanup()
  mockApi()
  mount('/admin/artisans?page=0&status=INVALID')
  expect(screen.getByText('Invalid artisan filters')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Reset filters' })).toBeVisible()
})
