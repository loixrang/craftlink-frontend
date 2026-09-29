import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ClipboardList, MapPin, Wrench } from 'lucide-react'
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
      <p className="mb-3 text-sm font-semibold text-accent-hover">Your work, at a glance</p>
      <h1 className="text-3xl tracking-tight sm:text-4xl">Artisan dashboard</h1>
      <p className="mt-4 max-w-xl text-ink-muted">See how your business is represented on Craftlink.</p>
    </header>
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <section aria-labelledby="artisan-profile-title" className="min-w-0 rounded-panel border border-line bg-surface p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="artisan-profile-title" className="text-2xl tracking-tight">Profile overview</h2>
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
          <dl className="grid gap-5 border-y border-line py-5 sm:grid-cols-2">
            <div className="min-w-0"><dt className="flex items-center gap-2 text-sm text-ink-muted"><MapPin size={16} aria-hidden="true" />Location</dt><dd className="mt-2 break-words">{[data.city, data.state].filter(value => value?.trim()).join(', ') || 'Location not added yet'}</dd></div>
            <div><dt className="text-sm text-ink-muted">Experience</dt><dd className="mt-2">{data.yearsExperience} {data.yearsExperience === 1 ? 'year' : 'years'}</dd></div>
          </dl>
          <Link to={`/artisans/${data.id}`} className="inline-flex min-h-11 items-center gap-2">View public profile<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>}
      </section>
      <aside aria-labelledby="artisan-account-title" className="min-w-0 border-l-2 border-line py-2 pl-6">
        <h2 id="artisan-account-title" className="text-lg">Your account</h2>
        <dl className="mt-5 space-y-4">
          <div><dt className="text-sm text-ink-muted">Signed in as</dt><dd className="mt-1 break-all font-medium">{session?.user.email}</dd></div>
          <div><dt className="text-sm text-ink-muted">Account type</dt><dd className="mt-2"><Badge>Artisan</Badge></dd></div>
        </dl>
        <p className="mt-6 text-sm text-ink-muted">Use the navigation menu to sign out when you have finished.</p>
      </aside>
    </div>
    <section aria-labelledby="artisan-tools-title"><Link to="/artisan/profile" className="mb-6 inline-flex min-h-11 items-center gap-2">Manage profile and services<ArrowRight size={18} aria-hidden="true" /></Link>
      <h2 id="artisan-tools-title" className="text-2xl tracking-tight">Your workspace is growing</h2>
      <p className="mt-3 text-ink-muted">These tools are coming soon.</p>
      <ul className="mt-6 grid gap-8 sm:grid-cols-3">
        {[
          { title: 'Portfolio and credentials', description: 'Manage portfolio images and credentials.', Icon: Wrench },
          { title: 'Incoming requests', description: 'Review customer requests and manage their progress.', Icon: ClipboardList },
        ].map(({ title, description, Icon }) => <li key={title} className="border-t border-line pt-5"><Icon size={22} className="mb-4 text-accent" aria-hidden="true" /><h3 className="text-lg">{title}</h3><p className="mt-2 text-sm text-ink-muted">{description}</p></li>)}
      </ul>
    </section>
  </div>
}
