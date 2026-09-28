import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { ArtisanResults } from './ArtisanResults'

const artisan = { id: 'artisan-1', displayName: 'Ada Works', bio: 'Repairs and installations', yearsExperience: 4, profileImageUrl: null, city: 'Lagos', state: null, isAvailable: true, verificationStatus: 'PENDING', averageRating: 4.5, reviewCount: 2, distanceKm: null, categories: [{ id: 'plumber', name: 'Plumbing' }] }
const payload = { data: [artisan], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }
const response = (value: unknown = payload) => new Response(JSON.stringify(value))
function Back() { const navigate = useNavigate(); return <button onClick={() => navigate(-1)}>Back</button> }
function setup(path = '/artisans') {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })}><MemoryRouter initialEntries={[path]}><ArtisanResults /><Back /></MemoryRouter></QueryClientProvider>)
}
afterEach(() => vi.unstubAllGlobals())

it('requests public results with exact supported filters, cancellation and safe summary links', async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?q=repair%20%26%20fix&categoryId=plumber&minRating=4&minExperience=2&availability=false&sort=distance&page=4&latitude=1')
  expect(screen.getByText('Finding artisans...')).toBeVisible()
  expect(await screen.findByRole('link', { name: 'Ada Works' })).toHaveAttribute('href', '/artisans/artisan-1')
  const [url, options] = fetcher.mock.calls[0] as [string, RequestInit]
  expect(url).toBe('/api/v1/artisans?q=repair+%26+fix&categoryId=plumber&minRating=4&minExperience=2&availability=false')
  expect(options.signal).toBeInstanceOf(AbortSignal)
  expect(new Headers(options.headers).has('Authorization')).toBe(false)
  expect(screen.getByText('4.5 / 5 (2 reviews)')).toBeVisible()
  expect(screen.getByText('Showing 1 of 1 artisans')).toBeVisible()
})

it('submits filters only on search, restores history and clears filters', async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?categoryId=plumber')
  await screen.findByRole('link', { name: 'Ada Works' })
  fireEvent.change(screen.getByLabelText('Search artisans'), { target: { value: 'Ada' } })
  fireEvent.change(screen.getByLabelText('Minimum rating'), { target: { value: '4' } })
  fireEvent.change(screen.getByLabelText('Availability'), { target: { value: 'true' } })
  expect(fetcher).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Search artisans' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  expect(fetcher.mock.calls[1]?.[0]).toContain('q=Ada&categoryId=plumber&minRating=4&availability=true')
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(screen.getByLabelText('Search artisans')).toHaveValue('')
  fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3))
  expect(fetcher.mock.calls[2]?.[0]).toBe('/api/v1/artisans')
})

it('ignores malformed URL filter values with an explanation', async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?minRating=9&minExperience=-2&availability=maybe')
  await screen.findByRole('link', { name: 'Ada Works' })
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/v1/artisans')
  expect(screen.getByText(/Some filters in this link/)).toBeVisible()
})

it('shows an empty result', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })))
  setup()
  expect(await screen.findByText('No artisans found')).toBeVisible()
})

it.each([400, 429, 503, 0])('recovers from request failure %s', async status => {
  const fetcher = vi.fn()
  if (status) fetcher.mockResolvedValueOnce(new Response('{}', { status }))
  else fetcher.mockRejectedValueOnce(new TypeError('offline'))
  fetcher.mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup()
  expect(await screen.findByRole('alert')).toHaveTextContent('Artisans are unavailable')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('link', { name: 'Ada Works' })).toBeVisible()
})

it.each([{ data: {} }, { ...payload, data: [{ ...artisan, averageRating: 7 }] }, { ...payload, data: [artisan, artisan] }, { ...payload, pagination: null }])('rejects malformed collections', async value => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(value)))
  setup()
  expect(await screen.findByRole('alert')).toHaveTextContent('Artisans are unavailable')
})

it('cancels obsolete requests and does not retain previous filter results', async () => {
  const signals: AbortSignal[] = []
  vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => {
    if (options.signal) signals.push(options.signal)
    return new Promise<Response>(() => {})
  }))
  const view = setup()
  fireEvent.change(screen.getByLabelText('Search artisans'), { target: { value: 'New' } })
  fireEvent.click(screen.getByRole('button', { name: 'Search artisans' }))
  await waitFor(() => expect(signals).toHaveLength(2))
  expect(signals[0]?.aborted).toBe(true)
  view.unmount()
  expect(signals[1]?.aborted).toBe(true)
})


it('connects category navigation to result requests', async () => {
  const { CategoriesPage } = await import('./CategoriesPage')
  const fetcher = vi.fn((url: string) => Promise.resolve(response(url.endsWith('/categories') ? { data: [{ id: 'plumber', name: 'Plumbing' }] } : payload)))
  vi.stubGlobal('fetch', fetcher)
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><CategoriesPage /></MemoryRouter></QueryClientProvider>)
  fireEvent.click(await screen.findByRole('link', { name: 'Plumbing' }))
  await waitFor(() => expect(fetcher.mock.calls.some(([url]) => url === '/api/v1/artisans?categoryId=plumber')).toBe(true))
  expect(await screen.findByRole('link', { name: 'Ada Works' })).toBeVisible()
})
