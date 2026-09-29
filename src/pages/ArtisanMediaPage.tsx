import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../components/ui/Feedback'
import { getOwnArtisanProfile } from '../services/ownArtisanProfile'
import { getArtisanProfile, publicImageUrl } from '../services/artisanProfile'
import { deleteMedia, fileError, getCredentials, mediaError, mediaFormSchema, uploadMedia, type MediaKind, type MediaValues } from '../services/artisanMedia'

export function ArtisanMediaPage() {
  const { session } = useAuth()
  const owner = useQuery({ queryKey: ['own-artisan-profile', session?.user.id], queryFn: ({ signal }) => getOwnArtisanProfile(session!.accessToken, signal), enabled: !!session })
  return <div className="space-y-10">
    <header><Link to="/artisan">Back to dashboard</Link><h1 className="mt-5 text-3xl sm:text-4xl">Portfolio and credentials</h1><p className="mt-3 max-w-2xl text-ink-muted">Show customers your work and share your qualifications for verification.</p></header>
    {owner.isPending && <LoadingState label="Loading your profile..." />}
    {owner.isError && <ErrorState title="Profile unavailable" description={mediaError(owner.error)} onRetry={() => { void owner.refetch() }} />}
    {owner.isSuccess && (owner.data ? <div className="space-y-12"><MediaSection kind="portfolio" artisanId={owner.data.id} /><MediaSection kind="credentials" artisanId={owner.data.id} /></div> : <EmptyState title="Set up your profile first" description="Add your business details before uploading work or credentials."><Link to="/artisan/profile">Manage profile</Link></EmptyState>)}
  </div>
}

function MediaSection({ kind, artisanId }: { kind: MediaKind; artisanId: string }) {
  const { session } = useAuth()
  const client = useQueryClient()
  const isPortfolio = kind === 'portfolio'
  const queryKey = isPortfolio ? ['artisan-portfolio', artisanId] : ['artisan-credentials', session?.user.id]
  // Keep the portfolio list separate from the shared full public profile cache.
  const list = useQuery({ queryKey, queryFn: async ({ signal }) => isPortfolio ? (await getArtisanProfile(artisanId, signal)).portfolio : getCredentials(session!.accessToken, signal) })
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState<{ id: string; title: string } | null>(null)
  const [notice, setNotice] = useState('')
  const lock = useRef(false)
  const removal = useMutation({ mutationFn: () => deleteMedia(kind, removing!.id, session!.accessToken), retry: false, gcTime: 0 })
  async function changed() {
    await Promise.all([client.invalidateQueries({ queryKey }), client.invalidateQueries({ queryKey: ['artisan-profile', artisanId] })])
  }
  return <section aria-labelledby={`${kind}-heading`} className="space-y-5 border-t border-line pt-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id={`${kind}-heading`} className="text-2xl">{isPortfolio ? 'Your portfolio' : 'Your credentials'}</h2><Button variant="secondary" pending={list.isFetching} disabled={editing || !!removing} onClick={() => { void list.refetch() }}>Refresh {kind}</Button></div>
    <p className="max-w-2xl text-ink-muted">{isPortfolio ? 'Portfolio images and descriptions appear on your public profile.' : 'Credential images are private. The title, issuer, issue date and verification status appear on your public profile. Pending means awaiting review; verified applies only to that credential.'}</p>
    {notice && <SuccessState title={notice} />}
    {list.isPending && <LoadingState label={`Loading ${kind}...`} />}
    {list.isError && <ErrorState title={`${isPortfolio ? 'Portfolio' : 'Credentials'} unavailable`} description={mediaError(list.error)} onRetry={() => { void list.refetch() }} />}
    {list.isSuccess && <>
      {list.data.length === 0 && <EmptyState title={`No ${kind} yet`} description={isPortfolio ? 'Add a photo of a completed project.' : 'Upload an image of your qualification to submit it for verification.'} />}
      <ul className={isPortfolio ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'divide-y divide-line'}>{list.data.map(item => <li key={item.id} className="min-w-0 space-y-3 py-4">
        {'imageUrl' in item && <PortfolioImage url={item.imageUrl} title={item.title} />}
        <h3 className="break-words text-lg">{item.title}</h3>
        {'description' in item && item.description && <p className="whitespace-pre-wrap break-words text-ink-muted">{item.description}</p>}
        {'issuer' in item && <><p className="break-words text-ink-muted">{item.issuer}{item.issuedAt ? ` · Issued ${item.issuedAt.slice(0, 10)}` : ''}</p><Badge>{item.verificationStatus === 'PENDING' ? 'Pending verification' : item.verificationStatus === 'VERIFIED' ? 'Verified' : 'Rejected'}</Badge>{item.verificationStatus === 'REJECTED' && <p className="text-sm text-ink-muted">This credential was not verified. You can delete it and submit a corrected image.</p>}</>}
        <div><Button variant="quiet" disabled={editing || !!removing || list.isFetching} aria-label={`Delete ${item.title}`} onClick={() => { setRemoving(item); removal.reset(); setNotice('') }}>Delete</Button></div>
      </li>)}</ul>
      {removing && <div role="group" aria-label={`Confirm ${kind} deletion`} className="space-y-4 rounded-panel border border-line p-5"><p>Delete “{removing.title}”? This cannot be undone.{isPortfolio && ' A previously shared image URL may remain accessible briefly.'}</p>
        {removal.isError && <ErrorState title="Deletion not confirmed" description={mediaError(removal.error)} />}
        <div className="flex flex-wrap gap-3"><Button pending={removal.isPending} onClick={async () => { if (lock.current) return; lock.current = true; try { await removal.mutateAsync(); setRemoving(null); setNotice('Item deleted'); await changed() } catch { /* Keep confirmation for recovery. */ } finally { lock.current = false } }}>Confirm delete</Button><Button variant="secondary" disabled={removal.isPending} onClick={() => setRemoving(null)}>Cancel deletion</Button></div>
      </div>}
      {!editing && <Button disabled={!!removing || list.isFetching} onClick={() => { setEditing(true); setNotice('') }}>{isPortfolio ? 'Add portfolio image' : 'Add credential'}</Button>}
    </>}
    {editing && <UploadForm kind={kind} onCancel={() => setEditing(false)} onSaved={async () => { setEditing(false); setNotice('Upload complete'); await changed() }} />}
  </section>
}

