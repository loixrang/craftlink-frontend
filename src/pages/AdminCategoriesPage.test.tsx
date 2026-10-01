import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'
import { createAdminCategory, deleteAdminCategory, getCategories, renameAdminCategory } from '../services/categories'

const id = 'c567fcea-841e-4be7-95f4-55487865b403'
const adminId = '94382e91-a45f-43ab-8062-8b49574ecbd5'
const session: AuthSession = { accessToken: 'token', user: { id: adminId, email: 'admin@example.com', role: 'ADMIN' } }
const categories = [{ id, name: 'Plumbing' }]
const response = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status })
function mount(current: AuthSession | null = session) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: current, status: current ? 'authenticated' : 'anonymous', signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}><MemoryRouter initialEntries={['/admin/categories']}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>)
}
function mockApi() {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(categories))
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('uses exact authenticated create, rename, and delete contract shapes', async () => {
  const fetcher = mockApi()
  await expect(getCategories(new AbortController().signal)).resolves.toEqual(categories)
  fetcher.mockResolvedValueOnce(response({ id, name: 'Electrical' }))
  await expect(createAdminCategory('  Electrical  ', 'token')).resolves.toEqual({ id, name: 'Electrical' })
  expect(fetcher.mock.calls.at(-1)?.[0]).toBe('/api/v1/admin/categories')
  expect(fetcher.mock.calls.at(-1)?.[1]?.method).toBe('POST')
  expect(fetcher.mock.calls.at(-1)?.[1]?.body).toBe('{"name":"Electrical"}')
  fetcher.mockResolvedValueOnce(response({ id, name: 'Carpentry' }))
  await expect(renameAdminCategory(id, 'Carpentry', 'token')).resolves.toEqual({ id, name: 'Carpentry' })
  expect(fetcher.mock.calls.at(-1)?.[0]).toBe(`/api/v1/admin/categories/${id}`)
  expect(fetcher.mock.calls.at(-1)?.[1]?.method).toBe('PATCH')
  fetcher.mockResolvedValueOnce(response(null))
  await expect(deleteAdminCategory(id, 'token')).resolves.toBeUndefined()
  expect(fetcher.mock.calls.at(-1)?.[1]?.method).toBe('DELETE')
  expect(new Headers(fetcher.mock.calls.at(-1)?.[1]?.headers).get('Authorization')).toBe('Bearer token')
})

it('creates categories and confirms service reference protection on deletion', async () => {
  const fetcher = mockApi()
  fetcher.mockImplementation(async (_url, init) => {
    if (init?.method === 'POST') return response({ id: 'd567fcea-841e-4be7-95f4-55487865b403', name: 'Electrical' }, 201)
    if (init?.method === 'DELETE') return new Response(JSON.stringify({ error: { code: 'CATEGORY_IN_USE', message: 'In use' } }), { status: 409 })
    return response(categories)
  })
  mount()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add category' })).toBeEnabled())
  fireEvent.change(screen.getByLabelText('Category name'), { target: { value: '  Electrical  ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Add category' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/v1/admin/categories', expect.objectContaining({ method: 'POST' })))
  expect(await screen.findByText('Category added')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Remove Plumbing' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }))
  expect(await screen.findByText('This category is used by artisan services and cannot be deleted.')).toBeVisible()
  expect(fetcher).toHaveBeenCalledWith('/api/v1/admin/categories', expect.objectContaining({ method: 'POST' }))
})

it('supports rename and protects the page from anonymous and non-admin users', async () => {
  const fetcher = mockApi()
  mount()
  await screen.findByRole('heading', { name: 'Plumbing' })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Rename Plumbing' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Rename Plumbing' }))
  fireEvent.change(screen.getAllByLabelText('Category name').at(-1)!, { target: { value: 'Water services' } })
  fetcher.mockImplementation(async (_url, init) => init?.method === 'PATCH' ? response({ id, name: 'Water services' }) : response([{ id, name: 'Water services' }]))
  fireEvent.click(screen.getByRole('button', { name: 'Save name' }))
  expect(await screen.findByRole('heading', { name: 'Water services' })).toBeVisible()
  cleanup()
  const guardedFetcher = mockApi()
  mount(null)
  expect(await screen.findByRole('heading', { name: 'Log in' })).toBeVisible()
  expect(guardedFetcher).not.toHaveBeenCalled()
  cleanup()
  mockApi()
  mount({ ...session, user: { ...session.user, role: 'CUSTOMER' } })
  expect(await screen.findByRole('heading', { name: 'Access unavailable' })).toBeVisible()
})

it('reports duplicate names and malformed category responses', async () => {
  const fetcher = mockApi()
  fetcher.mockResolvedValueOnce(response([{ id, name: '' }]))
  await expect(getCategories(new AbortController().signal)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'CATEGORY_NAME_CONFLICT', message: 'Conflict' } }), { status: 409 }))
  await expect(createAdminCategory('Plumbing', 'token')).rejects.toMatchObject({ code: 'CATEGORY_NAME_CONFLICT', status: 409 })
})
