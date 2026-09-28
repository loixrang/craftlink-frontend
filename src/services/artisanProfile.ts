import { z } from 'zod'
import { api, ApiError } from './api'

const id = z.string().min(1)
const status = z.enum(['PENDING', 'VERIFIED', 'REJECTED'])
const profile = z.object({
  id, displayName: z.string().trim().min(1), bio: z.string().nullable(),
  yearsExperience: z.number().nonnegative(), city: z.string().nullable(), state: z.string().nullable(),
  isAvailable: z.boolean(), profileImageUrl: z.string().nullable(),
  phone: z.string().nullable(), whatsapp: z.string().nullable(), verificationStatus: status,
  averageRating: z.number().min(0).max(5).nullable(), reviewCount: z.number().int().nonnegative(),
  services: z.array(z.object({ id, categoryId: id, title: z.string().min(1), description: z.string(), priceFrom: z.number().nonnegative().nullish() })),
  portfolio: z.array(z.object({ id, title: z.string().min(1), imageUrl: z.string(), description: z.string().nullish() })),
  credentials: z.array(z.object({ id, title: z.string().min(1), issuer: z.string(), issuedAt: z.string().nullish(), verificationStatus: status })),
}).refine(value => [value.services, value.portfolio, value.credentials].every(items => new Set(items.map(item => item.id)).size === items.length))

export async function getArtisanProfile(artisanId: string, signal: AbortSignal) {
  if (!/^[A-Za-z0-9_-]+$/.test(artisanId) || artisanId === 'me') throw new ApiError('Profile not found.', 404, 'NOT_FOUND')
  const response = await api.request<unknown>('/artisans/' + artisanId, { signal })
  const parsed = z.object({ data: profile }).safeParse(response)
  if (!parsed.success || parsed.data.data.id !== artisanId) throw new ApiError('Profile could not be read.', 200, 'INVALID_RESPONSE')
  return parsed.data.data
}

export function publicImageUrl(value: string | null) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined
  } catch { return undefined }
}

export function contactNumber(value: string | null) {
  if (!value || !/^\+?[\d ()-]+$/.test(value)) return undefined
  const number = value.replace(/[ ()-]/g, '')
  return /^\+?\d{7,15}$/.test(number) ? number : undefined
}
