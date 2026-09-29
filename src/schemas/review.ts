import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number({ error: 'Choose a rating from 1 to 5.' }).int().min(1, 'Choose a rating from 1 to 5.').max(5, 'Choose a rating from 1 to 5.'),
  comment: z.string().trim().min(1, 'Describe your experience.'),
})
export type ReviewValues = z.infer<typeof reviewSchema>
