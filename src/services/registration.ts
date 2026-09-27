import { api, type ApiResponse } from './api'
import type { RegistrationValues } from '../schemas/registration'

export async function registerAccount({ email, password, role }: Pick<RegistrationValues, 'email' | 'password' | 'role'>): Promise<void> {
  // Registration only: do not retain the returned token in the mutation cache.
  await api.request<ApiResponse<unknown>>('/auth/register', {
    method: 'POST', body: { email, password, role },
  })
}
