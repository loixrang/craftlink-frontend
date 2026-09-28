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
    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent-hover"><Grid2X2 size={18} aria-hidden="true" />Skills for everyday life</p>
    <h1 className="text-3xl tracking-tight sm:text-4xl">Find an artisan</h1>
    <p className="mt-4 max-w-xl text-ink-muted">Start with the service you need. Browse categories for your home, business or next project.</p>
    <section aria-labelledby="categories-title" className="mt-10">
      <h2 id="categories-title" className="text-2xl tracking-tight">Browse categories</h2>
      {categories.isPending && <LoadingState label="Loading categories..." />}
      {categories.isError && <div className="mt-6"><ErrorState title="Categories are unavailable" description="We couldn't load the service categories. Please try again." onRetry={categories.isFetching ? undefined : () => { void categories.refetch() }} /></div>}
      {categories.isFetching && !categories.isPending && <LoadingState label="Refreshing categories..." />}
      {categories.data && <>
        {categories.data.length === 0 ? <EmptyState title="No categories yet" description="Service categories will appear here when they are available." /> : <>
          <Link to={categoryLink()} aria-current={categoryId === null && !selected ? 'true' : undefined} className="mt-5 inline-flex min-h-11 items-center font-semibold">All categories</Link>
          <ul className="mt-2 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {categories.data.map(category => <li key={category.id} className="border-b border-line">
              <Link to={categoryLink(category.id)} aria-current={selected?.id === category.id ? 'true' : undefined} className={'flex min-h-20 items-center justify-between gap-4 px-3 py-5 no-underline hover:bg-surface-muted ' + (selected?.id === category.id ? 'bg-accent-soft font-semibold text-accent-hover' : 'text-ink')}>
                <span className="min-w-0 break-words">{category.name}</span>
                {selected?.id === category.id ? <Check size={20} className="shrink-0" aria-hidden="true" /> : <ArrowRight size={18} className="shrink-0 text-accent" aria-hidden="true" />}
              </Link>
            </li>)}
          </ul>
        </>}
        {categoryId !== null && !selected && <div className="mt-6"><EmptyState title="Category not available" description="This category may have changed. Choose an available category or clear your selection."><Link to={categoryLink()} className="inline-flex min-h-11 items-center">Clear category selection</Link></EmptyState></div>}
        {selected && <div role="status" className="mt-8 border-l-4 border-accent pl-5"><p className="font-semibold">Selected: {selected.name}</p><p className="mt-2 text-sm text-ink-muted">Artisan listings for this category are coming soon.</p></div>}
      </>}
    </section>
  </div>
}
