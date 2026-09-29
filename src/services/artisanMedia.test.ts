import { afterEach, expect, it, vi } from 'vitest'
import { createApiClient } from './api'
import { deleteMedia } from './artisanMedia'

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
