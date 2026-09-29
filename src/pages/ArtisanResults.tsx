import { useQuery } from '@tanstack/react-query'
import { MapPin, Star, UserRound } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { getArtisans, type ArtisanFilters, type ArtisanSort } from '../services/artisans'
import { ApiError } from '../services/api'
import { readLocation } from '../schemas/location'
import { ManualLocation } from './ManualLocation'

function numericFilter(value: string | null, max = Infinity) {
  if (!value?.trim()) return undefined
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 && number <= max ? number : undefined
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
    <section aria-labelledby="results-title" className="mt-12 border-t border-line pt-8">
      <h2 id="results-title" className="text-2xl tracking-tight">Explore artisans</h2>
      <ManualLocation />
      <form key={params.toString()} className="mt-6 grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={event => {
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
          <select name="availability" defaultValue={filters.availability === undefined ? '' : String(filters.availability)} className="min-h-11 rounded-control border border-control-border bg-surface px-3 py-2">
            <option value="">Any availability</option>
            <option value="true">Available now</option>
            <option value="false">Currently unavailable</option>
          </select>
        </label>
        <Button type="submit">Search artisans</Button>
        <Button variant="quiet" onClick={() => setParams({})}>Clear all filters</Button>
      </form>
      <div className="mt-6 max-w-sm">
        <label className="grid gap-2 text-sm font-semibold">Sort results
          <select value={sort ?? ''} className="min-h-11 rounded-control border border-control-border bg-surface px-3 py-2" onChange={event => {
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
      </div>
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
                <li key={artisan.id} className="min-w-0 border-b border-line pb-6">
                  <article>
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-surface-muted">
                        <UserRound aria-hidden="true" size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="wrap-break-word text-xl">
                          <Link to={'/artisans/' + encodeURIComponent(artisan.id)}>{artisan.displayName}</Link>
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                          <MapPin size={14} aria-hidden="true" />
                          {[artisan.city, artisan.state].filter(Boolean).join(', ') || 'Location not provided'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-accent-hover">{artisan.categories.map(category => category.name).join(' · ') || 'Services not listed'}</p>
                    {artisan.bio && <p className="mt-2 line-clamp-3 wrap-break-word text-ink-muted">{artisan.bio}</p>}
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <span>{artisan.yearsExperience} {artisan.yearsExperience === 1 ? 'year' : 'years'} of experience</span>
                      <span className="inline-flex items-center gap-1">
                        <Star size={15} aria-hidden="true" />
                        {artisan.reviewCount > 0 && artisan.averageRating !== null ? `${artisan.averageRating.toFixed(1)} / 5 (${artisan.reviewCount} reviews)` : 'No ratings yet'}
                      </span>
                      <span>{artisan.isAvailable ? 'Available now' : 'Currently unavailable'}</span>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
          {results.data.data.length > 0 && (
            <nav aria-label="Results pages" className="mt-6 flex flex-wrap items-center gap-4">
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
