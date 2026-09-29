import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { LocateFixed } from 'lucide-react'
import { useAuth } from '../app/authContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorState, LoadingState, SuccessState } from '../components/ui/Feedback'
import { getEditableProfile, managementError, profileDefaults, profileFormSchema, saveProfile, type OwnerProfile, type ProfileValues } from '../services/artisanManagement'
import { ArtisanServices } from './ArtisanServices'

export function ArtisanManagementPage() {
  const { session } = useAuth()
  const profile = useQuery({ queryKey: ['editable-artisan-profile', session?.user.id], queryFn: ({ signal }) => getEditableProfile(session!.accessToken, signal), enabled: !!session })
  return <div className="space-y-8">
    <header><Link to="/artisan">Back to dashboard</Link><h1 className="mt-5 text-3xl sm:text-4xl">Manage your business</h1><p className="mt-3 text-ink-muted">Keep your profile, location and services up to date.</p></header>
    {profile.isPending && <LoadingState label="Loading profile settings..." />}
    {profile.isError && <ErrorState title="Settings unavailable" description={managementError(profile.error)} onRetry={() => { void profile.refetch() }} />}
    {profile.isSuccess && <ProfileEditor key={session!.user.id} profile={profile.data} />}
    {profile.isSuccess && profile.data && <ArtisanServices artisanId={profile.data.id} />}
  </div>
}
function ProfileEditor({ profile }: { profile: OwnerProfile | null }) {
  const { session } = useAuth()
  const client = useQueryClient()
  const lock = useRef(false)
  const active = useRef(true)
  const locationRequest = useRef(0)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  useEffect(() => { active.current = true; return () => { active.current = false; locationRequest.current += 1 } }, [])
  const { register, handleSubmit, getValues, setValue, reset, formState: { errors } } = useForm<ProfileValues>({ resolver: zodResolver(profileFormSchema), defaultValues: profileDefaults(profile) })
  function cancelLocation() { locationRequest.current += 1; setLocating(false) }
  function locate() {
    if (!window.isSecureContext || !navigator.geolocation) { setLocationMessage('Browser location is unavailable. Enter your city/state and optional coordinates manually.'); return }
    const request = ++locationRequest.current
    setLocating(true)
    setLocationMessage('Waiting for browser location...')
    const fail = (message: string) => { if (request !== locationRequest.current) return; cancelLocation(); setLocationMessage(message + ' Manual location is still available.') }
    try { navigator.geolocation.getCurrentPosition(position => {
      if (request !== locationRequest.current) return
      const { latitude, longitude } = position.coords
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) { fail('Your browser returned an invalid location.'); return }
      cancelLocation()
      setValue('latitude', String(latitude), { shouldDirty: true, shouldValidate: true })
      setValue('longitude', String(longitude), { shouldDirty: true, shouldValidate: true })
      setLocationMessage('Coordinates filled in. Review them and save your profile to apply.')
    }, error => fail(error.code === 1 ? 'Location permission was denied.' : error.code === 3 ? 'Finding your location timed out.' : 'Your location could not be determined.'), { timeout: 10000, maximumAge: 0, enableHighAccuracy: false }) }
    catch { fail('Your browser could not request location.') }
  }
  const mutation = useMutation({ mutationFn: () => saveProfile(getValues(), session!.accessToken), retry: false, gcTime: 0 })
  return <section aria-labelledby="profile-edit-heading" className="max-w-3xl">
    <h2 id="profile-edit-heading" className="text-2xl">{profile ? 'Business profile' : 'Set up your profile'}</h2>
    <form aria-label="Business profile" noValidate className="mt-6 space-y-6" onChange={() => { cancelLocation(); mutation.reset() }} onSubmit={event => { cancelLocation(); void handleSubmit(async () => {
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
      } catch { /* Preserve draft. */ } finally { lock.current = false }
    })(event) }}>
      {mutation.isError && <ErrorState title="Profile save not confirmed" description={managementError(mutation.error)} />}
      {mutation.isSuccess && <SuccessState title="Profile saved" description="Your business details are up to date." />}
      <fieldset disabled={mutation.isPending} className="space-y-6">
        <Input label="Business name" {...register('displayName')} error={errors.displayName?.message} required />
        <div><label htmlFor="profile-bio" className="block text-sm font-semibold">Introduction</label><textarea id="profile-bio" {...register('bio')} rows={4} aria-invalid={!!errors.bio} aria-describedby={errors.bio ? 'bio-error' : undefined} className="mt-2 w-full rounded-control border border-control-border bg-surface p-3" />{errors.bio && <p id="bio-error">{errors.bio.message}</p>}</div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Years of experience" type="number" min="0" max="100" {...register('yearsExperience', { valueAsNumber: true })} error={errors.yearsExperience?.message} />
          <Input label="Profile image URL" type="url" {...register('profileImageUrl')} hint="Optional HTTPS image URL. Uploads are coming later." error={errors.profileImageUrl?.message} />
          <Input label="Phone" type="tel" {...register('phone')} error={errors.phone?.message} />
          <Input label="WhatsApp" type="tel" {...register('whatsapp')} error={errors.whatsapp?.message} />
        </div>
        <p className="text-sm text-ink-muted">Phone and WhatsApp are public contact methods. Leave them empty to remove them.</p>
        <h3 className="border-t border-line pt-6 text-xl">Location and availability</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="City" {...register('city')} required error={errors.city?.message} />
          <Input label="State" {...register('state')} required error={errors.state?.message} />
        </div>
        <p className="text-sm text-ink-muted">City and state are public. Optional coordinates help customers find you nearby and are sent to Craftlink only when you save. They are not added to the page URL.</p>
        <div className="flex flex-wrap gap-3"><Button variant="secondary" pending={locating} onClick={locate}><LocateFixed size={18} aria-hidden="true" />Use my location</Button>{locating && <Button onClick={() => { cancelLocation(); setLocationMessage('Location request cancelled.') }}>Cancel location request</Button>}<Button variant="quiet" onClick={() => { cancelLocation(); setValue('latitude', '', { shouldDirty: true, shouldValidate: true }); setValue('longitude', '', { shouldDirty: true, shouldValidate: true }); setLocationMessage('Coordinates cleared. Save to apply.'); mutation.reset() }}>Clear coordinates</Button></div>
        <p role="status" className="text-sm text-ink-muted">{locationMessage}</p>
        <div className="grid gap-5 sm:grid-cols-2"><Input label="Latitude" inputMode="decimal" {...register('latitude')} error={errors.latitude?.message} /><Input label="Longitude" inputMode="decimal" {...register('longitude')} error={errors.longitude?.message} /></div>
        <label className="flex min-h-11 items-center gap-3"><input type="checkbox" {...register('isAvailable')} className="size-5" />Available for work</label>
        {Object.keys(errors).length > 0 && <p role="alert">Check the highlighted profile fields.</p>}
        <Button type="submit" pending={mutation.isPending}>{mutation.isPending ? 'Saving profile...' : 'Save profile'}</Button>
      </fieldset>
    </form>
  </section>
}
