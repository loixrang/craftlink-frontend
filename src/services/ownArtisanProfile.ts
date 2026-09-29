import { z } from 'zod'
import { api, ApiError } from './api'

// Strip contacts, private coordinates and other fields before caching.
const summary = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/).refine(value => value !== 'me'),
  displayName: z.string().trim().min(1), bio: z.string().nullable(),
  yearsExperience: z.number().int().nonnegative(),
  city: z.string().nullable(), state: z.string().nullable(), isAvailable: z.boolean(),
})

export async function getOwnArtisanProfile(accessToken: string, signal: AbortSignal) {
  try {
    const response = await api.request<unknown>('/artisans/me', { accessToken, signal })
    const parsed = z.object({ data: summary }).safeParse(response)
    if (!parsed.success) throw new ApiError('Your profile could not be read.', 200, 'INVALID_RESPONSE')
    return parsed.data.data
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code === 'ARTISAN_PROFILE_NOT_FOUND') return null
    throw error
  }
}
