import { z } from 'zod'
import { api, ApiError } from './api'
import { serviceRequestSchema, type ServiceRequestValues } from '../schemas/serviceRequest'

export const requestStatuses = { PENDING: 'Pending', ACCEPTED: 'Accepted', DECLINED: 'Declined', IN_PROGRESS: 'In progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled' } as const
const request = z.object({
  id: z.string().min(1), artisanId: z.string().min(1), serviceId: z.string().min(1),
  description: z.string().min(1), status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  preferredDate: z.iso.datetime({ offset: true }).nullable().optional(),
  createdAt: z.iso.datetime({ offset: true }).optional(),
})
const collection = z.object({
  data: z.array(request),
  pagination: z.object({ page: z.number().int().positive(), limit: z.number().int().positive(), total: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative() }),
}).refine(({ data, pagination: p }) => [p.page, p.limit, p.total, p.totalPages].every(Number.isSafeInteger)
  && p.totalPages === Math.ceil(p.total / p.limit) && data.length <= p.limit && data.length <= p.total
  && (data.length === 0 || p.page <= p.totalPages) && new Set(data.map(item => item.id)).size === data.length)

export async function getServiceRequests(page: number, accessToken: string, signal: AbortSignal) {
  const response = await api.request<unknown>('/service-requests/me', { query: { page, limit: 20 }, accessToken, signal })
  const parsed = collection.safeParse(response)
  if (!parsed.success || parsed.data.pagination.page !== page || parsed.data.pagination.limit !== 20) {
    throw new ApiError('Request history could not be read.', 200, 'INVALID_RESPONSE')
  }
  return parsed.data
}

export async function createServiceRequest(artisanId: string, values: ServiceRequestValues, accessToken: string): Promise<void> {
  const { serviceId, description, preferredDate } = serviceRequestSchema.parse(values)
  // The contract does not specify creation response fields; retain no response data.
  await api.request('/service-requests', {
    method: 'POST', accessToken,
    body: { artisanId, serviceId, description, ...(preferredDate ? { preferredDate: `${preferredDate}T00:00:00.000Z` } : {}) },
  })
}
