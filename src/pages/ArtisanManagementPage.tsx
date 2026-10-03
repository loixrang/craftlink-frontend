import { useEffect, useRef, useState } from 'react'
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
  profileImageFileError,
  removeProfileImage,
  saveProfile,
  uploadProfileImage,
  type OwnerProfile,
  type ProfileValues,
} from '../services/artisanManagement'
import { publicImageUrl } from '../services/artisanProfile'
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
        <Link to="/artisan" className="inline-flex min-h-11 items-center">Back to dashboard</Link>
        <h1 className="mt-5 text-3xl sm:text-headline">Manage your business</h1>
        <p className="mt-4 max-w-2xl text-ink-muted">Keep your profile, location and services up to date.</p>
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
  const [imageFile, setImageFile] = useState<File>()
  const [imageIssue, setImageIssue] = useState<string>()
  const [previewUrl, setPreviewUrl] = useState<string>()
  const previewObjectUrl = useRef<string | undefined>(undefined)

  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])

  useEffect(() => () => {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current)
  }, [])

  const selectImage = (file: File | undefined) => {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current)
    previewObjectUrl.current = file ? URL.createObjectURL(file) : undefined
    setPreviewUrl(previewObjectUrl.current)
    setImageFile(file)
    setImageIssue(file ? profileImageFileError(file) : undefined)
  }

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
    mutationFn: () => saveProfile(getValues(), session!.accessToken, profile?.profileImageUrl ?? null),
    retry: false,
    gcTime: 0,
  })
  const refreshProfile = async () => {
    await client.invalidateQueries({ queryKey: ['editable-artisan-profile', session!.user.id] })
    await client.refetchQueries({ queryKey: ['editable-artisan-profile', session!.user.id], type: 'active' })
    await Promise.all([
      client.invalidateQueries({ queryKey: ['own-artisan-profile', session!.user.id] }),
      client.invalidateQueries({ queryKey: ['artisan-profile', profile?.id] }),
      client.invalidateQueries({ queryKey: ['artisans'] }),
    ])
  }
  const imageUpload = useMutation({ mutationFn: (file: File) => uploadProfileImage(file, session!.accessToken), retry: false, gcTime: 0 })
  const imageRemoval = useMutation({ mutationFn: () => removeProfileImage(session!.accessToken), retry: false, gcTime: 0 })
  const applySaved = (saved: OwnerProfile) => {
    reset(profileDefaults(saved))
    client.setQueryData(['editable-artisan-profile', session!.user.id], saved)
    void client.invalidateQueries({ queryKey: ['editable-artisan-profile', session!.user.id] })
    void client.invalidateQueries({ queryKey: ['own-artisan-profile', session!.user.id] })
    void client.invalidateQueries({ queryKey: ['artisan-profile', saved.id] })
    void client.invalidateQueries({ queryKey: ['artisans'] })
  }

  return (
    <section aria-labelledby="profile-edit-heading" className="max-w-3xl rounded-modal border border-line bg-surface p-5 shadow-card sm:p-8">
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
            mutation.reset()
            imageUpload.reset()
            if (imageFile) {
              const issue = profileImageFileError(imageFile)
              setImageIssue(issue)
              if (issue) return
            }
            lock.current = true
            try {
              const saved = await mutation.mutateAsync()
              if (!active.current) return
              let imageUrl = saved.profileImageUrl
              if (imageFile) {
                try {
                  imageUrl = await imageUpload.mutateAsync(imageFile)
                } catch {
                  if (!active.current) return
                  applySaved(saved)
                  return
                }
              }
              if (!active.current) return
              selectImage(undefined)
              applySaved({ ...saved, profileImageUrl: imageUrl })
            } catch {
              /* Preserve draft. */
            } finally {
              lock.current = false
            }
          })(event)
        }}
      >
        {mutation.isError && <ErrorState title="Profile save not confirmed" description={managementError(mutation.error)} />}
        {mutation.isSuccess && !imageUpload.isError && <SuccessState title="Profile saved" description={imageUpload.isSuccess ? 'Your business details and profile photo are up to date.' : 'Your business details are up to date.'} />}
        {imageUpload.isError && mutation.isSuccess && <ErrorState title="Profile saved, but the photo could not be uploaded" description={managementError(imageUpload.error)} />}
        {imageRemoval.isError && <ErrorState title="Photo change not confirmed" description={managementError(imageRemoval.error)} />}
        {imageRemoval.isSuccess && <SuccessState title="Profile photo removed" />}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Profile photo</h3>
          <div className="flex flex-wrap items-center gap-5">
            {previewUrl || publicImageUrl(profile?.profileImageUrl ?? null)
              ? <img src={previewUrl ?? publicImageUrl(profile?.profileImageUrl ?? null)} alt={previewUrl ? 'Selected profile photo preview' : `${profile?.displayName ?? 'Your'} profile photo`} className="size-24 shrink-0 rounded-panel border border-line object-cover shadow-card" />
              : <div aria-label="No profile photo" className="flex size-24 shrink-0 items-center justify-center rounded-panel border border-line bg-surface-muted text-center text-sm text-ink-muted">No photo</div>}
            <div className="min-w-0 space-y-3">
              <Input label={profile?.profileImageUrl ? 'Change photo' : 'Choose photo'} type="file" accept="image/jpeg,image/png,image/webp" disabled={mutation.isPending || imageUpload.isPending || imageRemoval.isPending} hint="Static JPEG, PNG or WebP. Maximum 5 MiB and 25 million pixels." error={imageIssue} onChange={event => { selectImage(event.target.files?.[0]); imageUpload.reset(); imageRemoval.reset() }} />
              {profile?.profileImageUrl && <Button type="button" variant="secondary" disabled={mutation.isPending || imageUpload.isPending} pending={imageRemoval.isPending} onClick={async () => { try { await imageRemoval.mutateAsync(); selectImage(undefined); await refreshProfile() } catch { /* Keep the existing photo visible until confirmed. */ } }}>{imageRemoval.isPending ? 'Removing photo...' : 'Remove photo'}</Button>}
            </div>
          </div>
        </div>
        <fieldset disabled={mutation.isPending || imageUpload.isPending} className="space-y-6">
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
              className="mt-2 w-full rounded-control border border-control-border bg-surface p-3 transition-colors focus:border-accent aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted"
            />
            {errors.bio && <p id="bio-error" className="mt-1 text-sm font-medium text-danger">{errors.bio.message}</p>}
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
                className="min-h-12 min-w-0 rounded-control border border-control-border bg-surface-muted px-3 py-2 text-ink-muted opacity-75 cursor-not-allowed"
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
                className="min-h-12 min-w-0 rounded-control border border-control-border bg-surface px-3 py-2 transition-colors focus:border-accent aria-invalid:border-danger"
              >
                <option value="">Select city / LGA</option>
                {availableLgas.map(lga => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p id="profile-city-error" className="text-sm font-medium text-danger">
                  {errors.city.message}
                </p>
              )}
            </label>
          </div>

          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" {...register('isAvailable')} className="size-5 rounded-[4px]" />
            Available for work
          </label>
          {Object.keys(errors).length > 0 && <p role="alert" className="text-sm font-medium text-danger">Check the highlighted profile fields.</p>}
          <Button type="submit" pending={mutation.isPending || imageUpload.isPending}>
            {mutation.isPending ? 'Saving profile...' : imageUpload.isPending ? 'Uploading photo...' : 'Save profile'}
          </Button>
        </fieldset>
      </form>
    </section>
  )
}
