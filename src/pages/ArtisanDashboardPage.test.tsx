import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'

const session: AuthSession = { accessToken: 'private-token', user: { id: 'owner-1', email: 'artisan@example.com', role: 'ARTISAN' } }
const profile = { id: 'profile-1', displayName: 'Ada Repairs', bio: 'Careful repairs.', yearsExperience: 4, city: 'Ikeja', state: 'Lagos', isAvailable: true }
const response = (data: unknown = profile) => new Response(JSON.stringify({ data }))
afterEach(() => vi.unstubAllGlobals())
function mount(currentSession: AuthSession | null = session, status: 'authenticated' | 'anonymous' | 'restoring' = currentSession ? 'authenticated' : 'anonymous') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  const view = render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session: currentSession, status, signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}><MemoryRouter initialEntries={['/artisan']}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>)
  return { ...view, client }
}
it('loads the owner summary securely and links using profile ID, not account ID', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response({ ...profile, latitude: 6.123, phone: 'secret-contact', documentUrl: 'private-document' }))
  vi.stubGlobal('fetch', fetcher)
  const { client } = mount()
  expect(screen.getByText('Loading your profile...')).toBeVisible()
  expect(await screen.findByText('Ada Repairs')).toBeVisible()
  expect(screen.getByText('artisan@example.com')).toBeVisible()
  expect(screen.getByText('Available for work')).toBeVisible()
  expect(screen.getByText('Ikeja, Lagos')).toBeVisible()
  expect(screen.getByText('4 years')).toBeVisible()
  expect(screen.getByRole('link', { name: 'View public profile' })).toHaveAttribute('href', '/artisans/profile-1')
  const [url, options] = fetcher.mock.calls[0]!
  expect(url).toBe('/api/v1/artisans/me')
  expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer private-token')
  expect(options?.signal).toBeInstanceOf(AbortSignal)
  expect(client.getQueryData(['own-artisan-profile', 'owner-1'])).toEqual(profile)
  expect(JSON.stringify(client.getQueryCache().getAll().map(query => query.queryKey))).not.toContain('private-token')
  expect(document.body).not.toHaveTextContent('private-token')
  expect(screen.getAllByRole('link')).toHaveLength(2)
})
it('shows honest empty profile fields and unavailable status', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ...profile, bio: '', city: null, state: null, yearsExperience: 1, isAvailable: false })))
  mount()
  expect(await screen.findByText('Not available for work')).toBeVisible()
  expect(screen.getByText('No introduction added yet.')).toBeVisible()
  expect(screen.getByText('Location not added yet')).toBeVisible()
  expect(screen.getByText('1 year')).toBeVisible()
})
it('treats the confirmed missing-profile response as setup guidance', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'ARTISAN_PROFILE_NOT_FOUND', message: 'Missing' } }), { status: 404 })))
  mount()
  expect(await screen.findByText('No artisan profile yet')).toBeVisible()
  expect(screen.queryByRole('link', { name: 'View public profile' })).not.toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
it.each(['network', 'server', 'malformed', '404', '401', '403'])('handles %s errors and retries', async failure => {
  const fetcher = vi.fn<typeof fetch>()
  if (failure === 'network') fetcher.mockRejectedValueOnce(new TypeError('offline'))
  else fetcher.mockResolvedValueOnce(failure === 'malformed' ? response({ ...profile, isAvailable: 'yes' }) : new Response('{}', { status: failure === 'server' ? 503 : Number(failure) }))
  fetcher.mockResolvedValueOnce(response())
  vi.stubGlobal('fetch', fetcher)
  mount()
  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Profile unavailable')
  if (failure === '401') expect(alert).toHaveTextContent('session has expired')
  if (failure === '403') expect(alert).toHaveTextContent('cannot access')
  expect(screen.queryByRole('link', { name: 'View public profile' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('Ada Repairs')).toBeVisible()
})
it('announces refreshing and hides stale profile data after failure', async () => {
  let reject!: (error: Error) => void
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValueOnce(response()).mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail })))
  mount()
  await screen.findByText('Ada Repairs')
  fireEvent.click(screen.getByRole('button', { name: 'Refresh profile' }))
  expect(await screen.findByText('Refreshing your profile...')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Refresh profile' })).toBeDisabled()
  await act(async () => reject(new TypeError('offline')))
  await screen.findByRole('alert')
  expect(screen.queryByText('Ada Repairs')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'View public profile' })).not.toBeInTheDocument()
})
it('cancels the request on unmount', async () => {
  const fetcher = vi.fn<typeof fetch>().mockReturnValue(new Promise(() => {}))
  vi.stubGlobal('fetch', fetcher)
  const view = mount()
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  view.unmount()
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
})
it.each(['CUSTOMER', 'ADMIN'] as const)('denies %s without fetching owner data', role => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  mount({ ...session, user: { ...session.user, role } })
  expect(screen.getByRole('heading', { name: 'Access unavailable' })).toBeVisible()
  expect(fetcher).not.toHaveBeenCalled()
})
it.each(['anonymous', 'restoring'] as const)('withholds profile requests while %s', status => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  mount(null, status)
  expect(screen.queryByRole('heading', { name: 'Artisan dashboard' })).not.toBeInTheDocument()
  expect(fetcher).not.toHaveBeenCalled()
})
