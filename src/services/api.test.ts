import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient, resolveApiBaseUrl } from './api'

describe('API configuration', () => {
  it('defaults to the contract prefix and normalizes an explicit backend URL', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('/api/v1')
    expect(resolveApiBaseUrl(' https://backend.example/api/v1/ ', true)).toBe('https://backend.example/api/v1')
    expect(resolveApiBaseUrl('http://localhost:3000/api/v1')).toBe('http://localhost:3000/api/v1')
  })
  it.each(['//evil.example/api/v1', 'javascript:alert(1)', 'https://user:secret@example.com/api/v1', 'https://example.com', 'https://example.com/api/v1?token=secret', 'https://example.com/api/v1#secret'])('rejects unsafe or incorrect base %s', (base) => {
    expect(() => resolveApiBaseUrl(base)).toThrow('VITE_API_BASE_URL')
  })
  it('requires HTTPS for an absolute production backend', () => {
    expect(() => resolveApiBaseUrl('http://example.com/api/v1', true)).toThrow()
  })
})

describe('API client', () => {
  it('encodes filters, retains pagination and forwards cancellation', async () => {
    const payload = { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(payload))
    const signal = new AbortController().signal
    expect(await createApiClient('/api/v1', fetcher).request('/artisans', { query: { q: 'a & b', page: 1, availability: false, categoryId: undefined }, signal })).toEqual(payload)
    expect(fetcher).toHaveBeenCalledWith('/api/v1/artisans?q=a+%26+b&page=1&availability=false', expect.objectContaining({ signal, credentials: 'omit', redirect: 'error' }))
    expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).has('Authorization')).toBe(false)
  })
  it('sends JSON and an explicitly supplied bearer token', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: {} }))
    await createApiClient('/api/v1', fetcher).request('/service-requests', { method: 'POST', body: { artisanId: '123' }, accessToken: 'test-token' })
    const init = fetcher.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"artisanId":"123"}')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-token')
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
  })
  it.each([400, 401, 403, 404, 409, 422, 429, 500])('preserves contract errors for HTTP %s', async (status) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: { code: 'TEST_ERROR', message: 'Please check your input.', details: { field: 'email' } } }, { status }))
    await expect(createApiClient('/api/v1', fetcher).request('/auth/me')).rejects.toMatchObject({ status, code: 'TEST_ERROR', message: 'Please check your input.', details: { field: 'email' } })
  })
  it('normalizes non-JSON HTTP errors without exposing response content', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>private proxy details</html>', { status: 502 }))
    await expect(createApiClient('/api/v1', fetcher).request('/health')).rejects.toMatchObject({ status: 502, code: 'HTTP_ERROR' })
  })
  it.each(['not JSON', '{}'])('rejects malformed success envelopes: %s', async (body) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(body))
    await expect(createApiClient('/api/v1', fetcher).request('/health')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })
  it('supports empty successful responses', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    await expect(createApiClient('/api/v1', fetcher).request('/artisans/me/services/123', { method: 'DELETE' })).resolves.toBeUndefined()
  })
  it('distinguishes network failures and cancellation', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(createApiClient('/api/v1', fetcher).request('/health')).rejects.toEqual(new ApiError('Unable to reach Craftlink. Please try again.', 0, 'NETWORK_ERROR'))
    const aborted = new DOMException('Aborted', 'AbortError')
    fetcher.mockRejectedValue(aborted)
    await expect(createApiClient('/api/v1', fetcher).request('/health')).rejects.toBe(aborted)
  })
  it('preserves cancellation while reading a response body', async () => {
    const aborted = new DOMException('Aborted', 'AbortError')
    const response = Response.json({ data: {} })
    vi.spyOn(response, 'json').mockRejectedValue(aborted)
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response)
    await expect(createApiClient('/api/v1', fetcher).request('/health')).rejects.toBe(aborted)
  })
  it.each(['https://evil.example', '//evil.example', '/../auth', '/%2e%2e/auth', '/auth?token=x', '/auth\\me'])('rejects path escape %s before fetching', async (path) => {
    const fetcher = vi.fn<typeof fetch>()
    await expect(createApiClient('/api/v1', fetcher).request(path, { accessToken: 'test-token' })).rejects.toThrow('API paths')
    expect(fetcher).not.toHaveBeenCalled()
  })
})
