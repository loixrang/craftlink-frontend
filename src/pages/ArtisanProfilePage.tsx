import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Star, UserRound } from 'lucide-react'
import { getArtisanProfile, publicImageUrl, contactNumber } from '../services/artisanProfile'
import { ApiError } from '../services/api'
import { LoadingState, ErrorState } from '../components/ui/Feedback'
import { Badge } from '../components/ui/Badge'
import { SeoMetadata } from '../components/SeoMetadata'

function PublicImage({ url, alt, className }: { url: string | null; alt: string; className: string }) {
  const [failed, setFailed] = useState(false)
  const src = publicImageUrl(url)
  return src && !failed ? <img src={src} alt={alt} className={className} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : <div className={`${className} flex items-center justify-center bg-surface-muted text-ink-muted`}><UserRound aria-hidden="true" /><span className="sr-only">{alt}: image unavailable</span></div>
}

export function ArtisanProfilePage() {
  const { artisanId = '' } = useParams()
  const result = useQuery({ queryKey: ['artisan-profile', artisanId], queryFn: ({ signal }) => getArtisanProfile(artisanId, signal) })
  const artisan = result.isError ? undefined : result.data
  const phone = contactNumber(artisan?.phone ?? null)
  const whatsapp = contactNumber(artisan?.whatsapp ?? null)
  const notFound = result.error instanceof ApiError && result.error.status === 404
  return <>
    <SeoMetadata title={artisan ? `${artisan.displayName} | Artisan on Craftlink` : 'Artisan profile | Craftlink'} description={artisan ? `${artisan.bio?.trim() || `Explore ${artisan.displayName}'s artisan profile, services and portfolio on Craftlink.`}`.slice(0, 160) : 'View this artisan profile on Craftlink.'} canonicalPath={`/artisans/${encodeURIComponent(artisanId)}`} indexable={!!artisan} />
    <Link to="/artisans" className="mb-8 inline-flex min-h-11 items-center gap-2"><ArrowLeft size={16} aria-hidden="true" />Browse artisans</Link>
    {!artisan && <h1 className="text-3xl tracking-tight">Artisan profile</h1>}
    {result.isPending && <LoadingState label="Loading artisan profile..." />}
    {result.isError && <div className="mt-6"><ErrorState title={notFound ? 'Artisan not found' : 'Profile unavailable'} description={notFound ? 'This profile may no longer be available. Browse artisans to find someone else.' : result.error instanceof ApiError && result.error.status === 429 ? 'Too many requests. Please wait a moment and try again.' : 'We could not load this profile. Please try again.'} onRetry={notFound || result.isFetching ? undefined : () => { void result.refetch() }} /></div>}
    {artisan && <>
      {result.isFetching && <LoadingState label="Refreshing profile..." />}
      <header className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row">
        <PublicImage key={artisan.id + artisan.profileImageUrl} url={artisan.profileImageUrl} alt={artisan.displayName} className="h-28 w-28 shrink-0 rounded-panel object-cover" />
        <div className="min-w-0"><p className="mb-2 text-sm font-medium text-accent">Meet your artisan</p><h1 className="text-3xl tracking-tight sm:text-4xl">{artisan.displayName}</h1>
          <p className="mt-3 flex items-center gap-2 text-ink-muted"><MapPin size={16} aria-hidden="true" />{[artisan.city, artisan.state].filter(Boolean).join(', ') || 'Location not provided'}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm"><Badge>{artisan.isAvailable ? 'Available now' : 'Currently unavailable'}</Badge><span>{artisan.yearsExperience} {artisan.yearsExperience === 1 ? 'year' : 'years'} of experience</span><span className="inline-flex items-center gap-1"><Star size={16} aria-hidden="true" />{artisan.reviewCount > 0 && artisan.averageRating !== null ? `${artisan.averageRating.toFixed(1)} / 5 (${artisan.reviewCount} reviews)` : 'No ratings yet'}</span></div>
        </div>
      </header>
      <div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="about-title"><h2 id="about-title" className="text-2xl">About</h2><p className="mt-4 whitespace-pre-line text-ink-muted">{artisan.bio || 'This artisan has not added a biography yet.'}</p></section>
          <section aria-labelledby="services-title"><h2 id="services-title" className="text-2xl">Services</h2>{artisan.services.length ? <ul className="mt-4 divide-y divide-line">{artisan.services.map(service => <li key={service.id} className="py-5 first:pt-0"><h3 className="text-lg">{service.title}</h3><p className="mt-2 whitespace-pre-line text-ink-muted">{service.description}</p>{service.priceFrom != null && <p className="mt-3 text-sm">Starting price: {service.priceFrom.toLocaleString('en-NG')} · Confirm currency and final quote with the artisan.</p>}</li>)}</ul> : <p className="mt-4 text-ink-muted">No services listed yet.</p>}</section>
          <section aria-labelledby="portfolio-title"><h2 id="portfolio-title" className="text-2xl">Portfolio</h2>{artisan.portfolio.length ? <ul className="mt-4 grid gap-6 sm:grid-cols-2">{artisan.portfolio.map(item => <li key={item.id}><PublicImage key={item.imageUrl} url={item.imageUrl} alt={item.title} className="aspect-4/3 w-full rounded-control object-cover" /><h3 className="mt-3 text-lg">{item.title}</h3>{item.description && <p className="mt-2 text-ink-muted">{item.description}</p>}</li>)}</ul> : <p className="mt-4 text-ink-muted">No portfolio work shared yet.</p>}</section>
          <section aria-labelledby="credentials-title"><h2 id="credentials-title" className="text-2xl">Credentials</h2>{artisan.credentials.length ? <ul className="mt-4 space-y-5">{artisan.credentials.map(item => <li key={item.id}><h3 className="text-lg">{item.title}</h3><p className="mt-1 text-ink-muted">{item.issuer}</p><p className="mt-2 text-sm">{item.verificationStatus === 'VERIFIED' ? 'Verified credential' : item.verificationStatus === 'PENDING' ? 'Verification pending' : 'Not verified'}</p>{item.issuedAt && /^\d{4}-\d{2}-\d{2}/.test(item.issuedAt) && <p className="mt-1 text-sm text-ink-muted">Issued: {item.issuedAt.slice(0, 10)}</p>}</li>)}</ul> : <p className="mt-4 text-ink-muted">No credentials shared yet.</p>}</section>
        </div>
        <aside aria-labelledby="contact-title" className="h-fit rounded-panel border border-line bg-surface p-6 shadow-subtle"><h2 id="contact-title" className="text-xl">Discuss your project</h2><p className="mt-3 text-sm text-ink-muted">Ask about the work, timing and a quote directly.</p><div className="mt-5 flex flex-col gap-3">{phone && <a className="inline-flex min-h-11 items-center gap-2 wrap-anywhere" href={'tel:' + phone}><Phone size={16} aria-hidden="true" />Call {phone}</a>}{whatsapp && <a className="inline-flex min-h-11 items-center" href={'https://wa.me/' + whatsapp.replace(/^\+/, '')} target="_blank" rel="noopener noreferrer">Contact on WhatsApp (opens a new tab)</a>}{!phone && !whatsapp && <p className="text-sm text-ink-muted">No public contact methods provided.</p>}</div><div className="mt-6 border-t border-line pt-6"><Link to={`/customer/requests/new/${encodeURIComponent(artisan.id)}`} aria-describedby="request-note" className="inline-flex min-h-11 w-full items-center justify-center rounded-control bg-accent px-4 py-2 text-sm font-semibold text-on-accent no-underline hover:bg-accent-hover">Request a service</Link><p id="request-note" className="mt-3 text-sm text-ink-muted">Choose a listed service and describe your project. A customer account is required.</p></div></aside>
      </div>
    </>}
  </>
}
