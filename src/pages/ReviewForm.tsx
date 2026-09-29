import { useRef, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../app/authContext'
import { Button } from '../components/ui/Button'
import { ErrorState, SuccessState } from '../components/ui/Feedback'
import { reviewSchema, type ReviewValues } from '../schemas/review'
import { ApiError } from '../services/api'
import { createReview } from '../services/reviews'

function reviewError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.'
    if (error.status === 403 || error.status === 404 || error.status === 409) return 'This request cannot be reviewed. It may already have a review or no longer be eligible. Refresh the request status to check.'
    if (error.status === 400 || error.status === 422) return 'Check your rating and comment. Only eligible completed requests can be reviewed once.'
    if (error.status === 429) return 'Too many attempts. Wait a moment before trying again.'
  }
  return 'We could not confirm whether your review was received. If you try again, the server will check whether a review already exists.'
}

export function ReviewForm({ requestId, artisanId, refreshing }: { requestId: string; artisanId: string; refreshing: boolean }) {
  const { session } = useAuth()
  const client = useQueryClient()
  const submitting = useRef(false)
  // Session-scoped acknowledgement only; this is not server eligibility data.
  const acknowledgementKey = ['review-submitted', session?.user.id, requestId]
  const acknowledgement = useQuery({ queryKey: acknowledgementKey, queryFn: () => false, enabled: false, initialData: false, gcTime: Infinity })
  const { register, handleSubmit, getValues, reset, formState: { errors, isSubmitting } } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema), defaultValues: { rating: 0, comment: '' },
  })
  const mutation = useMutation({ mutationFn: () => {
    if (!session || session.user.role !== 'CUSTOMER') throw new Error('Customer session required')
    return createReview(requestId, getValues(), session.accessToken)
  }, retry: false, gcTime: 0 })
  const pending = isSubmitting || mutation.isPending
  const submit = (event: FormEvent<HTMLFormElement>) => handleSubmit(async () => {
    if (submitting.current || acknowledgement.data || refreshing) return
    submitting.current = true
    try {
      await mutation.mutateAsync()
      client.setQueryData(acknowledgementKey, true)
      void client.invalidateQueries({ queryKey: ['artisan-profile', artisanId] })
      void client.invalidateQueries({ queryKey: ['artisans'] })
      reset()
      mutation.reset()
    } catch { /* Keep entered values for recovery. */ }
    finally { submitting.current = false }
  })(event)

  if (acknowledgement.data) return <SuccessState title="Review submitted" description="Thank you for sharing your experience. Only one review is allowed per request." />
  return <section className="space-y-4 border-t border-line pt-6" aria-labelledby="review-heading">
    <h2 id="review-heading" className="text-xl">Share your experience</h2>
    <p className="text-sm text-ink-muted">You can review a completed request once. Your rating and comment may be shown publicly.</p>
    <form aria-label="Review" onSubmit={submit} noValidate aria-busy={pending} className="space-y-5">
      {mutation.isError && <ErrorState title="Review not confirmed" description={reviewError(mutation.error)} />}
      <fieldset disabled={pending || refreshing} className="space-y-5">
        <div className="grid gap-2">
          <label htmlFor="review-rating" className="text-sm font-semibold">Rating</label>
          <select id="review-rating" {...register('rating', { valueAsNumber: true })} required aria-invalid={!!errors.rating} aria-describedby={errors.rating ? 'rating-error' : undefined} className="min-h-11 w-full rounded-control border border-control-border bg-surface px-3 py-2">
            <option value="0">Choose a rating</option>
            <option value="1">1 — Poor</option><option value="2">2 — Fair</option><option value="3">3 — Good</option><option value="4">4 — Very good</option><option value="5">5 — Excellent</option>
          </select>
          {errors.rating && <p id="rating-error" className="text-sm">{errors.rating.message}</p>}
        </div>
        <div className="grid gap-2">
          <label htmlFor="review-comment" className="text-sm font-semibold">Your review</label>
          <textarea id="review-comment" {...register('comment')} required rows={4} aria-invalid={!!errors.comment} aria-describedby={errors.comment ? 'comment-error' : undefined} className="w-full rounded-control border border-control-border bg-surface px-3 py-2" />
          {errors.comment && <p id="comment-error" className="text-sm">{errors.comment.message}</p>}
        </div>
        <Button type="submit" pending={pending}>{pending ? 'Submitting review...' : 'Submit review'}</Button>
      </fieldset>
      {pending && <p role="status">Submitting your review...</p>}
    </form>
  </section>
}
