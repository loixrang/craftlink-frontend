import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'
import { fileError, getCredentials, mediaFormSchema, uploadMedia } from '../services/artisanMedia'

const id = 'c567fcea-841e-4be7-95f4-55487865b403'
const owner = { id: 'artisan-1', displayName: 'Ada', bio: '', yearsExperience: 3, city: 'Ikeja', state: 'Lagos', isAvailable: true }
const item = { id, title: 'Cabinet', description: 'New kitchen', imageUrl: 'https://example.com/image.webp', width: 200, height: 200, createdAt: '2026-01-01T00:00:00.000Z' }
const credential = { id, title: 'Certificate', issuer: 'Trade school', issuedAt: null, verificationStatus: 'PENDING', createdAt: item.createdAt }
const detail = { ...owner, profileImageUrl: null, phone: null, whatsapp: null, verificationStatus: 'PENDING', averageRating: null, reviewCount: 0, services: [], portfolio: [], credentials: [] }
const session: AuthSession = { accessToken: 'token', user: { id: 'owner', email: 'ada@example.com', role: 'ARTISAN' } }
const response = (data: unknown) => new Response(JSON.stringify({ data }))
const file = () => new File(['image'], 'photo.png', { type: 'image/png' })
function mockApi(write?: (url: string, init: RequestInit) => Promise<Response>) {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
    if (init?.method !== 'GET') return write ? write(String(url), init!) : response(String(url).endsWith('credentials') ? credential : item)
    if (String(url).endsWith('/artisans/me')) return response(owner)
    if (String(url).endsWith('/credentials')) return response([credential])
    return response(detail)
  })
  vi.stubGlobal('fetch', fetcher); return fetcher
}
function mount(current: AuthSession | null = session) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: current, status: current ? 'authenticated' : 'anonymous', signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}><MemoryRouter initialEntries={['/artisan/media']}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>)
  return { ...view, client }
}
async function fillPortfolio() {
  fireEvent.click(await screen.findByRole('button', { name: 'Add portfolio image' }))
  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: ' Cabinet ' } })
  fireEvent.change(screen.getByLabelText(/Portfolio image/), { target: { files: [file()] } })
}
afterEach(() => vi.unstubAllGlobals())
it('shows empty portfolio and owner credential status without private documents', async () => {
  mockApi(); const { client } = mount()
  expect(await screen.findByText('No portfolio yet')).toBeVisible()
  expect(await screen.findByText('Pending verification')).toBeVisible()
  expect(client.getQueryData(['artisan-profile', owner.id])).toBeUndefined()
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})
it('uploads multipart portfolio with authentication and refreshes its list', async () => {
  const fetcher = mockApi(); mount(); await fillPortfolio()
  fireEvent.click(screen.getByRole('button', { name: 'Upload image' }))
  await screen.findByText('Upload complete')
  const call = fetcher.mock.calls.find(([, init]) => init?.method === 'POST')!
  expect(call[0]).toBe('/api/v1/artisans/me/portfolio')
  const headers = new Headers(call[1]?.headers)
  expect(headers.get('Authorization')).toBe('Bearer token')
  expect(headers.has('Content-Type')).toBe(false)
  const body = call[1]?.body as FormData
  expect([...body.keys()]).toEqual(['file', 'title', 'description'])
  expect(body.get('title')).toBe('Cabinet')
  expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/artisans/artisan-1')).length).toBeGreaterThan(1)
})
it('uploads credential metadata with an ISO date and no portfolio fields', async () => {
  const fetcher = mockApi(); mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Add credential' }))
  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Certificate' } })
  fireEvent.change(screen.getByLabelText(/Issuer/), { target: { value: ' School ' } })
  fireEvent.change(screen.getByLabelText(/Issue date/), { target: { value: '2024-01-02' } })
  fireEvent.change(screen.getByLabelText(/Credential image/), { target: { files: [file()] } })
  fireEvent.click(screen.getByRole('button', { name: 'Upload image' }))
  await screen.findByText('Upload complete')
  const body = fetcher.mock.calls.find(([, init]) => init?.method === 'POST')![1]?.body as FormData
  expect([...body.keys()]).toEqual(['file', 'title', 'issuer', 'issuedAt'])
  expect(body.get('issuer')).toBe('School'); expect(body.get('issuedAt')).toBe('2024-01-02T00:00:00.000Z')
})
it('requires deletion confirmation and supports cancellation', async () => {
  const fetcher = mockApi(); mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Delete Certificate' }))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel deletion' }))
  expect(fetcher.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Delete Certificate' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))
  await screen.findByText('Item deleted')
  expect(fetcher.mock.calls.find(([, init]) => init?.method === 'DELETE')?.[0]).toBe('/api/v1/artisans/me/credentials/' + id)
})
it.each([401, 403, 413, 429, 503])('preserves failed upload draft on HTTP %s', async status => {
  mockApi(async () => new Response('{}', { status })); mount(); await fillPortfolio()
  fireEvent.click(screen.getByRole('button', { name: 'Upload image' }))
  await screen.findByText('Upload not confirmed')
  expect(screen.getByLabelText(/Title/)).toHaveValue(' Cabinet ')
  expect(screen.getByRole('button', { name: 'Upload image' })).toBeEnabled()
})
it('prevents duplicate submissions while an upload is pending', async () => {
  let resolve!: (value: Response) => void
  const fetcher = mockApi(() => new Promise(done => { resolve = done })); mount(); await fillPortfolio()
  fireEvent.submit(screen.getByRole('form', { name: 'Upload portfolio' }))
  fireEvent.submit(screen.getByRole('form', { name: 'Upload portfolio' }))
  await waitFor(() => expect(fetcher.mock.calls.filter(([, i]) => i?.method === 'POST')).toHaveLength(1))
  expect(screen.getByRole('button', { name: 'Uploading...' })).toBeDisabled()
  await act(async () => resolve(response(item)))
})
it.each(['CUSTOMER', 'ADMIN'] as const)('blocks %s access', role => {
  const fetcher = mockApi(); mount({ ...session, user: { ...session.user, role } })
  expect(screen.getByText('Access unavailable')).toBeVisible(); expect(fetcher).not.toHaveBeenCalled()
})
it('validates file type, size, empty input and real dates', () => {
  expect(fileError(undefined)).toBeTruthy()
  expect(fileError(new File([], 'empty.png', { type: 'image/png' }))).toBeTruthy()
  expect(fileError(new File(['x'], 'file.pdf', { type: 'application/pdf' }))).toBeTruthy()
  expect(fileError(new File([new Uint8Array(5242881)], 'big.png', { type: 'image/png' }))).toBeTruthy()
  expect(fileError(file())).toBeUndefined()
  for (const issuedAt of ['2024-02-30', '9999-01-01', 'invalid', '2024-99-99']) expect(mediaFormSchema.safeParse({ title: 'a', description: '', issuer: 'a', issuedAt }).success).toBe(false)
})
it('strips private fields from owner metadata and rejects malformed status', async () => {
  const fetcher = mockApi(); fetcher.mockResolvedValueOnce(response([{ ...credential, documentUrl: 'secret', storageId: 'secret' }]))
  expect(await getCredentials('token', new AbortController().signal)).toEqual([credential])
  fetcher.mockResolvedValueOnce(response([{ ...credential, verificationStatus: 'UNKNOWN' }]))
  await expect(getCredentials('token', new AbortController().signal)).rejects.toThrow('Credentials could not be read')
})
it('rejects malformed upload responses without claiming success', async () => {
  mockApi(async () => response({}))
  await expect(uploadMedia('portfolio', { title: 'Work', description: '', issuer: '', issuedAt: '' }, file(), 'token')).rejects.toThrow('Upload could not be confirmed')
})
it('recovers from list errors and aborts owner requests on unmount', async () => {
  const fetcher = mockApi(); fetcher.mockResolvedValueOnce(new Response('{}', { status: 503 }))
  const view = mount(); await screen.findByText('Profile unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await screen.findByText('No portfolio yet'); view.unmount()
  fetcher.mockImplementation(() => new Promise(() => {}))
  const pending = mount()
  await waitFor(() => expect(fetcher.mock.calls.at(-1)?.[0]).toBe('/api/v1/artisans/me'))
  pending.unmount(); expect(fetcher.mock.calls.at(-1)?.[1]?.signal?.aborted).toBe(true)
})
it('guides missing profiles to setup without fetching media', async () => {
  const fetcher = mockApi(); fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'ARTISAN_PROFILE_NOT_FOUND' } }), { status: 404 }))
  mount(); await screen.findByText('Set up your profile first')
  expect(screen.getByRole('link', { name: 'Manage profile' })).toHaveAttribute('href', '/artisan/profile')
  expect(fetcher).toHaveBeenCalledTimes(1)
})
it('blocks invalid form submissions and allows cancellation', async () => {
  const fetcher = mockApi(); mount(); await fillPortfolio()
  fireEvent.change(screen.getByLabelText(/Portfolio image/), { target: { files: [new File(['x'], 'bad.svg', { type: 'image/svg+xml' })] } })
  fireEvent.click(screen.getByRole('button', { name: 'Upload image' }))
  await screen.findByText('Check the highlighted upload fields.')
  expect(fetcher.mock.calls.some(([, i]) => i?.method === 'POST')).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }))
  expect(screen.queryByRole('form')).not.toBeInTheDocument()
})
it('shows portfolio image fallback and keeps failed deletion recoverable', async () => {
  const fetcher = mockApi(async () => new Response('{}', { status: 404 }))
  fetcher.mockImplementation(async (url, init) => init?.method === 'DELETE' ? new Response('{}', { status: 404 }) : response(String(url).endsWith('/artisans/me') ? owner : String(url).endsWith('/credentials') ? [{ ...credential, verificationStatus: 'REJECTED' }] : { ...detail, portfolio: [item] }))
  mount(); fireEvent.error(await screen.findByRole('img', { name: 'Cabinet' }))
  expect(screen.getByText('Image unavailable')).toBeVisible()
  expect(await screen.findByText('Rejected')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Delete Cabinet' }))
  fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))
  await screen.findByText('Deletion not confirmed')
  expect(screen.getByRole('button', { name: 'Cancel deletion' })).toBeEnabled()
})
