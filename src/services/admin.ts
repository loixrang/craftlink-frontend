import { z } from 'zod'
import { api, ApiError } from './api'

export const verificationStatus = z.enum(['PENDING', 'VERIFIED', 'REJECTED'])
export type VerificationStatus = z.infer<typeof verificationStatus>
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
export const accountStatus = z.enum(['ACTIVE', 'SUSPENDED'])
export type AccountStatus = z.infer<typeof accountStatus>
export const accountRole = z.enum(['CUSTOMER', 'ARTISAN', 'ADMIN'])
export type AccountRole = z.infer<typeof accountRole>
const adminArtisan = z.object({
  id: z.uuid(), email: z.email(), accountStatus: accountStatus, displayName: z.string().min(1),
  yearsExperience: z.number().int().min(0).max(100), city: z.string(), state: z.string(),
  isAvailable: z.boolean(), verificationStatus, averageRating: z.number().finite().min(0).max(5).nullable(),
  reviewCount: count, createdAt: z.iso.datetime({ offset: true }),
})
export type AdminArtisan = z.infer<typeof adminArtisan>
const artisansCollection = z.object({
  data: z.array(adminArtisan),
  pagination: z.object({ page: z.number().int().min(1).max(1_000_000), limit: z.number().int().min(1).max(100), total: count, totalPages: count }),
}).refine(({ data, pagination: p }) => p.totalPages === Math.ceil(p.total / p.limit)
  && data.length === Math.min(p.limit, Math.max(0, p.total - (p.page - 1) * p.limit))
  && new Set(data.map(item => item.id)).size === data.length)
const adminUser = z.object({ id: z.uuid(), email: z.email(), role: accountRole, status: accountStatus, createdAt: z.iso.datetime({ offset: true }) })
export type AdminUser = z.infer<typeof adminUser>
const usersCollection = z.object({
  data: z.array(adminUser),
  pagination: z.object({ page: z.number().int().min(1).max(1_000_000), limit: z.number().int().min(1).max(100), total: count, totalPages: count }),
}).refine(({ data, pagination: p }) => p.totalPages === Math.ceil(p.total / p.limit)
  && data.length === Math.min(p.limit, Math.max(0, p.total - (p.page - 1) * p.limit))
  && new Set(data.map(item => item.id)).size === data.length)
export const verificationLabels: Record<VerificationStatus, string> = { PENDING: 'Pending', VERIFIED: 'Verified', REJECTED: 'Rejected' }
const stats = z.object({ users: count, artisans: count, serviceRequests: count, reviews: count, pendingCredentials: count })
const documentUrl = z.string().url().refine(value => {
  const url = new URL(value)
  return url.protocol === 'https:' && !url.username && !url.password
})
const credential = z.object({
  id: z.uuid(), artisanId: z.uuid(), title: z.string().min(1), issuer: z.string().min(1),
  issuedAt: z.iso.datetime({ offset: true }).nullable(), verificationStatus,
  documentUrl: documentUrl.nullable(), createdAt: z.iso.datetime({ offset: true }),
})
export type AdminCredential = z.infer<typeof credential>
const collection = z.object({
  data: z.array(credential),
  pagination: z.object({ page: z.number().int().min(1).max(1_000_000), limit: z.literal(20), total: count, totalPages: count }),
}).refine(({ data, pagination: p }) => p.totalPages === Math.ceil(p.total / p.limit)
  && data.length === Math.min(p.limit, Math.max(0, p.total - (p.page - 1) * p.limit))
  && new Set(data.map(item => item.id)).size === data.length)

export async function getAdminStats(accessToken: string, signal: AbortSignal) {
  const parsed = z.object({ data: stats }).safeParse(await api.request<unknown>('/admin/stats', { accessToken, signal }))
  if (!parsed.success) throw new ApiError('Statistics could not be read.', 200, 'INVALID_RESPONSE')
  return parsed.data.data
}

export async function getAdminUsers(page: number, limit: number, role: AccountRole | undefined, status: AccountStatus | undefined, accessToken: string, signal: AbortSignal) {
  const parsed = usersCollection.safeParse(await api.request<unknown>('/admin/users', { query: { page, limit, role, status }, accessToken, signal }))
  if (!parsed.success || parsed.data.pagination.page !== page || parsed.data.pagination.limit !== limit
    || (role && parsed.data.data.some(item => item.role !== role)) || (status && parsed.data.data.some(item => item.status !== status))) {
    throw new ApiError('Accounts could not be read.', 200, 'INVALID_RESPONSE')
  }
  return parsed.data
}

export async function getAdminArtisans(page: number, limit: number, status: AccountStatus | undefined, accessToken: string, signal: AbortSignal) {
  const parsed = artisansCollection.safeParse(await api.request<unknown>('/admin/artisans', { query: { page, limit, status }, accessToken, signal }))
  if (!parsed.success || parsed.data.pagination.page !== page || parsed.data.pagination.limit !== limit
    || (status && parsed.data.data.some(item => item.accountStatus !== status))) {
    throw new ApiError('Artisan profiles could not be read.', 200, 'INVALID_RESPONSE')
  }
  return parsed.data
}

export async function updateAdminUserStatus(id: string, status: AccountStatus, accessToken: string) {
  const parsed = z.object({ data: adminUser }).safeParse(await api.request<unknown>(`/admin/users/${z.uuid().parse(id)}/status`, {
    method: 'PATCH', body: { status: accountStatus.parse(status) }, accessToken,
  }))
  if (!parsed.success || parsed.data.data.id !== id || parsed.data.data.status !== status) {
    throw new ApiError('Account status update could not be confirmed.', 200, 'INVALID_RESPONSE')
  }
  return parsed.data.data
}

export async function getAdminCredentials(page: number, status: VerificationStatus | undefined, accessToken: string, signal: AbortSignal) {
  // Conservative local lifetime starts before the request, rather than after network delay.
  const documentExpiresAt = Date.now() + 240_000
  const parsed = collection.safeParse(await api.request<unknown>('/admin/credentials', { query: { page, limit: 20, verificationStatus: status }, accessToken, signal }))
  if (!parsed.success || parsed.data.pagination.page !== page || (status && parsed.data.data.some(item => item.verificationStatus !== status))) {
    throw new ApiError('Credentials could not be read.', 200, 'INVALID_RESPONSE')
  }
  return { ...parsed.data, documentExpiresAt }
}

export async function verifyCredential(id: string, status: VerificationStatus, accessToken: string) {
  const parsed = z.object({ data: credential }).safeParse(await api.request<unknown>(`/admin/credentials/${z.uuid().parse(id)}`, {
    method: 'PATCH', body: { verificationStatus: verificationStatus.parse(status) }, accessToken,
  }))
  if (!parsed.success || parsed.data.data.id !== id || parsed.data.data.verificationStatus !== status) {
    throw new ApiError('Verification update could not be confirmed.', 200, 'INVALID_RESPONSE')
  }
  // Never retain signed document URLs in mutation results.
}
