import { z } from 'zod'
import { api, ApiError } from './api'

export type ArtisanSort = 'rating' | 'experience' | 'newest'
export type ArtisanFilters = {
  q?: string
  categoryId?: string
  state?: string
  city?: string
  lga?: string
  minRating?: number
  minExperience?: number
  availability?: boolean
  sort?: ArtisanSort
  page?: number
}

const summary = z.object({
  id: z.string().min(1),
  displayName: z.string().trim().min(1),
  bio: z.string().nullable(),
  yearsExperience: z.number().nonnegative(),
  profileImageUrl: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  isAvailable: z.boolean(),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  averageRating: z.number().min(0).max(5).nullable(),
  reviewCount: z.number().int().nonnegative(),
  distanceKm: z.number().nonnegative().nullable().optional(),
  categories: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })),
})

const collection = z.object({
  data: z.array(summary).refine(items => new Set(items.map(item => item.id)).size === items.length),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
}).refine(({ data, pagination }) => {
  const { page, limit, total, totalPages } = pagination
  return [page, limit, total, totalPages].every(Number.isSafeInteger)
    && totalPages === Math.ceil(total / limit)
    && data.length <= limit && data.length <= total
    && (data.length === 0 || page <= totalPages)
})

export async function getArtisans(filters: ArtisanFilters, signal: AbortSignal) {
  const response = await api.request<unknown>('/artisans', { query: filters, signal })
  const parsed = collection.safeParse(response)
  if (!parsed.success) throw new ApiError('Artisan results could not be read.', 200, 'INVALID_RESPONSE')
  return parsed.data
}