function PortfolioImage({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false)
  const safe = publicImageUrl(url)
  return safe && !failed ? <img src={safe} alt={title} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="aspect-[4/3] w-full rounded-control object-cover" /> : <p className="bg-surface-muted p-6 text-sm">Image unavailable</p>
}

function UploadForm({ kind, onCancel, onSaved }: { kind: MediaKind; onCancel: () => void; onSaved: () => Promise<void> }) {
  const { session } = useAuth()
  const [file, setFile] = useState<File>()
  const [fileIssue, setFileIssue] = useState<string>()
  const lock = useRef(false)
  const { register, handleSubmit, setError, formState: { errors } } = useForm<MediaValues>({ resolver: zodResolver(mediaFormSchema), defaultValues: { title: '', description: '', issuer: '', issuedAt: '' } })
  const upload = useMutation({ mutationFn: (values: MediaValues) => uploadMedia(kind, values, file!, session!.accessToken), retry: false, gcTime: 0 })
  return <form aria-label={`Upload ${kind}`} noValidate className="max-w-2xl space-y-5 rounded-panel border border-line bg-surface p-5 sm:p-6" onSubmit={event => { void handleSubmit(async values => {
    if (lock.current) return
    const issue = fileError(file); setFileIssue(issue)
    if (kind === 'credentials' && !values.issuer.trim()) { setError('issuer', { message: 'Enter the issuer.' }); return }
    if (issue) return
    lock.current = true
    try { await upload.mutateAsync(values); await onSaved() } catch { /* Preserve draft and file for correction. */ } finally { lock.current = false }
  })(event) }}>
    <h3 className="text-xl">{kind === 'portfolio' ? 'Add portfolio image' : 'Add credential'}</h3>
    {upload.isError && <ErrorState title="Upload not confirmed" description={mediaError(upload.error)} />}
    <fieldset disabled={upload.isPending} className="space-y-5">
      <Input label="Title" required maxLength={100} {...register('title')} error={errors.title?.message} />
      {kind === 'portfolio' ? <Input label="Description" maxLength={2000} {...register('description')} error={errors.description?.message} /> : <><Input label="Issuer" required maxLength={100} {...register('issuer')} error={errors.issuer?.message} /><Input label="Issue date" type="date" {...register('issuedAt')} error={errors.issuedAt?.message} /></>}
      <Input label={kind === 'portfolio' ? 'Portfolio image' : 'Credential image'} type="file" required accept="image/jpeg,image/png,image/webp" hint="Static JPEG, PNG or WebP. Maximum 5 MiB and 25 million pixels. PDFs are not supported; use a clear photo of your document." error={fileIssue} onChange={event => { const next = event.target.files?.[0]; setFile(next); setFileIssue(fileError(next)) }} />
      {(fileIssue || Object.keys(errors).length > 0) && <p role="alert">Check the highlighted upload fields.</p>}
      <div className="flex flex-wrap gap-3"><Button type="submit" pending={upload.isPending}>{upload.isPending ? 'Uploading...' : 'Upload image'}</Button><Button variant="secondary" onClick={onCancel}>Cancel upload</Button></div>
    </fieldset>
  </form>
}
