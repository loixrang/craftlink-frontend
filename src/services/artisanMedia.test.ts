import { afterEach, expect, it, vi } from 'vitest'
import { createApiClient } from './api'
import { deleteMedia } from './artisanMedia'
import { removeProfileImage, saveProfile, uploadProfileImage, profileDefaults } from './artisanManagement'

afterEach(() => vi.unstubAllGlobals())
it('retains JSON serialization and content type for existing callers', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"data":null}'))
  await createApiClient('/api/v1', fetcher).request('/artisans/me', { method: 'PUT', body: { displayName: 'Ada' } })
  const init = fetcher.mock.calls[0]![1]!
  expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
  expect(init.body).toBe('{"displayName":"Ada"}')
})
it('deletes portfolio items with a bearer token and no body', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"data":null}'))
  vi.stubGlobal('fetch', fetcher)
  await deleteMedia('portfolio', 'c567fcea-841e-4be7-95f4-55487865b403', 'token')
  const [url, init] = fetcher.mock.calls[0]!
  expect(url).toBe('/api/v1/artisans/me/portfolio/c567fcea-841e-4be7-95f4-55487865b403')
  expect(init?.method).toBe('DELETE'); expect(init?.body).toBeUndefined()
  expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token')
  await expect(deleteMedia('portfolio', '../credentials', 'token')).rejects.toThrow()
  expect(fetcher).toHaveBeenCalledTimes(1)
})
it('uploads a profile image as exactly one multipart file and removes it through the documented route', async () => {
  const fetcher = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(new Response('{"data":{"profileImageUrl":"https://images.example/photo.webp"}}'))
    .mockResolvedValueOnce(new Response('{"data":null}'))
  vi.stubGlobal('fetch', fetcher)
  const file = new File(['photo'], 'photo.webp', { type: 'image/webp' })
  await expect(uploadProfileImage(file, 'token')).resolves.toBe('https://images.example/photo.webp')
  const [url, init] = fetcher.mock.calls[0]!
  expect(url).toBe('/api/v1/artisans/me/profile-image')
  expect(init?.method).toBe('POST')
  expect(init?.body).toBeInstanceOf(FormData)
  expect([...(init?.body as FormData).keys()]).toEqual(['file'])
  expect((init?.body as FormData).get('file')).toBe(file)
  expect(new Headers(init?.headers).has('Content-Type')).toBe(false)
  await removeProfileImage('token')
  expect(fetcher.mock.calls[1]?.[0]).toBe('/api/v1/artisans/me/profile-image')
  expect(fetcher.mock.calls[1]?.[1]?.method).toBe('DELETE')
})
it('preserves the current image in the full profile PUT payload', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"data":{"id":"artisan-1","displayName":"Ada","bio":null,"yearsExperience":0,"phone":null,"whatsapp":null,"city":null,"state":null,"isAvailable":false,"profileImageUrl":"https://images.example/photo.webp"}}'))
  vi.stubGlobal('fetch', fetcher)
  const values = profileDefaults(null)
  await saveProfile({ ...values, displayName: 'Ada', city: 'Eket' }, 'token', 'https://images.example/photo.webp')
  const payload = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)) as { profileImageUrl: string | null }
  expect(payload.profileImageUrl).toBe('https://images.example/photo.webp')
})
