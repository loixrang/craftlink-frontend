import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, Armchair, BadgeCheck, Bell, Camera, CookingPot, Droplets, Hammer,
  MapPin, Paintbrush, Scissors, Search, Sparkles, Star, UserRound, Wrench, Zap,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LoadingState } from '../components/ui/Feedback'
import { VerifiedBadge } from '../components/ui/VerifiedBadge'
import { DEFAULT_STATE, getLgasForState } from '../constants/locations'
import { getArtisans } from '../services/artisans'
import { getArtisanProfile, publicImageUrl } from '../services/artisanProfile'
import { getCategories } from '../services/categories'

const cities = getLgasForState(DEFAULT_STATE)

const categoryIcons: readonly (readonly [RegExp, LucideIcon])[] = [
  [/electri|rewir|invert|power|hvac|generator/i, Zap],
  [/plumb|pipe|sanitar|drain|water|gas/i, Droplets],
  [/carpent|cabinet|wood|roof|joiner|fenc|mason|tile|block/i, Hammer],
  [/paint|decor|stucco|wall|finish/i, Paintbrush],
  [/tailor|fashion|apparel|seam|cobbler|leather|weav|design/i, Scissors],
  [/appliance|repair|technician|mechanic|aircond/i, Wrench],
  [/photo|camera|video|media|film|print/i, Camera],
  [/furniture|upholster|interior/i, Armchair],
  [/beauty|hair|barber|makeup|spa|salon/i, Sparkles],
  [/cater|food|bakery|chef|cook/i, CookingPot],
]

function iconFor(name: string): LucideIcon {
  return categoryIcons.find(([pattern]) => pattern.test(name))?.[1] ?? Wrench
}

const steps = [
  {
    title: 'Tell us what you need',
    description: 'Search by service, pick a city and filter by rating, experience or availability to find the right starting point.',
    note: 'Supported across Akwa Ibom',
    icon: MapPin,
  },
  {
    title: 'Compare verified profiles',
    description: 'Review biographies, years of experience, customer ratings, listed services, portfolio images and verified credentials.',
    note: 'Credentials reviewed by our team',
    icon: BadgeCheck,
  },
  {
    title: 'Send a service request',
    description: 'Choose a listed service, describe your project and add a preferred date. Follow every status update from your account.',
    note: 'No online payment required',
    icon: Bell,
  },
]

function ArtisanImage({ url, alt, className }: { url: string | null; alt: string; className: string }) {
  const src = publicImageUrl(url)
  return src
    ? <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" className={className} />
    : <span role="img" aria-label={`${alt}: image unavailable`} className={`${className} flex items-center justify-center bg-surface-muted text-ink-muted`}><UserRound aria-hidden="true" /></span>
}

