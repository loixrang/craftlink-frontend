import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Star, UserRound } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { VerifiedBadge } from '../components/ui/VerifiedBadge'
import { getArtisans, type ArtisanFilters, type ArtisanSort } from '../services/artisans'
import { ApiError } from '../services/api'
import { publicImageUrl } from '../services/artisanProfile'
import { readLocation } from '../schemas/location'
import { ManualLocation } from './ManualLocation'

function numericFilter(value: string | null, max = Infinity) {
  if (!value?.trim()) return undefined
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 && number <= max ? number : undefined
}

function ArtisanAvatar({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false)
  const src = publicImageUrl(url)
  return src && !failed
    ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="size-14 shrink-0 rounded-control border border-line object-cover" />
    : <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-control bg-surface-muted text-ink-muted"><UserRound size={24} /></span>
}

function Rating({ rating, reviews }: { rating: number | null; reviews: number }) {
  if (rating === null || reviews === 0) return <span className="text-ink-muted">No ratings yet</span>
  return <span className="inline-flex items-center gap-1 tabular-nums"><Star size={15} aria-hidden="true" className="text-amber" />{rating.toFixed(1)} / 5 <span className="text-ink-muted">({reviews} {reviews === 1 ? 'review' : 'reviews'})</span></span>
}

export function ArtisanResults() {
  const [params, setParams] = useSearchParams()
  const location = readLocation(params)
  const rawSort = params.get('sort')
  const sort = rawSort && ['rating', 'experience', 'newest'].includes(rawSort) ? (rawSort as ArtisanSort) : undefined
  const rawPage = params.get('page')
  const page = rawPage !== null && /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) && Number(rawPage) > 0 ? Number(rawPage) : undefined

  function changePage(nextPage: number) {
    const next = new URLSearchParams(params)
    if (nextPage === 1) next.delete('page')
    else next.set('page', String(nextPage))
    setParams(next)
  }

  const filters: ArtisanFilters = {
    q: params.get('q')?.trim() || undefined,
    categoryId: params.get('categoryId') || undefined,
    minRating: numericFilter(params.get('minRating'), 5),
    minExperience: numericFilter(params.get('minExperience')),
    availability: params.get('availability') === 'true' ? true : params.get('availability') === 'false' ? false : undefined,
    ...location.filters,
    sort,
    page,
  }

  const results = useQuery({ queryKey: ['artisans', filters], queryFn: ({ signal }) => getArtisans(filters, signal) })
  const invalid = ['minRating', 'minExperience'].some(key => params.has(key) && numericFilter(params.get(key), key === 'minRating' ? 5 : Infinity) === undefined)
    || (params.has('availability') && !['true', 'false'].includes(params.get('availability') ?? ''))
    || location.invalid

  return (
    <section aria-labelledby="results-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="results-title" className="text-2xl sm:text-3xl">Explore artisans</h2>
        <p className="text-sm text-ink-muted">Refine the list with location, rating and availability.</p>
      </div>
      <ManualLocation />
      <form key={params.toString()} aria-label="Artisan filters" className="mt-6 grid gap-4 rounded-panel border border-line bg-surface p-5 shadow-card sm:grid-cols-2" onSubmit={event => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const next = new URLSearchParams(params)
        for (const key of ['q', 'minRating', 'minExperience', 'availability']) {
          const value = String(form.get(key) ?? '').trim()
          if (value) next.set(key, value)
          else next.delete(key)
        }
        next.delete('page')
        setParams(next)
      }}>
        <div className="sm:col-span-2">
          <Input name="q" label="Search artisans" placeholder="Name, skill or keyword" defaultValue={filters.q ?? ''} />
        </div>
        <Input name="minRating" label="Minimum rating" type="number" min="0" max="5" step="0.1" defaultValue={filters.minRating ?? ''} hint="From 0 to 5" />
        <Input name="minExperience" label="Minimum experience (years)" type="number" min="0" step="any" defaultValue={filters.minExperience ?? ''} />
        <label className="grid gap-2 text-sm font-semibold">Availability
          <select name="availability" defaultValue={filters.availability === undefined ? '' : String(filters.availability)} className="min-h-12 w-full min-w-0 rounded-control border border-control-border bg-surface px-3 py-2 transition-colors focus:border-accent">
            <option value="">Any availability</option>
            <option value="true">Available now</option>
            <option value="false">Currently unavailable</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">Sort results
          <select name="sort" defaultValue={sort ?? ''} className="min-h-12 w-full min-w-0 rounded-control border border-control-border bg-surface px-3 py-2 transition-colors focus:border-accent" onChange={event => {
            const next = new URLSearchParams(params)
            if (event.target.value) next.set('sort', event.target.value)
            else next.delete('sort')
            next.delete('page')
            setParams(next)
          }}>
            <option value="">Default order</option>
            <option value="rating">Highest rated</option>
            <option value="experience">Most experienced</option>
            <option value="newest">Newest first</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <Button type="submit">Search artisans</Button>
          <Button variant="secondary" onClick={() => setParams({})}>Clear all filters</Button>
        </div>
      </form>
      {rawSort !== null && sort === undefined && <p role="status" className="mt-4 text-sm text-ink-muted">The sort in this link is unavailable. Using default order.</p>}
      {rawPage !== null && page === undefined && <p role="status" className="mt-4 text-sm text-ink-muted">The page in this link is invalid. Showing the first page.</p>}
      {invalid && <p role="status" className="mt-4 text-sm text-ink-muted">Some filters in this link were invalid and have been ignored. Apply your filters to update the link.</p>}
      {results.isPending && <LoadingState label="Finding artisans..." />}
      {results.isFetching && !results.isPending && <LoadingState label="Refreshing artisans..." />}
      {results.isError && (
        <div className="mt-6">
          <ErrorState
            title="Artisans are unavailable"
            description={results.error instanceof ApiError && results.error.status === 429 ? 'Too many searches. Please wait a moment before trying again.' : results.error instanceof ApiError && results.error.status === 400 ? 'These filters could not be applied. Adjust or clear them and try again.' : 'We could not load artisans. Please try again.'}
            onRetry={results.isFetching ? undefined : () => { void results.refetch() }}
          />
        </div>
      )}
      {results.data && (
        <>
          <p role="status" className="mt-6 text-sm text-ink-muted">Showing {results.data.data.length} of {results.data.pagination.total} artisans</p>
          {results.data.data.length === 0 ? (
            (page ?? 1) > 1 ? (
              <EmptyState title="No artisans on this page" description="Results may have changed. Return to the first page to continue browsing.">
                <Button variant="secondary" onClick={() => changePage(1)}>Return to first page</Button>
              </EmptyState>
            ) : (
              <EmptyState title="No artisans found" description="Try another keyword or broaden your filters.">
                <Button variant="secondary" onClick={() => setParams({})}>Reset search</Button>
              </EmptyState>
            )
          ) : (
            <ul className="mt-4 grid gap-6 md:grid-cols-2">
              {results.data.data.map(artisan => (
                <li key={artisan.id} className="min-w-0">
                  <article className="flex h-full flex-col rounded-panel border border-line bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
                    <div className="flex items-start gap-4">
                      <ArtisanAvatar url={artisan.profileImageUrl} />
                      <div className="min-w-0">
                        <h3 className="wrap-break-word text-lg">
                          <Link to={'/artisans/' + encodeURIComponent(artisan.id)} className="no-underline hover:underline">{artisan.displayName}</Link>
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                          <MapPin size={14} aria-hidden="true" className="shrink-0" />
                          {[artisan.city, artisan.state].filter(Boolean).join(', ') || 'Location not provided'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <VerifiedBadge verified={artisan.verificationStatus === 'VERIFIED'} />
                          <Badge tone={artisan.isAvailable ? 'accent' : 'neutral'}>{artisan.isAvailable ? 'Available now' : 'Currently unavailable'}</Badge>
                        </div>
                      </div>
                    </div>
                    {artisan.bio && <p className="mt-4 line-clamp-3 wrap-break-word text-sm text-ink-muted">{artisan.bio}</p>}
                    <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-sm">
                      <span className="text-accent-text">{artisan.categories.map(category => category.name).join(' · ') || 'Services not listed'}</span>
                      <span className="text-ink-muted">{artisan.yearsExperience} {artisan.yearsExperience === 1 ? 'year' : 'years'} experience</span>
                      <Rating rating={artisan.averageRating} reviews={artisan.reviewCount} />
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
          {results.data.data.length > 0 && (
            <nav aria-label="Results pages" className="mt-8 flex flex-wrap items-center gap-4">
              <Button variant="secondary" disabled={results.isFetching || results.data.pagination.page <= 1} onClick={() => changePage(results.data.pagination.page - 1)}>
                Previous page
              </Button>
              <span role="status" className="text-sm text-ink-muted">
                Page {results.data.pagination.page} of {results.data.pagination.totalPages}
              </span>
              <Button variant="secondary" disabled={results.isFetching || results.data.pagination.page >= results.data.pagination.totalPages} onClick={() => changePage(results.data.pagination.page + 1)}>
                Next page
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}