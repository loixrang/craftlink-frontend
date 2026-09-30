import { z } from 'zod'
import { api, ApiError } from './api'
import { requestStatuses } from './serviceRequests'

const incomingRequest = z.object({
  id: z.uuid(), artisanId: z.uuid(), serviceId: z.uuid().nullable(),
  serviceTitle: z.string().min(1), description: z.string().min(1),
  preferredDate: z.iso.datetime({ offset: true }).nullable(),
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }),
})
export type IncomingRequest = z.infer<typeof incomingRequest>
export type RequestAction = 'ACCEPTED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED'
export const actionLabels: Record<RequestAction, string> = { ACCEPTED: 'Accept request', DECLINED: 'Decline request', IN_PROGRESS: 'Start work', COMPLETED: 'Complete work' }
export function requestActions(status: keyof typeof requestStatuses): RequestAction[] {
  if (status === 'PENDING') return ['ACCEPTED', 'DECLINED']
  if (status === 'ACCEPTED') return ['IN_PROGRESS']
  if (status === 'IN_PROGRESS') return ['COMPLETED']
  return []
}
const collection = z.object({
  data: z.array(incomingRequest),
  pagination: z.object({ page: z.number().int().min(1).max(1_000_000), limit: z.literal(20), total: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative() }),
}).refine(({ data, pagination: p }) => Number.isSafeInteger(p.total) && Number.isSafeInteger(p.totalPages)
  && p.totalPages === Math.ceil(p.total / p.limit)
  && data.length === Math.min(p.limit, Math.max(0, p.total - (p.page - 1) * p.limit))
  && new Set(data.map(item => item.id)).size === data.length)

export async function getIncomingRequests(page: number, accessToken: string, signal: AbortSignal) {
  const parsed = collection.safeParse(await api.request<unknown>('/service-requests/me', { query: { page, limit: 20 }, accessToken, signal }))
  if (!parsed.success || parsed.data.pagination.page !== page) throw new ApiError('Incoming requests could not be read.', 200, 'INVALID_RESPONSE')
  return parsed.data
}

export async function updateIncomingRequest(item: IncomingRequest, status: RequestAction, accessToken: string) {
  if (!requestActions(item.status).includes(status)) throw new Error('This action is not available for the current status.')
  const parsed = z.object({ data: incomingRequest }).safeParse(await api.request<unknown>(`/service-requests/${z.uuid().parse(item.id)}/status`, {
    method: 'PATCH', body: { status }, accessToken,
  }))
  if (!parsed.success || parsed.data.data.id !== item.id || parsed.data.data.status !== status) throw new ApiError('Status update could not be confirmed. Refresh before trying again.', 200, 'INVALID_RESPONSE')
  return parsed.data.data
}