export function LandingPage() {
  const navigate = useNavigate()
  const categories = useQuery({ queryKey: ['categories'], queryFn: ({ signal }) => getCategories(signal) })
  const featured = useQuery({ queryKey: ['artisans', 'landing-featured'], queryFn: ({ signal }) => getArtisans({ sort: 'rating' }, signal) })
  const artisan = featured.data?.data[0]
  const profile = useQuery({
    queryKey: ['artisan-profile', artisan?.id],
    queryFn: ({ signal }) => getArtisanProfile(artisan!.id, signal),
    enabled: !!artisan,
  })
  const showcase = profile.isError ? undefined : profile.data
  const priceFrom = showcase?.services.reduce<number | null>((lowest, service) => service.priceFrom == null ? lowest : lowest === null ? service.priceFrom : Math.min(lowest, service.priceFrom), null) ?? null
  const artwork = showcase?.portfolio[0]

  const stats: readonly { value: string; label: string }[] = [
    { value: featured.data ? featured.data.pagination.total.toLocaleString() : '—', label: 'Artisans listed' },
    { value: categories.data ? categories.data.length.toLocaleString() : '—', label: 'Service categories' },
    { value: cities.length.toLocaleString(), label: 'Cities covered' },
  ]

  return (
    <div className="full-bleed bg-canvas">
      <section aria-labelledby="landing-title" className="relative overflow-hidden pt-14 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-accent/15 blur-[128px]" />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-amber/10 blur-[110px]" />
        <div className="relative z-10 mx-auto grid w-full max-w-content items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-10">
          <div className="flex flex-col items-start gap-4 lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-[0.04em] text-accent-soft-ink shadow-card">
              <span aria-hidden="true" className="relative flex size-2.5 items-center justify-center">
                <span className="absolute inline-flex size-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
              </span>
              Verified local skills · Everyday possibilities
            </p>
            <h1 id="landing-title" className="text-4xl text-ink sm:text-5xl lg:text-display">
              Find the right <span className="text-amber">hands</span> for the job.
            </h1>
            <p className="max-w-xl text-base text-ink-muted sm:text-lg">
              From urgent home repairs that cannot wait to custom fabrication and bespoke projects you have been planning.
              Connect with skilled artisans across your community.
            </p>

            <form aria-label="Find an artisan" className="mt-2 flex w-full flex-col gap-2 rounded-modal bg-surface p-2 shadow-float md:flex-row md:items-center"
              onSubmit={event => {
                event.preventDefault()
                const values = new FormData(event.currentTarget)
                const search = new URLSearchParams()
                const categoryId = String(values.get('categoryId') ?? '')
                const city = String(values.get('city') ?? '')
                if (categoryId) search.set('categoryId', categoryId)
                if (city) search.set('city', city)
                navigate({ pathname: '/artisans', search: search.size ? `?${search.toString()}` : '' })
              }}>
              <div className="focus-within:ring-accent/30 flex flex-1 items-center gap-2 rounded-control bg-canvas/80 px-3 py-1 focus-within:ring-[3px]">
                <Search aria-hidden="true" size={20} className="shrink-0 text-amber" />
                <label htmlFor="landing-category" className="sr-only">Service category</label>
                <select id="landing-category" name="categoryId" defaultValue=""
                  className="min-h-11 w-full min-w-0 cursor-pointer appearance-none rounded-control bg-transparent pr-4 text-sm text-ink">
                  <option value="">All services</option>
                  {categories.data?.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
              <div className="focus-within:ring-accent/30 flex flex-1 items-center gap-2 rounded-control bg-canvas/80 px-3 py-1 focus-within:ring-[3px]">
                <MapPin aria-hidden="true" size={20} className="shrink-0 text-amber" />
                <label htmlFor="landing-city" className="sr-only">City or LGA</label>
                <select id="landing-city" name="city" defaultValue=""
                  className="min-h-11 w-full min-w-0 cursor-pointer appearance-none rounded-control bg-transparent pr-4 text-sm text-ink">
                  <option value="">Any city</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <Button type="submit" className="w-full md:w-auto">Find artisans<ArrowRight size={18} aria-hidden="true" /></Button>
            </form>

            <div className="grid w-full grid-cols-3 gap-4 pt-4">
              {stats.map(({ value, label }) => <div key={label}>
                <p className="text-2xl font-bold text-ink tabular-nums">{value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.04em] text-ink-muted">{label}</p>
              </div>)}
            </div>
          </div>

          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <article className="relative w-full max-w-md rounded-modal bg-surface p-4 shadow-float">
              {featured.isPending && <LoadingState label="Loading a featured artisan…" />}
              {featured.isError && <p className="py-8 text-center text-sm text-ink-muted">Artisans are unavailable right now. <Link to="/artisans">Browse categories</Link> to keep exploring.</p>}
              {featured.isSuccess && !artisan && <div className="py-8 text-center">
                <p className="font-semibold">No artisan profiles yet</p>
                <p className="mt-2 text-sm text-ink-muted">Be the first to share your craft with customers nearby.</p>
                <Link to="/register" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent no-underline shadow-action hover:bg-accent-hover">Join as an artisan<ArrowRight size={18} aria-hidden="true" /></Link>
              </div>}
              {artisan && <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <ArtisanImage url={artisan.profileImageUrl} alt={artisan.displayName} className="size-12 shrink-0 rounded-full object-cover" />
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-2 text-lg">
                        <span className="min-w-0 truncate">{artisan.displayName}</span>
                        <VerifiedBadge verified={artisan.verificationStatus === 'VERIFIED'} className="shrink-0 px-2 py-0.5 text-[0.6875rem]" />
                      </h2>
                      <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                        <MapPin size={14} aria-hidden="true" className="shrink-0" />
                        {[artisan.city, artisan.state].filter(Boolean).join(', ') || 'Location not provided'}
                      </p>
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-accent-soft text-accent-soft-ink">Top rated</Badge>
                </div>
                {artwork ? <figure className="mt-1 overflow-hidden rounded-control">
                  <ArtisanImage url={artwork.imageUrl} alt={artwork.title} className="aspect-4/3 w-full object-cover" />
                  <figcaption className="mt-2 text-xs font-semibold text-ink-muted">{artwork.title}</figcaption>
                </figure> : <div className="mt-1 flex aspect-4/3 items-center justify-center rounded-control bg-canvas px-4 text-center text-sm text-ink-muted">
                  {profile.isPending ? 'Loading portfolio…' : 'No portfolio work shared yet.'}
                </div>}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.04em] text-ink-muted">Starting from</p>
                    <p className="text-lg font-bold text-amber tabular-nums">{priceFrom === null ? 'On enquiry' : priceFrom.toLocaleString('en-NG')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {artisan.averageRating !== null && artisan.reviewCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-3 py-2 text-sm font-semibold text-ink">
                      <Star size={16} aria-hidden="true" className="text-amber" />
                      {artisan.averageRating.toFixed(1)}
                      <span className="sr-only">out of 5 from {artisan.reviewCount} reviews</span>
                      <span aria-hidden="true" className="text-ink-muted">({artisan.reviewCount})</span>
                    </span>}
                    <Link to={`/artisans/${encodeURIComponent(artisan.id)}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent no-underline shadow-action hover:bg-accent-hover">
                      View profile<ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>}
            </article>
          </div>
        </div>
      </section>

      <section id="services" aria-labelledby="services-title" className="scroll-mt-28 bg-surface/60 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-10">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.04em] text-amber">Master trades</p>
              <h2 id="services-title" className="text-3xl text-ink sm:text-headline">Skills for the everyday and beyond</h2>
            </div>
            <Link to="/artisans" className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber no-underline hover:text-accent-text">
              Explore all categories<ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          {categories.isPending && <LoadingState label="Loading service categories…" />}
          {categories.isError && <p className="text-sm text-ink-muted">Service categories are unavailable right now. <Link to="/artisans">Browse all artisans</Link> instead.</p>}
          {categories.data && categories.data.length === 0 && <p className="text-sm text-ink-muted">Service categories will appear here once they are available.</p>}
          {categories.data && categories.data.length > 0 && <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.data.map(category => {
              const Icon = iconFor(category.name)
              return <li key={category.id}>
                <Link to={`/artisans?categoryId=${encodeURIComponent(category.id)}`}
                  className="group flex h-48 flex-col justify-between rounded-modal bg-surface p-5 text-ink no-underline shadow-card transition-all hover:-translate-y-1 hover:shadow-lift">
                  <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-control bg-accent/15 text-amber transition-colors group-hover:bg-accent group-hover:text-on-accent">
                    <Icon size={26} />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold transition-colors group-hover:text-amber">{category.name}</span>
                    <span className="mt-1 block text-sm text-ink-muted">Browse verified artisans</span>
                  </span>
                </Link>
              </li>
            })}
          </ul>}
        </div>
      </section>

      <section aria-labelledby="steps-title" className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-10">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.04em] text-amber">Transparent process</p>
            <h2 id="steps-title" className="text-3xl text-ink sm:text-headline">How Craftlink works</h2>
            <p className="mt-3 text-ink-muted">Direct, verified connection built on mutual trust, proof of skill and clear accountability at every stage.</p>
          </div>
          <ol className="grid gap-8 lg:grid-cols-3">
            {steps.map(({ title, description, note, icon: Icon }, index) => <li key={title} className="flex flex-col gap-4 rounded-modal bg-surface p-6 shadow-card">
              <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-amber text-lg font-bold text-on-accent shadow-action">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-xl">{title}</h3>
                <p className="mt-2 text-sm text-ink-muted">{description}</p>
              </div>
              <p className="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-line pt-4 text-xs font-semibold uppercase tracking-[0.04em] text-ink-muted">
                {note}<Icon size={18} aria-hidden="true" className="text-amber" />
              </p>
            </li>)}
          </ol>
        </div>
      </section>

      <section aria-labelledby="artisan-title" className="pb-16 sm:pb-20">
        <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-10">
          <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-modal bg-surface p-8 shadow-float sm:p-12 lg:flex-row">
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative z-10 max-w-xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold uppercase tracking-[0.04em] text-amber">Artisan community network</p>
              <h2 id="artisan-title" className="text-3xl text-ink sm:text-headline">Your skills deserve to be seen.</h2>
              <p className="mt-3 text-ink-muted">Create an artisan account to share your services, portfolio and credentials with customers looking for skills like yours.</p>
            </div>
            <div className="relative z-10 flex w-full flex-col items-center gap-3 lg:w-auto lg:flex-row">
              <Link to="/register" className="w-full rounded-full bg-accent px-8 py-3 text-center text-sm font-semibold text-on-accent no-underline shadow-action transition-colors hover:bg-accent-hover sm:w-auto">Join as an artisan</Link>
              <Link to="/artisans" className="w-full rounded-full bg-canvas px-6 py-3 text-center text-sm font-semibold text-ink no-underline transition-colors hover:bg-surface-muted sm:w-auto">Browse artisans</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}