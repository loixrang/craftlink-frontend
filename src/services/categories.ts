import { z } from 'zod'
import { api, ApiError, type ApiResponse } from './api'

const categoriesSchema = z.array(z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
})).refine(items => new Set(items.map(item => item.id)).size === items.length)

export async function getCategories(signal: AbortSignal) {
  const response = await api.request<ApiResponse<unknown>>('/categories', { signal })
  const parsed = categoriesSchema.safeParse(response?.data)
  if (!parsed.success) throw new ApiError('Categories could not be read. Please try again.', 200, 'INVALID_RESPONSE')
  return parsed.data
}
