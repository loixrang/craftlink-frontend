import { useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { getArtisanProfile } from '../services/artisanProfile'
import { createServiceRequest } from '../services/serviceRequests'
import { ApiError } from '../services/api'
import { serviceRequestSchema, type ServiceRequestValues } from '../schemas/serviceRequest'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../components/ui/Feedback'

function submissionError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again before submitting.'
    if (error.status === 403) return 'Your account is not permitted to create this request.'
    if (error.status === 404 || error.status === 409) return 'This artisan or service may no longer accept this request. Return to the profile to check the available services.'
    if (error.status === 400 || error.status === 422) return 'Check your service, description and preferred date, then submit again.'
    if (error.status === 429) return 'Too many attempts. Wait a moment before submitting again.'
  }
  return 'We could not confirm whether your request was received. Submitting again could create a duplicate. Check with the artisan before trying again.'
}

export function CreateServiceRequestPage() {
  const { artisanId = '' } = useParams()
  const { session } = useAuth()
  return <RequestForm key={`${session?.user.id}:${artisanId}`} artisanId={artisanId} />
}

function RequestForm({ artisanId }: { artisanId: string }) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [complete, setComplete] = useState(false)
  const submitting = useRef(false)
  const profile = useQuery({ queryKey: ['artisan-profile', artisanId], queryFn: ({ signal }) => getArtisanProfile(artisanId, signal) })
  const artisan = profile.isError ? undefined : profile.data
  const { register, handleSubmit, getValues, setError, reset, formState: { errors, isSubmitting } } = useForm<ServiceRequestValues>({
    resolver: zodResolver(serviceRequestSchema), defaultValues: { serviceId: '', description: '', preferredDate: '' },
  })
  const mutation = useMutation({
    mutationFn: () => {
      if (!session || session.user.role !== 'CUSTOMER') throw new Error('Customer session required')
      return createServiceRequest(artisanId, getValues(), session.accessToken)
    }, retry: false, gcTime: 0,
  })
  const pending = isSubmitting || mutation.isPending
  const submit = (event: FormEvent<HTMLFormElement>) => handleSubmit(async values => {
    if (submitting.current || complete || !artisan || profile.isFetching) return
    if (!artisan.services.some(service => service.id === values.serviceId)) {
      setError('serviceId', { message: 'Choose a service listed by this artisan.' })
      return
    }
    submitting.current = true
    try {
      await mutation.mutateAsync()
      void queryClient.invalidateQueries({ queryKey: ['service-requests', session?.user.id] })
      reset()
      mutation.reset()
      setComplete(true)
    } catch { /* Preserve the form and present the mutation error. */ }
    finally { submitting.current = false }
  })(event)

  return <section className="mx-auto max-w-2xl py-4 sm:py-8">
    <Link to={`/artisans/${encodeURIComponent(artisanId)}`} className="inline-flex min-h-11 items-center">Back to artisan profile</Link>
    <h1 className="mt-5 text-3xl sm:text-headline">Request a service</h1>
    {complete ? <div className="mt-8 space-y-5"><SuccessState title="Request sent" description="Your service request was submitted. Your preferred date is a suggestion, not a confirmed booking." /><div className="flex flex-wrap items-center gap-4"><Link className="inline-flex min-h-11 items-center" to="/customer">Return to dashboard</Link><Link className="inline-flex min-h-11 items-center" to="/customer/requests">View request history</Link></div></div> : <>
      {profile.isPending && <LoadingState label="Loading artisan services..." />}
      {profile.isError && <ErrorState title="Services unavailable" description="We could not load this artisan's services. Return to discovery or try again." onRetry={profile.isFetching ? undefined : () => { void profile.refetch() }} />}
      {profile.isFetching && !profile.isPending && <LoadingState label="Refreshing artisan services..." />}
      {artisan && <>
        <p className="mt-4 text-ink-muted">Tell {artisan.displayName} what you need help with.</p>
        {!artisan.isAvailable && <p className="mt-3 rounded-control bg-accent-soft px-4 py-3 text-sm text-accent-soft-ink">This artisan is currently marked unavailable. They may not be able to take on your project.</p>}
        {artisan.services.length === 0 ? <div className="mt-8"><EmptyState title="No services to request" description="This artisan has not listed any services yet."><Link to="/artisans">Find another artisan</Link></EmptyState></div> : <form aria-label="Service request" onSubmit={submit} noValidate aria-busy={pending} className="mt-8 space-y-6 rounded-modal border border-line bg-surface p-6 shadow-card sm:p-8">
          {mutation.isError && <ErrorState title="Request not confirmed" description={submissionError(mutation.error)} />}
          <fieldset disabled={pending || profile.isFetching} className="space-y-6">
            <div className="grid gap-2"><label htmlFor="request-service" className="text-sm font-semibold">Service</label><select {...register('serviceId')} id="request-service" required aria-invalid={!!errors.serviceId} aria-describedby={errors.serviceId ? 'service-error' : undefined} className="min-h-12 w-full min-w-0 rounded-control border border-control-border bg-surface px-3 py-2 transition-colors focus:border-accent aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted"><option value="">Choose a service</option>{artisan.services.map(service => <option key={service.id} value={service.id}>{service.title}</option>)}</select>{errors.serviceId && <p id="service-error" className="text-sm font-medium text-danger">{errors.serviceId.message}</p>}</div>
            <div className="grid gap-2"><label htmlFor="request-description" className="text-sm font-semibold">Describe your project</label><p id="description-hint" className="text-sm text-ink-muted">Include the work needed and any details that will help the artisan prepare.</p><textarea {...register('description')} id="request-description" rows={5} required aria-invalid={!!errors.description} aria-describedby={`description-hint${errors.description ? ' description-error' : ''}`} className="w-full rounded-control border border-control-border bg-surface px-3 py-2 transition-colors focus:border-accent aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted" />{errors.description && <p id="description-error" className="text-sm font-medium text-danger">{errors.description.message}</p>}</div>
            <Input {...register('preferredDate')} label="Preferred date (optional)" type="date" hint="A suggested calendar date; timing must be agreed with the artisan." error={errors.preferredDate?.message} />
            <p className="text-sm text-ink-muted">Sending a request does not confirm a booking or require online payment.</p>
            <Button type="submit" pending={pending}>{pending ? 'Sending request...' : 'Send request'}</Button>
          </fieldset>
          {pending && <p role="status" className="text-sm text-ink-muted">Sending your service request...</p>}
        </form>}
      </>}
    </>}
  </section>
}
