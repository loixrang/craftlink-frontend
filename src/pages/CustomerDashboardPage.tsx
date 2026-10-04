import { useQuery } from '@tanstack/react-query'
import { ArrowRight, MapPin, Search, Sparkles, Wrench } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { Input } from '../components/ui/Input'
import { getCategories } from '../services/categories'

export function CustomerDashboardPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const categories = useQuery({ queryKey: ['categories'], queryFn: ({ signal }) => getCategories(signal) })

  return <div className="space-y-12 sm:space-y-16">
    <header>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.04em] text-accent-text"><Sparkles size={18} aria-hidden="true" />Welcome back</p>
      <h1 className="text-3xl sm:text-headline">Customer dashboard</h1>
      <p className="mt-4 max-w-xl text-ink-muted">A repair, a fresh idea, your next project. Find the right skills to get started.</p>
    </header>

    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <section aria-labelledby="customer-search-title" className="min-w-0 rounded-panel border border-line bg-surface p-5 shadow-card sm:p-8">
        <h2 id="customer-search-title" className="text-2xl">What do you need help with?</h2>
        <form aria-label="Search for artisans" className="mt-6 space-y-4" onSubmit={event => {
          event.preventDefault()
          const value = new FormData(event.currentTarget).get('q')
          const q = typeof value === 'string' ? value.trim() : ''
          navigate({ pathname: '/artisans', search: q ? `?${new URLSearchParams({ q })}` : '' })
        }}>
          <Input label="Service or keyword" name="q" type="search" placeholder="Try plumbing or tailoring" />
          <Button type="submit"><Search size={18} aria-hidden="true" />Search artisans</Button>
        </form>
        <p className="mt-6 flex items-start gap-2 text-sm text-ink-muted"><MapPin size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />On the results page, select your state and city to find nearby artisans.</p>
      </section>
      <aside aria-labelledby="customer-account-title" className="min-w-0 rounded-panel border border-line bg-surface-muted p-5 sm:p-6">
        <h2 id="customer-account-title" className="text-lg">Your account</h2>
        <dl className="mt-5 space-y-4">
          <div><dt className="text-sm text-ink-muted">Signed in as</dt><dd className="mt-1 break-all font-medium">{session?.user.email}</dd></div>
          <div><dt className="text-sm text-ink-muted">Account type</dt><dd className="mt-2"><Badge>Customer</Badge></dd></div>
        </dl>
        <p className="mt-6 text-sm text-ink-muted">You can sign out from the navigation menu when you have finished.</p>
        <Link className="mt-4 inline-flex min-h-11 items-center font-semibold" to="/customer/account">View account details</Link>
      </aside>
    </div>

    <section aria-labelledby="customer-categories-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="customer-categories-title" className="text-2xl sm:text-3xl">Explore services</h2>
        <Link to="/artisans" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">Browse all artisans<ArrowRight size={18} aria-hidden="true" /></Link>
      </div>
      {categories.isPending && <LoadingState label="Loading services..." />}
      {categories.isError && <ErrorState title="Services are unavailable" description="We couldn't load service categories. You can still search for an artisan above." onRetry={categories.isFetching ? undefined : () => { void categories.refetch() }} />}
      {categories.isFetching && !categories.isPending && <LoadingState label="Refreshing services..." />}
      {!categories.isError && categories.data && (categories.data.length === 0
        ? <EmptyState title="No service categories yet" description="You can still browse artisans while categories are being added." />
        : <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data.map(category => <li key={category.id} className="min-w-0">
            <Link to={{ pathname: '/artisans', search: `?${new URLSearchParams({ categoryId: category.id })}` }} className="flex min-h-16 items-center justify-between gap-4 rounded-panel border border-line bg-surface px-5 py-4 text-ink no-underline transition-colors hover:border-accent/40 hover:bg-surface-muted">
              <span className="min-w-0 wrap-break-word font-medium">{category.name}</span><ArrowRight size={18} className="shrink-0 text-accent" aria-hidden="true" />
            </Link>
          </li>)}
        </ul>)}
    </section>

    <section aria-labelledby="customer-requests-title" className="border-t border-line pt-8">
      <div className="flex items-center gap-3"><Wrench size={22} className="text-accent" aria-hidden="true" /><h2 id="customer-requests-title" className="text-2xl sm:text-3xl">Plan your next project</h2></div>
      <p className="mt-4 max-w-2xl text-ink-muted">Explore artisan profiles to compare services, past work and available contact details.</p>
      <p className="mt-3 max-w-2xl text-sm text-ink-muted">Choose Request a service on an artisan's profile to send your project details.</p>
      <Link className="mt-4 inline-flex min-h-11 items-center" to="/customer/requests">View request history</Link>
    </section>
  </div>
}
