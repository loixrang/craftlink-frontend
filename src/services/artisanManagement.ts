import { z } from 'zod'
import { api, ApiError } from './api'
import { DEFAULT_STATE, isValidLga } from '../constants/locations'

const contact = z.string().trim().max(30).refine(v => !v || /^\+?[0-9 ()-]{3,30}$/.test(v), 'Enter a valid phone number.')

export const profileFormSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your business name.').max(100),
  bio: z.string().trim().max(2000),
  yearsExperience: z.number().int().min(0).max(100),
  phone: contact,
  whatsapp: contact,
  state: z.string().trim().min(1, 'Select your state.').max(100),
  city: z.string().trim().min(1, 'Select your city / LGA.').max(100).refine(
    city => isValidLga(DEFAULT_STATE, city),
    'Select a valid city / LGA from the list.',
  ),
  isAvailable: z.boolean(),
  profileImageUrl: z.string().trim().max(2048).refine(v => {
    if (!v) return true
    try {
      const u = new URL(v)
      return u.protocol === 'https:' && !u.username && !u.password
    } catch {
      return false
    }
  }, 'Enter an HTTPS image URL without credentials.'),
})

export type ProfileValues = z.infer<typeof profileFormSchema>

const ownerSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]+$/).refine(v => v !== 'me'),
  displayName: z.string(),
  bio: z.string().nullable(),
  yearsExperience: z.number().int().min(0).max(100),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  isAvailable: z.boolean(),
  profileImageUrl: z.string().nullable(),
})

export type OwnerProfile = z.infer<typeof ownerSchema>

function parseOwner(response: unknown) {
  const result = z.object({ data: ownerSchema }).safeParse(response)
  if (!result.success) throw new ApiError('Profile could not be read.', 200, 'INVALID_RESPONSE')
  return result.data.data
}

export async function getEditableProfile(accessToken: string, signal: AbortSignal) {
  try {
    return parseOwner(await api.request('/artisans/me', { accessToken, signal }))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code === 'ARTISAN_PROFILE_NOT_FOUND') return null
    throw error
  }
}

export async function saveProfile(values: ProfileValues, accessToken: string) {
  const v = profileFormSchema.parse(values)
  return parseOwner(
    await api.request('/artisans/me', {
      method: 'PUT',
      accessToken,
      body: {
        ...v,
        state: v.state || DEFAULT_STATE,
        phone: v.phone || null,
        whatsapp: v.whatsapp || null,
        profileImageUrl: v.profileImageUrl || null,
        latitude: null,
        longitude: null,
      },
    }),
  )
}

export function profileDefaults(profile: OwnerProfile | null): ProfileValues {
  return {
    displayName: profile?.displayName ?? '',
    bio: profile?.bio ?? '',
    yearsExperience: profile?.yearsExperience ?? 0,
    phone: profile?.phone ?? '',
    whatsapp: profile?.whatsapp ?? '',
    state: profile?.state || DEFAULT_STATE,
    city: profile?.city ?? '',
    isAvailable: profile?.isAvailable ?? false,
    profileImageUrl: profile?.profileImageUrl ?? '',
  }
}

export const serviceFormSchema = z.object({
  categoryId: z.string().min(1, 'Choose a category.'),
  title: z.string().trim().min(1, 'Enter a service title.').max(100),
  description: z.string().trim().min(1, 'Describe your service.').max(2000),
  priceFrom: z.string().trim().refine(
    v => !v || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 9999999999.99),
    'Enter a non-negative price with at most two decimal places.',
  ),
})

export type ServiceValues = z.infer<typeof serviceFormSchema>

export async function saveService(values: ServiceValues, accessToken: string, id?: string) {
  const v = serviceFormSchema.parse(values)
  await api.request('/artisans/me/services' + (id ? '/' + id : ''), {
    method: id ? 'PATCH' : 'POST',
    accessToken,
    body: { ...v, priceFrom: v.priceFrom ? Number(v.priceFrom) : null },
  })
}

export async function deleteService(id: string, accessToken: string) {
  await api.request('/artisans/me/services/' + id, { method: 'DELETE', accessToken })
}

export function managementError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.'
    if (error.status === 403) return 'Your account cannot change this profile or service.'
    if (error.status === 400 || error.status === 422) return 'Check the form fields and try again.'
    if (error.status === 404 || error.status === 409) return 'This profile, service or category may have changed. Reload the page to check before trying again.'
    if (error.status === 429) return 'Too many attempts. Wait a moment before trying again.'
  }
  return 'We could not confirm the change. Reload to check the saved details before trying again.'
}
