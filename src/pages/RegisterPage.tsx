import { useRef, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorState, SuccessState } from '../components/ui/Feedback'
import { registrationSchema, type RegistrationValues } from '../schemas/registration'
import { registerAccount } from '../services/registration'
import { ApiError } from '../services/api'

function errorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.'
  if (error.status === 409) return 'An account with this email already exists. Use another email or log in.'
  if (error.status === 429) return 'Too many attempts. Please wait before trying again.'
  if (error.status >= 500) return 'Craftlink is temporarily unavailable. Please try again later.'
  return error.message
}

export function RegisterPage() {
  const [complete, setComplete] = useState(false)
  const submitting = useRef(false)
  const { register, handleSubmit, getValues, reset, formState: { errors, isSubmitting } } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', role: 'CUSTOMER' },
  })
  // Keep credentials in the form, not in cached mutation variables.
  const mutation = useMutation({
    mutationFn: () => registerAccount(registrationSchema.parse(getValues())),
    retry: false, gcTime: 0,
  })
  const submit = (event: FormEvent<HTMLFormElement>) => handleSubmit(async () => {
    if (submitting.current) return
    submitting.current = true
    try {
      await mutation.mutateAsync()
      reset()
      mutation.reset()
      setComplete(true)
    } catch {
      // The mutation error is presented below; preserve inputs for correction.
    } finally {
      submitting.current = false
    }
  })(event)

  return (
    <section className="mx-auto max-w-xl py-4 sm:py-8" aria-labelledby="register-title">
      <p className="text-xs font-bold uppercase tracking-[0.04em] text-accent-text">Join Craftlink</p>
      <h1 id="register-title" className="mt-3 text-3xl sm:text-headline">Create an account</h1>
      <p className="mt-4 text-ink-muted">Find skilled help for your next project, or bring your craft to customers nearby.</p>
      {complete ? <div className="mt-8 space-y-4">
        <SuccessState title="Your account is ready" description="Your registration was successful. You can now log in with your email and password." />
        <Link to="/login" className="inline-flex min-h-11 items-center font-semibold">Continue to log in</Link>
      </div> : <form onSubmit={submit} noValidate className="mt-8 space-y-6 rounded-modal border border-line bg-surface p-6 shadow-card sm:p-8" aria-label="Registration" aria-busy={isSubmitting}>
        {mutation.isError && <ErrorState title="We couldn’t create your account" description={errorMessage(mutation.error)} />}
        <fieldset disabled={isSubmitting} className="space-y-6">
          <fieldset>
            <legend className="mb-3 font-semibold">How would you like to use Craftlink?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ['CUSTOMER', 'As a customer', 'Find help for your projects.'],
                ['ARTISAN', 'As an artisan', 'Offer your skills and services.'],
              ] as const).map(([value, label, hint]) => <label key={value} className="flex cursor-pointer items-start gap-3 rounded-control border border-control-border bg-surface p-4 transition-colors hover:bg-surface-muted has-checked:border-accent has-checked:bg-accent-soft/60">
                <input {...register('role')} type="radio" value={value} className="mt-1 size-4 shrink-0" />
                <span><span className="block font-semibold">{label}</span><span className="text-sm text-ink-muted">{hint}</span></span>
              </label>)}
            </div>
            {errors.role && <p role="alert" className="mt-2 text-sm font-medium text-danger">Choose customer or artisan.</p>}
          </fieldset>
          <Input {...register('email')} label="Email address" type="email" autoComplete="email" required error={errors.email?.message} />
          <Input {...register('password')} label="Password" type="password" autoComplete="new-password" required hint="Choose a strong, unique password." error={errors.password?.message} />
          <Input {...register('confirmPassword')} label="Confirm password" type="password" autoComplete="new-password" required error={errors.confirmPassword?.message} />
          <Button type="submit" pending={isSubmitting} className="w-full">{isSubmitting ? 'Creating your account…' : 'Create account'}</Button>
        </fieldset>
        {isSubmitting && <p role="status" className="text-sm text-ink-muted">Submitting your registration…</p>}
        <p className="text-sm text-ink-muted">Already have an account? <Link to="/login">Log in</Link></p>
      </form>}
    </section>
  )
}
