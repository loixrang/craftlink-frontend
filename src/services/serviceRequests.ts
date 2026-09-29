import { api } from './api'
import { serviceRequestSchema, type ServiceRequestValues } from '../schemas/serviceRequest'

export async function createServiceRequest(artisanId: string, values: ServiceRequestValues, accessToken: string): Promise<void> {
  const { serviceId, description, preferredDate } = serviceRequestSchema.parse(values)
  // The contract does not specify creation response fields; retain no response data.
  await api.request('/service-requests', {
    method: 'POST', accessToken,
    body: { artisanId, serviceId, description, ...(preferredDate ? { preferredDate: `${preferredDate}T00:00:00.000Z` } : {}) },
  })
}
