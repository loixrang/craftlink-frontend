import { z } from 'zod'

export const serviceRequestSchema = z.object({
  serviceId: z.string().min(1, 'Choose a service.'),
  description: z.string().trim().min(1, 'Describe the work you need.'),
  preferredDate: z.string().refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value), 'Enter a valid date.'),
})
export type ServiceRequestValues = z.infer<typeof serviceRequestSchema>
