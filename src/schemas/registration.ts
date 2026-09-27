import { z } from 'zod'

export const registrationSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email address.')),
  password: z.string().min(1, 'Enter a password.'),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
  role: z.enum(['CUSTOMER', 'ARTISAN']),
}).refine(values => values.password === values.confirmPassword, {
  message: 'Passwords must match.', path: ['confirmPassword'],
})

export type RegistrationValues = z.infer<typeof registrationSchema>
