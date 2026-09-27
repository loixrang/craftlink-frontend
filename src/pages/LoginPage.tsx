import { useRef, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorState, SuccessState } from '../components/ui/Feedback'
import { loginAccount, loginSchema, type LoginValues } from '../services/login'
import { ApiError } from '../services/api'

function errorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Something went wrong. Please try again.'
  if (error.status === 401) return 'Email or password is incorrect. Please try again.'
  if (error.status === 403) return 'Unable to sign in to this account. Please contact support if this continues.'
  if (error.status === 429) return 'Too many attempts. Please wait before trying again.'
  if (error.status >= 500) return 'Craftlink is temporarily unavailable. Please try again later.'
  return error.message
}

export function LoginPage() {
  const { session, signIn, signOut } = useAuth()
  const submitting = useRef(false)
  const { register, handleSubmit, getValues, reset, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  })
  const mutation = useMutation({
    // Keep credentials and tokens out of mutation variables/results.
    mutationFn: async () => { signIn(await loginAccount(loginSchema.parse(getValues()))) },
    retry: false, gcTime: 0,
  })
  const submit = (event: FormEvent<HTMLFormElement>) => handleSubmit(async () => {
    if (submitting.current) return
    submitting.current = true
    try {
      await mutation.mutateAsync()
      reset()
      mutation.reset()
    } catch {
      // Preserve inputs for correction; render the mutation error below.
    } finally {
      submitting.current = false
    }
  })(event)

  return <section className="mx-auto max-w-xl py-4 sm:py-8" aria-labelledby="login-title">
    <p className="text-sm font-semibold text-accent">Welcome back</p>
    <h1 id="login-title" className="mt-3 text-3xl tracking-tight sm:text-4xl">Log in</h1>
    {session ? <div className="mt-8 space-y-4">
      <SuccessState title="You’re signed in" description={`Signed in as ${session.user.email}.`} />
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/artisans" className="inline-flex min-h-11 items-center font-semibold">Find an artisan</Link>
        <Button variant="secondary" onClick={() => { reset(); mutation.reset(); signOut() }}>Sign out</Button>
      </div>
    </div> : <>
      <p className="mt-4 text-ink-muted">Sign in to your Craftlink account.</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-6" aria-label="Login" aria-busy={isSubmitting}>
        {mutation.isError && <ErrorState title="We couldn’t log you in" description={errorMessage(mutation.error)} />}
        <fieldset disabled={isSubmitting} className="space-y-6">
          <Input {...register('email')} label="Email address" type="email" autoComplete="username" required error={errors.email?.message} />
          <Input {...register('password')} label="Password" type="password" autoComplete="current-password" required error={errors.password?.message} />
          <Button type="submit" pending={isSubmitting} className="w-full">{isSubmitting ? 'Signing in…' : 'Log in'}</Button>
        </fieldset>
        {isSubmitting && <p role="status" className="text-sm text-ink-muted">Signing you in…</p>}
        <p className="text-sm text-ink-muted">New to Craftlink? <Link to="/register">Create an account</Link></p>
      </form>
    </>}
  </section>
}
