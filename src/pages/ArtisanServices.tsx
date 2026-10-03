import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../app/authContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../components/ui/Feedback'
import { CURRENCY_SYMBOL, formatCurrency } from '../constants/currency'
import { getArtisanProfile } from '../services/artisanProfile'
import { getCategories } from '../services/categories'
import { deleteService, managementError, saveService, serviceFormSchema, type ServiceValues } from '../services/artisanManagement'

type Service = Awaited<ReturnType<typeof getArtisanProfile>>['services'][number]
export function ArtisanServices({ artisanId }: { artisanId: string }) {
  const { session } = useAuth()
  const client = useQueryClient()
  const profile = useQuery({ queryKey: ['artisan-profile', artisanId], queryFn: ({ signal }) => getArtisanProfile(artisanId, signal) })
  const categories = useQuery({ queryKey: ['categories'], queryFn: ({ signal }) => getCategories(signal) })
  const [editing, setEditing] = useState<Service | 'new' | null>(null)
  const [removing, setRemoving] = useState<Service | null>(null)
  const [notice, setNotice] = useState('')
  const lock = useRef(false)
  async function changed() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['artisan-profile', artisanId] }),
      client.invalidateQueries({ queryKey: ['artisans'] }),
    ])
  }
  const removal = useMutation({ mutationFn: () => deleteService(removing!.id, session!.accessToken), retry: false, gcTime: 0 })
  const busy = removal.isPending || profile.isFetching
  return <section aria-labelledby="services-edit-heading" className="space-y-6 border-t border-line pt-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="services-edit-heading" className="text-2xl">Your services</h2><Button variant="secondary" pending={profile.isFetching} disabled={!!editing || !!removing} onClick={() => { void profile.refetch() }}>Refresh services</Button></div>
    <p className="max-w-2xl text-ink-muted">Describe what you offer. Starting prices are in Nigerian Naira ({CURRENCY_SYMBOL}) and are informational; confirm the final quote with customers.</p>
    {notice && <SuccessState title={notice} description="Your service list has been refreshed." />}
    {profile.isPending && <LoadingState label="Loading your services..." />}
    {profile.isError && <ErrorState title="Services unavailable" description="We could not load your services. Retry before making changes." onRetry={() => { void profile.refetch() }} />}
    {profile.isSuccess && <>
      {profile.data.services.length === 0 && <EmptyState title="No services yet" description="Add your first service so customers know what they can request." />}
      <ul className="grid gap-4">{profile.data.services.map(service => <li key={service.id} className="rounded-panel border border-line bg-surface p-5 shadow-card sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h3 className="break-words text-lg">{service.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-ink-muted">{service.description}</p><p className="mt-2 text-sm">{service.priceFrom == null ? 'Price on enquiry' : `Starting price: ${formatCurrency(service.priceFrom)}`}</p></div><div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={busy || !!editing || !!removing} onClick={() => { setEditing(service); setNotice('') }} aria-label={`Edit ${service.title}`}>Edit</Button><Button variant="quiet" disabled={busy || !!editing || !!removing} onClick={() => { setRemoving(service); removal.reset(); setNotice('') }} aria-label={`Delete ${service.title}`}>Delete</Button></div></div></li>)}</ul>
      {removing && <div className="space-y-4 rounded-panel border border-line bg-surface p-5" role="group" aria-label="Confirm service deletion"><p>Delete “{removing.title}”? This removes it from your public profile.</p>{removal.isError && <ErrorState title="Deletion not confirmed" description={managementError(removal.error)} />}<div className="flex flex-wrap gap-3"><Button pending={removal.isPending} onClick={async () => {
        if (lock.current) return
        lock.current = true
        try { await removal.mutateAsync(); setRemoving(null); await changed(); setNotice('Service deleted') } catch { /* Keep confirmation available. */ } finally { lock.current = false }
      }}>Confirm delete</Button><Button variant="secondary" disabled={removal.isPending} onClick={() => setRemoving(null)}>Cancel deletion</Button></div></div>}
      {!editing && <Button disabled={busy || !!removing} onClick={() => { setEditing('new'); setNotice('') }}>Add service</Button>}
      {editing && <>
        {categories.isPending && <LoadingState label="Loading service categories..." />}
        {categories.isError && <ErrorState title="Categories unavailable" description="Load categories before saving a service." onRetry={() => { void categories.refetch() }} />}
        {categories.isSuccess && categories.data.length === 0 && <EmptyState title="No categories available" description="Services need a category. Please try again later." />}
        {categories.isSuccess && categories.data.length > 0 && <ServiceEditor key={editing === 'new' ? 'new' : editing.id} service={editing === 'new' ? undefined : editing} categories={categories.data} onCancel={() => setEditing(null)} onSaved={async () => { setEditing(null); await changed(); setNotice('Service saved') }} />}
        {(!categories.isSuccess || categories.data.length === 0) && <Button variant="quiet" onClick={() => setEditing(null)}>Cancel service editing</Button>}
      </>}
    </>}
  </section>
}
function ServiceEditor({ service, categories, onCancel, onSaved }: { service?: Service; categories: { id: string; name: string }[]; onCancel: () => void; onSaved: () => Promise<void> }) {
  const { session } = useAuth()
  const lock = useRef(false)
  const { register, handleSubmit, getValues, setError, formState: { errors } } = useForm<ServiceValues>({ resolver: zodResolver(serviceFormSchema), defaultValues: { categoryId: service?.categoryId ?? '', title: service?.title ?? '', description: service?.description ?? '', priceFrom: service?.priceFrom?.toString() ?? '' } })
  const mutation = useMutation({ mutationFn: () => saveService(getValues(), session!.accessToken, service?.id), retry: false, gcTime: 0 })
  return <form aria-label={service ? 'Edit service' : 'New service'} noValidate className="max-w-3xl space-y-5 rounded-panel border border-line bg-surface p-5 shadow-card sm:p-6" onSubmit={event => { void handleSubmit(async values => {
    if (lock.current) return
    if (!categories.some(category => category.id === values.categoryId)) { setError('categoryId', { message: 'Choose an available category.' }); return }
    lock.current = true
    try { await mutation.mutateAsync(); await onSaved() } catch { /* Preserve inputs. */ } finally { lock.current = false }
  })(event) }}>
    <h3 className="text-xl">{service ? 'Edit service' : 'New service'}</h3>
    {mutation.isError && <ErrorState title="Service save not confirmed" description={managementError(mutation.error)} />}
    <fieldset disabled={mutation.isPending} className="space-y-5">
      <div><label htmlFor="service-category" className="block text-sm font-semibold">Category</label><select id="service-category" {...register('categoryId')} required aria-invalid={!!errors.categoryId} aria-describedby={errors.categoryId ? 'category-error' : undefined} className="mt-2 min-h-12 w-full min-w-0 rounded-control border border-control-border bg-surface px-3 transition-colors focus:border-accent aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted"><option value="">Choose a category</option>{service && !categories.some(c => c.id === service.categoryId) && <option value={service.categoryId} disabled>Previous category unavailable; choose another</option>}{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{errors.categoryId && <p id="category-error" className="mt-1 text-sm font-medium text-danger">{errors.categoryId.message}</p>}</div>
      <Input label="Service title" {...register('title')} required error={errors.title?.message} />
      <div><label htmlFor="service-description" className="block text-sm font-semibold">Service description</label><textarea id="service-description" {...register('description')} rows={4} required aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-error' : undefined} className="mt-2 w-full min-w-0 rounded-control border border-control-border bg-surface p-3 transition-colors focus:border-accent aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted" />{errors.description && <p id="description-error" className="mt-1 text-sm font-medium text-danger">{errors.description.message}</p>}</div>
      <Input label={`Starting price (${CURRENCY_SYMBOL})`} inputMode="decimal" {...register('priceFrom')} hint="Optional; enter the amount in Nigerian Naira. Leave empty for price on enquiry." error={errors.priceFrom?.message} />
      {Object.keys(errors).length > 0 && <p role="alert" className="text-sm font-medium text-danger">Check the highlighted service fields.</p>}
      <div className="flex flex-wrap gap-3"><Button type="submit" pending={mutation.isPending}>Save service</Button><Button variant="secondary" onClick={onCancel}>Cancel service editing</Button></div>
    </fieldset>
  </form>
}
