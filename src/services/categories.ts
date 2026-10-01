import { z } from 'zod'
import { api, ApiError, type ApiResponse } from './api'

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
})
export type Category = z.infer<typeof categorySchema>
const categoriesSchema = z.array(categorySchema).refine(items => new Set(items.map(item => item.id)).size === items.length)
const categoryMutationSchema = z.object({ data: categorySchema })

export async function getCategories(signal: AbortSignal) {
  const response = await api.request<ApiResponse<unknown>>('/categories', { signal })
  const parsed = categoriesSchema.safeParse(response?.data)
  if (!parsed.success) throw new ApiError('Categories could not be read. Please try again.', 200, 'INVALID_RESPONSE')
  return parsed.data
}

export async function createAdminCategory(name: string, accessToken: string) {
  const parsed = categoryMutationSchema.safeParse(await api.request<unknown>('/admin/categories', {
    method: 'POST', body: { name: z.string().trim().min(1).max(100).parse(name) }, accessToken,
  }))
  if (!parsed.success) throw new ApiError('Category could not be created.', 200, 'INVALID_RESPONSE')
  return parsed.data.data
}

export async function renameAdminCategory(id: string, name: string, accessToken: string) {
  const categoryId = z.uuid().parse(id)
  const parsed = categoryMutationSchema.safeParse(await api.request<unknown>(`/admin/categories/${categoryId}`, {
    method: 'PATCH', body: { name: z.string().trim().min(1).max(100).parse(name) }, accessToken,
  }))
  if (!parsed.success || parsed.data.data.id !== id) throw new ApiError('Category update could not be confirmed.', 200, 'INVALID_RESPONSE')
  return parsed.data.data
}

export async function deleteAdminCategory(id: string, accessToken: string) {
  const categoryId = z.uuid().parse(id)
  const parsed = z.object({ data: z.null() }).safeParse(await api.request<unknown>(`/admin/categories/${categoryId}`, {
    method: 'DELETE', accessToken,
  }))
  if (!parsed.success) throw new ApiError('Category deletion could not be confirmed.', 200, 'INVALID_RESPONSE')
}
