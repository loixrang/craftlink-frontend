import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorState, LoadingState, SuccessState } from '../components/ui/Feedback'
import { DEFAULT_STATE, getLgasForState, SUPPORTED_STATES } from '../constants/locations'
import {
  getEditableProfile,
  managementError,
  profileDefaults,
  profileFormSchema,
  saveProfile,
  type OwnerProfile,
  type ProfileValues,
} from '../services/artisanManagement'
import { ArtisanServices } from './ArtisanServices'

export function ArtisanManagementPage() {
  const { session } = useAuth()
  const profile = useQuery({
    queryKey: ['editable-artisan-profile', session?.user.id],
    queryFn: ({ signal }) => getEditableProfile(session!.accessToken, signal),
    enabled: !!session,
  })

  return (
    <div className="space-y-8">
      <header>
        <Link to="/artisan">Back to dashboard</Link>
        <h1 className="mt-5 text-3xl sm:text-4xl">Manage your business</h1>
        <p className="mt-3 text-ink-muted">Keep your profile, location and services up to date.</p>
      </header>
      {profile.isPending && <LoadingState label="Loading profile settings..." />}
      {profile.isError && (
        <ErrorState
          title="Settings unavailable"
          description={managementError(profile.error)}
          onRetry={() => {
            void profile.refetch()
          }}
        />
      )}
      {profile.isSuccess && <ProfileEditor key={session!.user.id} profile={profile.data} />}
      {profile.isSuccess && profile.data && <ArtisanServices artisanId={profile.data.id} />}
    </div>
  )
}

function ProfileEditor({ profile }: { profile: OwnerProfile | null }) {
  const { session } = useAuth()
  const client = useQueryClient()
  const lock = useRef(false)
  const active = useRef(true)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profileDefaults(profile),
  })

  const selectedState = useWatch({ control, name: 'state' }) || DEFAULT_STATE
  const availableLgas = getLgasForState(selectedState)

  const mutation = useMutation({
    mutationFn: () => saveProfile(getValues(), session!.accessToken),
    retry: false,
    gcTime: 0,
  })

  return (
    <section aria-labelledby="profile-edit-heading" className="max-w-3xl">
      <h2 id="profile-edit-heading" className="text-2xl">
        {profile ? 'Business profile' : 'Set up your profile'}
      </h2>
      <form
        aria-label="Business profile"
        noValidate
        className="mt-6 space-y-6"
        onChange={() => {
          mutation.reset()
        }}
        onSubmit={event => {
          void handleSubmit(async () => {
            if (lock.current) return
            lock.current = true
            try {
              const saved = await mutation.mutateAsync()
              if (!active.current) return
              reset(profileDefaults(saved))
              client.setQueryData(['editable-artisan-profile', session!.user.id], saved)
              void client.invalidateQueries({ queryKey: ['own-artisan-profile', session!.user.id] })
              void client.invalidateQueries({ queryKey: ['artisan-profile', saved.id] })
              void client.invalidateQueries({ queryKey: ['artisans'] })
            } catch {
              /* Preserve draft. */
            } finally {
              lock.current = false
            }
          })(event)
        }}
      >
        {mutation.isError && <ErrorState title="Profile save not confirmed" description={managementError(mutation.error)} />}
        {mutation.isSuccess && <SuccessState title="Profile saved" description="Your business details are up to date." />}
        <fieldset disabled={mutation.isPending} className="space-y-6">
          <Input label="Business name" {...register('displayName')} error={errors.displayName?.message} required />
          <div>
            <label htmlFor="profile-bio" className="block text-sm font-semibold">
              Introduction
            </label>
            <textarea
              id="profile-bio"
              {...register('bio')}
              rows={4}
              aria-invalid={!!errors.bio}
              aria-describedby={errors.bio ? 'bio-error' : undefined}
              className="mt-2 w-full rounded-control border border-control-border bg-surface p-3"
            />
            {errors.bio && <p id="bio-error" className="mt-1 text-sm text-ink-muted">{errors.bio.message}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Years of experience"
              type="number"
              min="0"
              max="100"
              {...register('yearsExperience', { valueAsNumber: true })}
              error={errors.yearsExperience?.message}
            />
            <Input
              label="Profile image URL"
              type="url"
              {...register('profileImageUrl')}
              hint="Optional HTTPS image URL. Uploads are coming later."
              error={errors.profileImageUrl?.message}
            />
            <Input label="Phone" type="tel" {...register('phone')} error={errors.phone?.message} />
            <Input label="WhatsApp" type="tel" {...register('whatsapp')} error={errors.whatsapp?.message} />
          </div>
          <p className="text-sm text-ink-muted">Phone and WhatsApp are public contact methods. Leave them empty to remove them.</p>

          <h3 className="border-t border-line pt-6 text-xl">Location and availability</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <label htmlFor="profile-state-select" className="grid gap-2 text-sm font-semibold">
              State
              <select
                id="profile-state-select"
                {...register('state')}
                disabled
                className="min-h-11 rounded-control border border-control-border bg-surface-muted px-3 py-2 text-ink-muted opacity-75 cursor-not-allowed"
              >
                {SUPPORTED_STATES.map(s => (
                  <option key={s} value={s}>
                    {s} (Currently supported)
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="profile-lga-select" className="grid gap-2 text-sm font-semibold">
              City / LGA
              <select
                id="profile-lga-select"
                {...register('city')}
                aria-invalid={!!errors.city}
                aria-describedby={errors.city ? 'profile-city-error' : undefined}
                className="min-h-11 rounded-control border border-control-border bg-surface px-3 py-2"
              >
                <option value="">Select city / LGA</option>
                {availableLgas.map(lga => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p id="profile-city-error" className="text-sm">
                  {errors.city.message}
                </p>
              )}
            </label>
          </div>

          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" {...register('isAvailable')} className="size-5" />
            Available for work
          </label>
          {Object.keys(errors).length > 0 && <p role="alert">Check the highlighted profile fields.</p>}
          <Button type="submit" pending={mutation.isPending}>
            {mutation.isPending ? 'Saving profile...' : 'Save profile'}
          </Button>
        </fieldset>
      </form>
    </section>
  )
}
