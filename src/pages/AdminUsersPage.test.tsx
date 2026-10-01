import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'
import { getAdminUsers, updateAdminUserStatus, type AdminUser } from '../services/admin'

const id = 'c567fcea-841e-4be7-95f4-55487865b403'
const adminId = '94382e91-a45f-43ab-8062-8b49574ecbd5'
const user: AdminUser = { id, email: 'customer@example.com', role: 'CUSTOMER', status: 'ACTIVE', createdAt: '2026-09-01T00:00:00.000Z' }
const adminUser: AdminUser = { id: adminId, email: 'admin@example.com', role: 'ADMIN', status: 'ACTIVE', createdAt: '2026-08-01T00:00:00.000Z' }
const session: AuthSession = { accessToken: 'token', user: { id: adminId, email: 'admin@example.com', role: 'ADMIN' } }
const collection = (data: unknown[] = [user], page = 1, limit = 20, total = data.length) => ({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
const response = (data: unknown) => new Response(JSON.stringify(data))
function mount(path = '/admin/users', current: AuthSession | null = session) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: current, status: current ? 'authenticated' : 'anonymous', signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>)
}
function mockApi() {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => response(collection()))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
afterEach(() => vi.unstubAllGlobals())

it('lists accounts with contract filters, bearer auth, safe fields and self-suspension protection', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async () => response(collection([user, adminUser])))
  mount()
  expect(await screen.findByText(user.email)).toBeVisible()
  const call = fetcher.mock.calls[0]!
  expect(call[0]).toBe('/api/v1/admin/users?page=1&limit=20')
  expect(new Headers(call[1]?.headers).get('Authorization')).toBe('Bearer token')
  expect(screen.getByText('Customer', { selector: 'span' })).toBeVisible()
  expect(screen.getAllByText('Active', { selector: 'span' })).toHaveLength(2)
  expect(screen.getByText('Your administrator account cannot be suspended here.')).toBeVisible()
  expect(screen.getByRole('button', { name: /Suspend account/ })).toBeVisible()
})

it('applies filters, paginates, confirms status updates and refreshes the list', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async (url, init) => {
    if (init?.method === 'PATCH') return response({ data: { ...user, status: 'SUSPENDED' } })
    const page = Number(new URL(String(url), 'http://local').searchParams.get('page') ?? 1)
    return response(collection(page === 1 ? Array.from({ length: 20 }, (_, index) => index === 0 ? user : { ...user, id: `c567fcea-841e-4be7-95f4-${String(index).padStart(12, '0')}`, email: `customer${index}@example.com` }) : [{ ...user, email: 'last@example.com' }], page, 20, 21))
  })
  mount('/admin/users?role=CUSTOMER&status=ACTIVE')
  expect(await screen.findByText(user.email)).toBeVisible()
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/v1/admin/users?page=1&limit=20&role=CUSTOMER&status=ACTIVE')
  fireEvent.click(screen.getByRole('button', { name: `Suspend account: ${user.email}` }))
  expect(screen.getByText(`Suspend ${user.email}? They will lose access until reactivated.`)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Confirm status' }))
  expect(await screen.findByText('Account status updated')).toBeVisible()
  const write = fetcher.mock.calls.find(([, init]) => init?.method === 'PATCH')!
  expect(write[0]).toBe(`/api/v1/admin/users/${id}/status`)
  expect(JSON.parse(write[1]?.body as string)).toEqual({ status: 'SUSPENDED' })
  expect(await screen.findByText('Page 1 of 2')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(await screen.findByText('Page 2 of 2')).toBeVisible()
})

it('guards anonymous and wrong-role access and rejects invalid server data', async () => {
  mount('/admin/users', null)
  expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible()
  cleanup()
  const customer: AuthSession = { ...session, user: { ...session.user, role: 'CUSTOMER' } }
  mount('/admin/users', customer)
  expect(await screen.findByRole('heading', { name: 'Access unavailable' })).toBeVisible()
  cleanup()
  const fetcher = mockApi()
  fetcher.mockImplementation(async () => response(collection([{ ...user, role: 'ROOT', passwordHash: 'private' }])))
  mount()
  expect(await screen.findByText('Accounts unavailable')).toBeVisible()
})

it('validates response shape and sends exact update payload in the service layer', async () => {
  const fetcher = mockApi()
  const controller = new AbortController()
  await expect(getAdminUsers(1, 20, undefined, undefined, 'token', controller.signal)).resolves.toEqual(collection())
  fetcher.mockResolvedValueOnce(response({ data: { ...user, status: 'SUSPENDED' } }))
  await expect(updateAdminUserStatus(id, 'SUSPENDED', 'token')).resolves.toEqual({ ...user, status: 'SUSPENDED' })
  expect(JSON.parse(fetcher.mock.calls.at(-1)?.[1]?.body as string)).toEqual({ status: 'SUSPENDED' })
  fetcher.mockResolvedValueOnce(response(collection([{ ...user, role: 'ROOT' }])))
  await expect(getAdminUsers(1, 20, undefined, undefined, 'token', controller.signal)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
})
