import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'

const session: AuthSession = { accessToken: 'token', user: { id: 'owner', email: 'ada@example.com', role: 'ARTISAN' } }
const photoUrl = 'https://images.example/photo.webp'
const oldPhotoUrl = 'https://images.example/old.webp'
const owner = {
  id: 'artisan-1', displayName: 'Ada', bio: null, yearsExperience: 3,
  phone: null, whatsapp: null, city: 'Eket', state: 'Akwa Ibom',
  isAvailable: true, profileImageUrl: null,
}
const detail = { ...owner, verificationStatus: 'PENDING', averageRating: null, reviewCount: 0, services: [], portfolio: [], credentials: [] }
const response = (data: unknown) => new Response(JSON.stringify({ data }))
const file = () => new File(['image'], 'photo.png', { type: 'image/png' })

function mockApi(options?: { profile?: Record<string, unknown> | null; write?: (url: string, init: RequestInit) => Promise<Response> }) {
  let profile: Record<string, unknown> | null = options?.profile === undefined ? { ...owner } : options.profile
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
    const method = init?.method ?? 'GET'
    const target = String(url)
    if (method !== 'GET') {
      if (options?.write) return options.write(target, init!)
      if (target.endsWith('/artisans/me') && method === 'PUT') {
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>
        profile = { ...(profile ?? {}), ...body, id: (profile?.id as string) ?? owner.id }
        return response(profile)
      }
      if (target.endsWith('/profile-image') && method === 'POST') {
        profile = { ...(profile ?? {}), id: (profile?.id as string) ?? owner.id, profileImageUrl: photoUrl }
        return response({ profileImageUrl: photoUrl })
      }
      if (target.endsWith('/profile-image') && method === 'DELETE') {
        profile = { ...(profile ?? {}), id: (profile?.id as string) ?? owner.id, profileImageUrl: null }
        return response(null)
      }
      return response(profile)
    }
    if (target.endsWith('/artisans/me')) {
      if (profile === null) return new Response(JSON.stringify({ error: { code: 'ARTISAN_PROFILE_NOT_FOUND' } }), { status: 404 })
      return response(profile)
    }
    if (target.endsWith('/categories')) return response([])
    if (target.includes('/artisans/')) return response(detail)
    return response({})
  })
  vi.stubGlobal('fetch', fetcher)
  return fetcher
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={{ session, status: 'authenticated', signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}>
        <MemoryRouter initialEntries={['/artisan/profile']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return { ...view, client }
}

async function fillProfile() {
  fireEvent.change(await screen.findByLabelText(/Business name/), { target: { value: 'Ada' } })
  fireEvent.change(screen.getByLabelText('City / LGA'), { target: { value: 'Eket' } })
}

const calls = (fetcher: ReturnType<typeof mockApi>, method: string) => fetcher.mock.calls.filter(([, init]) => init?.method === method)

beforeEach(() => {
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:preview'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => vi.unstubAllGlobals())

it('stages a selected image locally without uploading it', async () => {
  const fetcher = mockApi()
  mount()
  fireEvent.change(await screen.findByLabelText('Choose photo'), { target: { files: [file()] } })
  expect(await screen.findByRole('img', { name: 'Selected profile photo preview' })).toBeVisible()
  expect(calls(fetcher, 'POST')).toHaveLength(0)
  expect(calls(fetcher, 'PUT')).toHaveLength(0)
})

it('removes the separate photo upload action from the photo section', async () => {
  mockApi()
  mount()
  await screen.findByLabelText(/Business name/)
  expect(screen.queryByRole('button', { name: 'Upload photo' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Save profile and upload photo' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeVisible()
})

it('saves a new profile without an image through the single save action', async () => {
  const fetcher = mockApi({ profile: null })
  mount()
  await fillProfile()
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  await screen.findByText('Profile saved')
  const put = calls(fetcher, 'PUT')[0]!
  expect(put[0]).toBe('/api/v1/artisans/me')
  expect(calls(fetcher, 'POST')).toHaveLength(0)
})

it('saves a new profile and uploads the selected image from one save click', async () => {
  const fetcher = mockApi({ profile: null })
  const photo = file()
  mount()
  await fillProfile()
  fireEvent.change(screen.getByLabelText('Choose photo'), { target: { files: [photo] } })
  expect(await screen.findByRole('img', { name: 'Selected profile photo preview' })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  await screen.findByText('Your business details and profile photo are up to date.')
  const put = calls(fetcher, 'PUT')[0]!
  expect(put[0]).toBe('/api/v1/artisans/me')
  const post = calls(fetcher, 'POST')[0]!
  expect(post[0]).toBe('/api/v1/artisans/me/profile-image')
  const body = post[1]?.body as FormData
  expect(body).toBeInstanceOf(FormData)
  expect([...body.keys()]).toEqual(['file'])
  expect(body.get('file')).toBe(photo)
  const headers = new Headers(post[1]?.headers)
  expect(headers.get('Authorization')).toBe('Bearer token')
  expect(headers.has('Content-Type')).toBe(false)
})

it('saves an existing profile without re-uploading when no image is selected', async () => {
  const fetcher = mockApi({ profile: { ...owner, profileImageUrl: oldPhotoUrl } })
  mount()
  fireEvent.change(await screen.findByLabelText(/Business name/), { target: { value: 'Ada Lovelace' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  await screen.findByText('Your business details are up to date.')
  const put = calls(fetcher, 'PUT')[0]!
  const payload = JSON.parse(String(put[1]?.body)) as { displayName: string; profileImageUrl: string | null }
  expect(payload.displayName).toBe('Ada Lovelace')
  expect(payload.profileImageUrl).toBe(oldPhotoUrl)
  expect(calls(fetcher, 'POST')).toHaveLength(0)
})

it('uploads a staged image from the save action and shows the saved photo', async () => {
  const fetcher = mockApi({ profile: { ...owner, profileImageUrl: oldPhotoUrl } })
  mount()
  fireEvent.change(await screen.findByLabelText('Change photo'), { target: { files: [file()] } })
  expect(await screen.findByRole('img', { name: 'Selected profile photo preview' })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  await screen.findByText('Your business details and profile photo are up to date.')
  const put = calls(fetcher, 'PUT')[0]!
  const payload = JSON.parse(String(put[1]?.body)) as { profileImageUrl: string | null }
  expect(payload.profileImageUrl).toBe(oldPhotoUrl)
  expect(calls(fetcher, 'POST')[0]![0]).toBe('/api/v1/artisans/me/profile-image')
  const saved = await screen.findByRole('img', { name: 'Ada profile photo' })
  await waitFor(() => expect(saved).toHaveAttribute('src', photoUrl))
  expect(calls(fetcher, 'POST')).toHaveLength(1)
})

it('rejects an invalid staged image before saving or uploading', async () => {
  const fetcher = mockApi()
  mount()
  await fillProfile()
  fireEvent.change(screen.getByLabelText('Choose photo'), { target: { files: [new File(['x'], 'photo.svg', { type: 'image/svg+xml' })] } })
  expect(await screen.findByText('Choose a JPEG, PNG or WebP image.')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  expect(await screen.findByText('Choose a JPEG, PNG or WebP image.')).toBeVisible()
  expect(calls(fetcher, 'PUT')).toHaveLength(0)
  expect(calls(fetcher, 'POST')).toHaveLength(0)
})

it('does not upload an image when profile validation fails', async () => {
  const fetcher = mockApi()
  mount()
  await fillProfile()
  fireEvent.change(screen.getByLabelText('Choose photo'), { target: { files: [file()] } })
  await screen.findByRole('img', { name: 'Selected profile photo preview' })
  fireEvent.change(screen.getByLabelText(/Business name/), { target: { value: '' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  expect(await screen.findByText('Check the highlighted profile fields.')).toBeVisible()
  expect(calls(fetcher, 'PUT')).toHaveLength(0)
  expect(calls(fetcher, 'POST')).toHaveLength(0)
})

it('reports a failed photo upload without claiming the photo was saved', async () => {
  const fetcher = mockApi({
    write: (url, init) => {
      if (String(url).endsWith('/profile-image') && init?.method === 'POST') {
        return Promise.resolve(new Response('{}', { status: 500 }))
      }
      return Promise.resolve(response(owner))
    },
  })
  mount()
  await fillProfile()
  fireEvent.change(screen.getByLabelText('Choose photo'), { target: { files: [file()] } })
  await screen.findByRole('img', { name: 'Selected profile photo preview' })
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  expect(await screen.findByText('Profile saved, but the photo could not be uploaded')).toBeVisible()
  expect(screen.queryByText('Profile saved')).not.toBeInTheDocument()
  expect(calls(fetcher, 'PUT')).toHaveLength(1)
  expect(calls(fetcher, 'POST')).toHaveLength(1)
  expect(await screen.findByRole('img', { name: 'Selected profile photo preview' })).toBeVisible()
})

it('prevents duplicate profile and image submissions when save is clicked twice', async () => {
  let resolvePut!: (value: Response) => void
  const fetcher = mockApi({
    write: (_url, init) => {
      if (init?.method === 'PUT') return new Promise<Response>(done => { resolvePut = done })
      if (init?.method === 'POST') return Promise.resolve(response({ profileImageUrl: photoUrl }))
      return Promise.resolve(response(owner))
    },
  })
  mount()
  await fillProfile()
  fireEvent.change(screen.getByLabelText('Choose photo'), { target: { files: [file()] } })
  await screen.findByRole('img', { name: 'Selected profile photo preview' })
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
  const saving = await screen.findByRole('button', { name: 'Saving profile...' })
  fireEvent.click(saving)
  expect(calls(fetcher, 'PUT')).toHaveLength(1)
  expect(saving).toBeDisabled()
  await act(async () => resolvePut(response(owner)))
  await screen.findByText('Your business details and profile photo are up to date.')
  expect(calls(fetcher, 'PUT')).toHaveLength(1)
  expect(calls(fetcher, 'POST')).toHaveLength(1)
})

it('keeps the existing remove-photo action working independently of save', async () => {
  const fetcher = mockApi({ profile: { ...owner, profileImageUrl: oldPhotoUrl } })
  mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Remove photo' }))
  await screen.findByText('Profile photo removed')
  const del = calls(fetcher, 'DELETE')[0]!
  expect(del[0]).toBe('/api/v1/artisans/me/profile-image')
  expect(await screen.findByText('No photo')).toBeVisible()
  expect(calls(fetcher, 'PUT')).toHaveLength(0)
})
