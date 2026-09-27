import { z } from 'zod'
import { api, ApiError, type ApiResponse } from './api'

export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email address.')),
  password: z.string().min(1, 'Enter your password.'),
})
export type LoginValues = z.infer<typeof loginSchema>
const sessionSchema = z.object({
  user: z.object({ id: z.string().min(1), email: z.email(), role: z.enum(['CUSTOMER', 'ARTISAN', 'ADMIN']) }),
  accessToken: z.string().min(1).regex(/^\S+$/),
})
export type AuthSession = z.infer<typeof sessionSchema>

export async function loginAccount({ email, password }: LoginValues): Promise<AuthSession> {
  const response = await api.request<ApiResponse<unknown>>('/auth/login', { method: 'POST', body: { email, password } })
  const parsed = sessionSchema.safeParse(response?.data)
  if (!parsed.success) throw new ApiError('Craftlink returned an unexpected login response. Please try again.', 200, 'INVALID_RESPONSE')
  return parsed.data
}
