import { api, ApiError, type ApiResponse } from './api'
import { userSchema, type AuthSession } from './login'

export async function getCurrentUser(accessToken: string, signal: AbortSignal): Promise<AuthSession['user']> {
  const response = await api.request<ApiResponse<unknown>>('/auth/me', { accessToken, signal })
  const parsed = userSchema.safeParse(response?.data)
  if (!parsed.success) throw new ApiError('Unable to verify your account. Please try again.', 200, 'INVALID_RESPONSE')
  return parsed.data
}

const storageKey = 'craftlink.accessToken'
export function readSessionToken(): string | null {
  try { return sessionStorage.getItem(storageKey) || null } catch { return null }
}
export function storeSessionToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(storageKey, token)
    else sessionStorage.removeItem(storageKey)
  } catch { /* Storage may be disabled; in-memory authentication remains available. */ }
}
