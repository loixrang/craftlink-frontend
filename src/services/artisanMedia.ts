import { z } from 'zod'
import { api, ApiError } from './api'

export type MediaKind = 'portfolio' | 'credentials'
const title = z.string().trim().min(1, 'Enter a title.').max(100)
export const mediaFormSchema = z.object({
  title,
  description: z.string().trim().max(2000),
  issuer: z.string().trim().max(100),
  issuedAt: z.string().refine(v => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v && Date.parse(v) <= Date.now()), 'Enter a valid date that is not in the future.'),
})
export type MediaValues = z.infer<typeof mediaFormSchema>
const credential = z.object({ id: z.uuid(), title, issuer: z.string().min(1), issuedAt: z.iso.datetime().nullable(), verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']), createdAt: z.iso.datetime() })
const portfolio = z.object({ id: z.uuid(), title, description: z.string(), imageUrl: z.url(), width: z.number().int().positive(), height: z.number().int().positive(), createdAt: z.iso.datetime() })
export function fileError(file: File | undefined) {
  if (!file || file.size === 0) return 'Choose a non-empty image.'
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Choose a JPEG, PNG or WebP image.'
  if (file.size > 5242880) return 'Choose an image no larger than 5 MiB.'
  return undefined
}
export async function getCredentials(token: string, signal: AbortSignal) {
  const parsed = z.object({ data: z.array(credential).refine(items => new Set(items.map(i => i.id)).size === items.length) }).safeParse(await api.request('/artisans/me/credentials', { accessToken: token, signal }))
  if (!parsed.success) throw new ApiError('Credentials could not be read.', 200, 'INVALID_RESPONSE')
  return parsed.data.data
}
export async function uploadMedia(kind: MediaKind, values: MediaValues, file: File, token: string) {
  const v = mediaFormSchema.parse(values)
  if (fileError(file)) throw new Error(fileError(file))
  const body = new FormData()
  body.append('file', file)
  body.append('title', v.title)
  if (kind === 'portfolio') body.append('description', v.description)
  else {
    body.append('issuer', title.parse(v.issuer))
    if (v.issuedAt) body.append('issuedAt', new Date(v.issuedAt).toISOString())
  }
  const result = await api.request('/artisans/me/' + kind, { method: 'POST', body, accessToken: token })
  const parsed = z.object({ data: kind === 'portfolio' ? portfolio : credential }).safeParse(result)
  if (!parsed.success) throw new ApiError('Upload could not be confirmed.', 200, 'INVALID_RESPONSE')
}
export async function deleteMedia(kind: MediaKind, id: string, token: string) {
  await api.request('/artisans/me/' + kind + '/' + z.uuid().parse(id), { method: 'DELETE', accessToken: token })
}
export function mediaError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.'
    if (error.status === 403) return 'Your account cannot manage these items.'
    if (error.status === 413) return 'Choose an image no larger than 5 MiB.'
    if (error.code === 'INVALID_IMAGE') return 'Choose a valid, static JPEG, PNG or WebP image with at most 25 million pixels.'
    if (error.status === 400 || error.status === 415) return 'Check the fields and image format before trying again.'
    if (error.status === 404) return 'The profile or item is no longer available. Refresh to check.'
    if (error.status === 429) return 'Too many attempts. Wait a moment before trying again.'
    if (error.code === 'MEDIA_UNAVAILABLE') return 'Uploads are temporarily unavailable. Please try again later.'
  }
  return 'The result could not be confirmed. Refresh the list before retrying to avoid a duplicate upload.'
}
