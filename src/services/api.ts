export type ApiResponse<T> = { data: T }
export type CollectionResponse<T> = ApiResponse<T[]> & {
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string, public readonly details?: unknown) {
    super(message)
    this.name = 'ApiError'
  }
}

export function resolveApiBaseUrl(value: string | undefined, production = false): string {
  const base = value?.trim() || '/api/v1'
  if (base === '/api/v1' || base === '/api/v1/') return '/api/v1'
  const invalid = () => new Error('VITE_API_BASE_URL must be /api/v1 or an HTTP(S) URL ending in /api/v1; production requires HTTPS.')
  let url: URL
  try { url = new URL(base) } catch { throw invalid() }
  if (!['https:', 'http:'].includes(url.protocol) || (production && url.protocol !== 'https:') ||
    url.username || url.password || url.search || url.hash || !/^\/api\/v1\/?$/.test(url.pathname)) throw invalid()
  return `${url.origin}/api/v1`
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  accessToken?: string
  signal?: AbortSignal
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function createApiClient(baseUrl: string, fetcher: typeof fetch = (...args) => fetch(...args)) {
  const base = resolveApiBaseUrl(baseUrl)
  return {
    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
      // Keep requests under the configured API origin and prefix, including bearer tokens.
      if (!/^\/(?:[A-Za-z0-9_-]+\/?)+$/.test(path)) throw new Error('API paths must contain only slash-separated endpoint segments.')
      const query = new URLSearchParams()
      for (const [key, value] of Object.entries(options.query ?? {})) {
        if (value !== undefined) query.set(key, String(value))
      }
      const headers = new Headers({ Accept: 'application/json' })
      const multipart = options.body instanceof FormData
      if (options.body !== undefined && !multipart) headers.set('Content-Type', 'application/json')
      if (options.accessToken) headers.set('Authorization', `Bearer ${options.accessToken}`)
      let response: Response
      try {
        response = await fetcher(`${base}${path}${query.size ? `?${query}` : ''}`, {
          method: options.method ?? 'GET', headers,
          body: multipart ? options.body as FormData : options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: options.signal, credentials: 'omit', redirect: 'error',
        })
      } catch (error) {
        if (options.signal?.aborted || (isRecord(error) && error.name === 'AbortError')) throw error
        throw new ApiError('Unable to reach Craftlink. Please try again.', 0, 'NETWORK_ERROR')
      }
      if (response.status === 204 && response.ok) return undefined as T
      let payload: unknown
      try { payload = await response.json() } catch (error) {
        if (options.signal?.aborted || (isRecord(error) && error.name === 'AbortError')) throw error
        // Normalize non-JSON responses below.
      }
      if (!response.ok) {
        const error = isRecord(payload) && isRecord(payload.error) ? payload.error : undefined
        throw new ApiError(
          typeof error?.message === 'string' ? error.message : 'The request could not be completed. Please try again.',
          response.status, typeof error?.code === 'string' ? error.code : 'HTTP_ERROR', error?.details,
        )
      }
      if (!isRecord(payload) || !('data' in payload)) throw new ApiError('Craftlink returned an unexpected response.', response.status, 'INVALID_RESPONSE')
      // Endpoint services own the data shape; preserve the contract envelope and pagination.
      return payload as T
    },
  }
}

export const api = createApiClient(resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, import.meta.env.PROD))
