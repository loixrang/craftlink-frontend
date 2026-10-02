import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Briefcase, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { ApiError } from '../services/api'
import { getOwnArtisanProfile } from '../services/ownArtisanProfile'

export function ArtisanDashboardPage() {
  const { session } = useAuth()
  const profile = useQuery({
    queryKey: ['own-artisan-profile', session?.user.id],
    enabled: !!session,
    queryFn: ({ signal }) => getOwnArtisanProfile(session!.accessToken, signal),
  })
  const data = profile.isError ? undefined : profile.data
  const error = profile.error
  const errorMessage = error instanceof ApiError && error.status === 401
    ? 'Your session has expired. Sign out and log in again to view your profile.'
    : error instanceof ApiError && error.status === 403
      ? 'Your account cannot access this artisan profile.' : 'We could not load your profile. Please try again.'

  return <div className="space-y-12 sm:space-y-16">
    <header>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.04em] text-accent-text"><Briefcase size={18} aria-hidden="true" />Your work, at a glance</p>
      <h1 className="text-3xl sm:text-headline">Artisan dashboard</h1>
      <p className="mt-4 max-w-xl text-ink-muted">See how your business is represented on Craftlink.</p>
    </header>
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <section aria-labelledby="artisan-profile-title" className="min-w-0 rounded-panel border border-line bg-surface p-5 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="artisan-profile-title" className="text-2xl">Profile overview</h2>
          {profile.isSuccess && <Button variant="secondary" pending={profile.isFetching} onClick={() => { void profile.refetch() }}>Refresh profile</Button>}
        </div>
        {profile.isPending && <LoadingState label="Loading your profile..." />}
        {profile.isError && <ErrorState title="Profile unavailable" description={errorMessage} onRetry={profile.isFetching ? undefined : () => { void profile.refetch() }} />}
        {profile.isFetching && !profile.isPending && <LoadingState label="Refreshing your profile..." />}
        {data === null && <EmptyState title="No artisan profile yet" description="Your artisan account is ready. Open profile settings to add your business details." />}
        {data && <div className="mt-6 space-y-5">
          <h3 className="break-words text-xl">{data.displayName}</h3>
          <Badge tone={data.isAvailable ? 'accent' : 'neutral'}>{data.isAvailable ? 'Available for work' : 'Not available for work'}</Badge>
          <p className="whitespace-pre-wrap break-words text-ink-muted">{data.bio?.trim() || 'No introduction added yet.'}</p>
          <dl className="grid gap-5 rounded-control bg-surface-muted p-5 sm:grid-cols-2">
            <div className="min-w-0"><dt className="flex items-center gap-2 text-sm text-ink-muted"><MapPin size={16} aria-hidden="true" />Location</dt><dd className="mt-2 break-words">{[data.city, data.state].filter(value => value?.trim()).join(', ') || 'Location not added yet'}</dd></div>
            <div><dt className="text-sm text-ink-muted">Experience</dt><dd className="mt-2">{data.yearsExperience} {data.yearsExperience === 1 ? 'year' : 'years'}</dd></div>
          </dl>
          <Link to={`/artisans/${data.id}`} className="inline-flex min-h-11 items-center gap-2 font-semibold">View public profile<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>}
      </section>
      <aside aria-labelledby="artisan-account-title" className="min-w-0 rounded-panel border border-line bg-surface-muted p-5 sm:p-6">
        <h2 id="artisan-account-title" className="text-lg">Your account</h2>
        <dl className="mt-5 space-y-4">
          <div><dt className="text-sm text-ink-muted">Signed in as</dt><dd className="mt-1 break-all font-medium">{session?.user.email}</dd></div>
          <div><dt className="text-sm text-ink-muted">Account type</dt><dd className="mt-2"><Badge>Artisan</Badge></dd></div>
        </dl>
        <p className="mt-6 text-sm text-ink-muted">Use the navigation menu to sign out when you have finished.</p>
      </aside>
    </div>
    <section aria-labelledby="artisan-tools-title">
      <h2 id="artisan-tools-title" className="mb-6 text-2xl sm:text-3xl">Manage your work</h2>
      <ul className="grid gap-4">
        <li><Link to="/artisan/profile" className="flex min-h-16 items-center justify-between gap-4 rounded-panel border border-line bg-surface px-5 py-4 text-ink no-underline transition-colors hover:border-accent/40 hover:bg-surface-muted"><span className="min-w-0 font-medium">Manage profile and services</span><ArrowRight size={18} className="shrink-0 text-accent" aria-hidden="true" /></Link></li>
        <li><Link to="/artisan/media" className="flex min-h-16 items-center justify-between gap-4 rounded-panel border border-line bg-surface px-5 py-4 text-ink no-underline transition-colors hover:border-accent/40 hover:bg-surface-muted"><span className="min-w-0 font-medium">Manage portfolio and credentials</span><ArrowRight size={18} className="shrink-0 text-accent" aria-hidden="true" /></Link></li>
        <li><Link to="/artisan/requests" className="flex min-h-16 items-center justify-between gap-4 rounded-panel border border-line bg-surface px-5 py-4 text-ink no-underline transition-colors hover:border-accent/40 hover:bg-surface-muted"><span className="min-w-0 font-medium">Manage incoming requests</span><ArrowRight size={18} className="shrink-0 text-accent" aria-hidden="true" /></Link></li>
      </ul>
    </section>
  </div>
}
