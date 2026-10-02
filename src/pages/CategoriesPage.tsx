import { ArtisanResults } from './ArtisanResults'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Check, Grid2X2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { getCategories } from '../services/categories'

export function CategoriesPage() {
  const [params] = useSearchParams()
  const categories = useQuery({ queryKey: ['categories'], queryFn: ({ signal }) => getCategories(signal) })
  const categoryId = params.get('categoryId')
  const searchIntent = params.get('q')
  // Existing landing links carry names; resolve their IDs only from the server.
  const selected = categories.data?.find(category => categoryId !== null
    ? category.id === categoryId
    : category.name === searchIntent)

  function categoryLink(id?: string) {
    const next = new URLSearchParams(params)
    next.delete('page')
    next.delete('q')
    next.delete('categoryId')
    if (id) next.set('categoryId', id)
    return { pathname: '/artisans', search: next.size ? '?' + next.toString() : '' }
  }

  return <div>
    <header>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.04em] text-accent-text"><Grid2X2 size={18} aria-hidden="true" />Skills for everyday life</p>
      <h1 className="text-3xl sm:text-headline">Find an artisan</h1>
      <p className="mt-4 max-w-2xl text-ink-muted">Start with the service you need. Browse categories for your home, business or next project, then filter by location, rating and availability.</p>
    </header>
    <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <section aria-labelledby="categories-title" className="rounded-panel border border-line bg-surface p-5 shadow-card">
            <h2 id="categories-title" className="text-xl">Browse categories</h2>
            {categories.isPending && <LoadingState label="Loading categories..." />}
            {categories.isError && <div className="mt-4"><ErrorState title="Categories are unavailable" description="We couldn't load the service categories. Please try again." onRetry={categories.isFetching ? undefined : () => { void categories.refetch() }} /></div>}
            {categories.isFetching && !categories.isPending && <LoadingState label="Refreshing categories..." />}
            {categories.data && <>
              {categories.data.length === 0 ? <EmptyState title="No categories yet" description="Service categories will appear here when they are available." /> : <>
                <Link to={categoryLink()} aria-current={categoryId === null && !selected ? 'true' : undefined} className="mt-4 inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold no-underline transition-colors hover:bg-surface-muted">All categories</Link>
                <ul className="mt-2 flex flex-col">
                  {categories.data.map(category => <li key={category.id} className="border-b border-line last:border-b-0">
                    <Link to={categoryLink(category.id)} aria-current={selected?.id === category.id ? 'true' : undefined} className={'flex min-h-14 items-center justify-between gap-4 rounded-control px-3 py-3 text-sm no-underline transition-colors hover:bg-surface-muted ' + (selected?.id === category.id ? 'bg-accent-soft font-semibold text-accent-soft-ink' : 'text-ink')}>
                      <span className="min-w-0 break-words">{category.name}</span>
                      {selected?.id === category.id ? <Check size={18} className="shrink-0" aria-hidden="true" /> : <ArrowRight size={16} className="shrink-0 text-accent-text" aria-hidden="true" />}
                    </Link>
                  </li>)}
                </ul>
              </>}
              {categoryId !== null && !selected && <div className="mt-4"><EmptyState title="Category not available" description="This category may have changed. Choose an available category or clear your selection."><Link to={categoryLink()} className="inline-flex min-h-11 items-center">Clear category selection</Link></EmptyState></div>}
              {selected && <p role="status" className="mt-4 rounded-control bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-soft-ink">Selected: {selected.name}</p>}
            </>}
          </section>
        </div>
      </div>
      <div className="min-w-0 lg:col-span-8">
        <ArtisanResults />
      </div>
    </div>
  </div>
}