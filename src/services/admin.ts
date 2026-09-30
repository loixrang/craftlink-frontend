import { z } from 'zod'
import { api, ApiError } from './api'

export const verificationStatus = z.enum(['PENDING', 'VERIFIED', 'REJECTED'])
export type VerificationStatus = z.infer<typeof verificationStatus>
export const verificationLabels: Record<VerificationStatus, string> = { PENDING: 'Pending', VERIFIED: 'Verified', REJECTED: 'Rejected' }
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
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
