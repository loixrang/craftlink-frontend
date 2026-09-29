import { reviewSchema, type ReviewValues } from '../schemas/review'
import { api } from './api'

export async function createReview(serviceRequestId: string, values: ReviewValues, accessToken: string): Promise<void> {
  const { rating, comment } = reviewSchema.parse(values)
  await api.request('/reviews', { method: 'POST', accessToken, body: { serviceRequestId, rating, comment } })
}
