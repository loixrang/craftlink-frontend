import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../app/authContext'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorState, LoadingState, SuccessState } from '../components/ui/Feedback'
import { ApiError } from '../services/api'
import { createAdminCategory, deleteAdminCategory, getCategories, renameAdminCategory, type Category } from '../services/categories'

const nameSchema = z.object({ name: z.string().trim().min(1, 'Enter a category name.').max(100, 'Use 100 characters or fewer.') })
type NameValues = z.infer<typeof nameSchema>

function failure(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.'
    if (error.status === 403) return 'Your account no longer has access to administration.'
    if (error.code === 'CATEGORY_NAME_CONFLICT') return 'A category already uses that name. Choose a different name.'
    if (error.code === 'CATEGORY_IN_USE') return 'This category is used by artisan services and cannot be deleted.'
    if (error.code === 'CATEGORY_NOT_FOUND') return 'This category no longer exists. Refresh the list.'
    if (error.status === 400) return 'The request was not accepted. Refresh and try again.'
  }
  return 'We could not confirm the category change. Refresh the list before trying again.'
}

function CategoryNameForm({ initialName = '', submitLabel, pending, onSubmit, onCancel }: {
  initialName?: string; submitLabel: string; pending: boolean; onSubmit: (name: string) => void; onCancel?: () => void
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<NameValues>({ resolver: zodResolver(nameSchema), defaultValues: { name: initialName } })
  return <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit(values => onSubmit(values.name))}>
    <div className="min-w-0 flex-1"><label className="block text-sm font-semibold" htmlFor={`category-name-${submitLabel.toLowerCase().replaceAll(' ', '-')}`}>Category name</label><input id={`category-name-${submitLabel.toLowerCase().replaceAll(' ', '-')}`} maxLength={100} autoComplete="off" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'category-name-error' : undefined} className="mt-2 min-h-11 w-full rounded-control border border-control-border bg-surface px-3" {...register('name')} />{errors.name && <p id="category-name-error" className="mt-1 text-sm text-accent-hover">{errors.name.message}</p>}</div>
    <div className="flex gap-3"><Button type="submit" pending={pending}>{submitLabel}</Button>{onCancel && <Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>}</div>
  </form>
}

export function AdminCategoriesPage() {
  const { session } = useAuth()
  const client = useQueryClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const categories = useQuery({ queryKey: ['categories'], enabled: session?.user.role === 'ADMIN', queryFn: ({ signal }) => getCategories(signal) })
  const refresh = async () => { await client.invalidateQueries({ queryKey: ['categories'] }) }
  const create = useMutation({ retry: false, mutationFn: (name: string) => createAdminCategory(name, session!.accessToken), onSuccess: refresh })
  const rename = useMutation({ retry: false, mutationFn: ({ id, name }: { id: string; name: string }) => renameAdminCategory(id, name, session!.accessToken), onSuccess: async () => { setEditing(null); await refresh() } })
  const remove = useMutation({ retry: false, mutationFn: (id: string) => deleteAdminCategory(id, session!.accessToken), onSuccess: async () => { setDeleting(null); await refresh() } })
  const busy = categories.isFetching || create.isPending || rename.isPending || remove.isPending
  const mutationError = create.error ?? rename.error ?? remove.error
  const resetErrors = () => { create.reset(); rename.reset(); remove.reset() }
  const retry = () => { resetErrors(); void categories.refetch() }
  return <div className="space-y-8">
    <header><h1 className="text-3xl tracking-tight sm:text-4xl">Category management</h1><p className="mt-3 max-w-2xl text-ink-muted">Add, rename, or remove service categories used across artisan discovery and service listings.</p></header>
    {mutationError && <ErrorState title="Category change not confirmed" description={failure(mutationError)} onRetry={busy ? undefined : retry} />}
    <section aria-labelledby="add-category-heading" className="space-y-4 border-y border-line py-5"><h2 id="add-category-heading" className="text-xl">Add a category</h2><CategoryNameForm submitLabel={create.isPending ? 'Adding...' : 'Add category'} pending={create.isPending || categories.isFetching} onSubmit={name => { resetErrors(); create.mutate(name) }} />{create.isSuccess && <SuccessState title="Category added" />}</section>
    <section aria-labelledby="categories-heading" className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="categories-heading" className="text-2xl">Service categories</h2><Button variant="secondary" pending={categories.isFetching} disabled={create.isPending || rename.isPending || remove.isPending} onClick={retry}>Refresh categories</Button></div>
      {categories.isPending && <LoadingState label="Loading categories..." />}
      {categories.isFetching && !categories.isPending && <LoadingState label="Refreshing categories..." />}
      {categories.isError && <ErrorState title="Categories unavailable" description={failure(categories.error)} onRetry={busy ? undefined : retry} />}
      {categories.data && (categories.data.length ? <ul className="divide-y divide-line border-y border-line">{categories.data.map(category => <li key={category.id} className="space-y-4 py-5">
        {editing === category.id ? <CategoryNameForm key={category.id} initialName={category.name} submitLabel={rename.isPending ? 'Saving...' : 'Save name'} pending={rename.isPending || categories.isFetching} onSubmit={name => { resetErrors(); rename.mutate({ id: category.id, name }) }} onCancel={() => setEditing(null)} /> : <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold">{category.name}</h3><div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={busy} onClick={() => { resetErrors(); setDeleting(null); setEditing(category.id) }}>Rename <span className="sr-only">{category.name}</span></Button><Button variant="secondary" disabled={busy} onClick={() => { resetErrors(); setEditing(null); setDeleting(category) }}>Remove <span className="sr-only">{category.name}</span></Button></div></div>}
        {deleting?.id === category.id && <div role="group" aria-label={`Confirm removal of ${category.name}`} className="space-y-3 bg-surface-muted p-4"><p>Remove “{category.name}” from service categories?</p><p className="text-sm text-ink-muted">Categories used by artisan services cannot be removed.</p><div className="flex flex-wrap gap-3"><Button pending={remove.isPending} disabled={categories.isFetching || rename.isPending || create.isPending} onClick={() => { resetErrors(); remove.mutate(category.id) }}>{remove.isPending ? 'Removing...' : 'Confirm removal'}</Button><Button variant="secondary" disabled={remove.isPending} onClick={() => setDeleting(null)}>Cancel</Button></div></div>}
      </li>)}</ul> : <EmptyState title="No service categories" description="Add a category to make it available for artisan services and discovery." />)}
    </section>
  </div>
}
