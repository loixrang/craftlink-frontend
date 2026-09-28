import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { ArtisanResults } from './ArtisanResults'

const artisan = { id: 'artisan-1', displayName: 'Ada Works', bio: 'Repairs and installations', yearsExperience: 4, profileImageUrl: null, city: 'Lagos', state: null, isAvailable: true, verificationStatus: 'PENDING', averageRating: 4.5, reviewCount: 2, distanceKm: null, categories: [{ id: 'plumber', name: 'Plumbing' }] }
const payload = { data: [artisan], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }
const response = (value: unknown = payload) => new Response(JSON.stringify(value))
function Back() { const navigate = useNavigate(); const location = useLocation(); return <><button onClick={() => navigate(-1)}>Back</button><output aria-label="Current URL">{location.search}</output></> }
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
  expect(url).toBe('/api/v1/artisans?q=repair+%26+fix&categoryId=plumber&minRating=4&minExperience=2&availability=false&page=4')
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

it('applies manual location only on submit, preserves filters and restores history', async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?q=repair&categoryId=plumber&minRating=4&page=3')
  await screen.findByRole('link', { name: 'Ada Works' })
  fireEvent.change(screen.getByRole('textbox', { name: 'Latitude' }), { target: { value: '-6.5' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Longitude' }), { target: { value: '0' } })
  fireEvent.change(screen.getByLabelText('Search radius (km)'), { target: { value: '12.5' } })
  expect(fetcher).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Apply location' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  expect(fetcher.mock.calls[1]?.[0]).toBe('/api/v1/artisans?q=repair&categoryId=plumber&minRating=4&latitude=-6.5&longitude=0&radiusKm=12.5')
  expect(screen.getByText('Location applied: -6.5, 0 within 12.5 km.')).toBeVisible()
  expect(screen.getByLabelText('Current URL')).not.toHaveTextContent('page=')
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('')
})

it('restores direct location links, retains location on search, and clears just location', async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?latitude=0&longitude=-180&radiusKm=20&categoryId=plumber')
  await screen.findByRole('link', { name: 'Ada Works' })
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('0')
  expect(screen.getByRole('textbox', { name: 'Longitude' })).toHaveValue('-180')
  fireEvent.change(screen.getByLabelText('Search artisans'), { target: { value: 'Ada' } })
  fireEvent.click(screen.getByRole('button', { name: 'Search artisans' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  expect(fetcher.mock.calls[1]?.[0]).toContain('latitude=0&longitude=-180&radiusKm=20')
  fireEvent.click(screen.getByRole('button', { name: 'Clear location' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3))
  expect(fetcher.mock.calls[2]?.[0]).toBe('/api/v1/artisans?q=Ada&categoryId=plumber')
  expect(screen.getByRole('textbox', { name: 'Longitude' })).toHaveValue('')
})

it.each(['latitude=91&longitude=0', 'latitude=0&longitude=-181', 'latitude=0', 'radiusKm=10', 'latitude=&longitude=0', 'latitude=NaN&longitude=0', 'latitude=0&longitude=Infinity', 'latitude=0&longitude=0&radiusKm=0', 'latitude=0&longitude=0&radiusKm=-5'])('ignores the whole invalid location: %s', async query => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?q=repair&' + query)
  await screen.findByRole('link', { name: 'Ada Works' })
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/v1/artisans?q=repair')
  expect(screen.getByText(/The location in this link is invalid/)).toBeVisible()
})

it('validates manual inputs, focuses the error, and allows correction without a radius', async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup()
  await screen.findByRole('link', { name: 'Ada Works' })
  fireEvent.change(screen.getByRole('textbox', { name: 'Latitude' }), { target: { value: '91' } })
  fireEvent.change(screen.getByLabelText('Search radius (km)'), { target: { value: '-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Apply location' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Check the location fields')
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveFocus()
  expect(screen.getByRole('textbox', { name: 'Longitude' })).toHaveAttribute('aria-invalid', 'true')
  expect(fetcher).toHaveBeenCalledTimes(1)
  fireEvent.change(screen.getByRole('textbox', { name: 'Latitude' }), { target: { value: '90' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Longitude' }), { target: { value: '180' } })
  fireEvent.change(screen.getByLabelText('Search radius (km)'), { target: { value: '' } })
  fireEvent.click(screen.getByRole('button', { name: 'Apply location' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  expect(fetcher.mock.calls[1]?.[0]).toBe('/api/v1/artisans?latitude=90&longitude=180')
})

it('clears unapplied location drafts and validation errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(response())))
  setup()
  await screen.findByRole('link', { name: 'Ada Works' })
  fireEvent.change(screen.getByRole('textbox', { name: 'Latitude' }), { target: { value: 'bad' } })
  fireEvent.click(screen.getByRole('button', { name: 'Apply location' }))
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Clear location' }))
  expect(screen.getByRole('textbox', { name: 'Latitude' })).toHaveValue('')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it.each(['rating', 'experience', 'newest', 'distance'])('sends supported sort %s and resets the page on sort changes', async sort => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?q=repair&latitude=0&longitude=0&page=3')
  await screen.findByRole('link', { name: 'Ada Works' })
  fireEvent.change(screen.getByLabelText('Sort results'), { target: { value: sort } })
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  expect(fetcher.mock.calls[1]?.[0]).toBe('/api/v1/artisans?q=repair&latitude=0&longitude=0&sort=' + sort)
  expect(screen.getByLabelText('Current URL')).not.toHaveTextContent('page=')
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(screen.getByLabelText('Sort results')).toHaveValue('')
  expect(screen.getByLabelText('Current URL')).toHaveTextContent('page=3')
})

it.each(['0', '-1', '1.5', 'Infinity', '1e2', '', '9007199254740992'])('ignores invalid page %s with recovery feedback', async page => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?sort=rating&page=' + page)
  await screen.findByRole('link', { name: 'Ada Works' })
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/v1/artisans?sort=rating')
  expect(screen.getByText(/The page in this link is invalid/)).toBeVisible()
})

it.each(['distance', 'unknown'])('ignores unavailable sort %s without location', async sort => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?sort=' + sort)
  await screen.findByRole('link', { name: 'Ada Works' })
  expect(fetcher.mock.calls[0]?.[0]).toBe('/api/v1/artisans')
  expect(screen.getByRole('option', { name: 'Nearest first' })).toBeDisabled()
  expect(screen.getByText(/The sort in this link is unavailable/)).toBeVisible()
})

it('pages with all filters, respects boundaries and restores a cached page through history', async () => {
  const fetcher = vi.fn((url: string) => {
    const page = Number(new URL(url, 'http://localhost').searchParams.get('page') ?? 1)
    return Promise.resolve(response({ data: [{ ...artisan, displayName: 'Artisan page ' + page }], pagination: { page, limit: 1, total: 2, totalPages: 2 } }))
  })
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?q=repair&categoryId=plumber&minRating=4&minExperience=2&availability=true&latitude=0&longitude=0&radiusKm=10&sort=distance')
  await screen.findByRole('link', { name: 'Artisan page 1' })
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
  await screen.findByRole('link', { name: 'Artisan page 2' })
  expect(fetcher.mock.calls[1]?.[0]).toBe('/api/v1/artisans?q=repair&categoryId=plumber&minRating=4&minExperience=2&availability=true&latitude=0&longitude=0&radiusKm=10&sort=distance&page=2')
  expect(screen.getByText('Page 2 of 2')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  expect(screen.queryByRole('link', { name: 'Artisan page 1' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(await screen.findByRole('link', { name: 'Artisan page 1' })).toBeVisible()
  expect(fetcher).toHaveBeenCalledTimes(2)
})

it('recovers an empty out-of-range page without discarding filters', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(response({ data: [], pagination: { page: 8, limit: 20, total: 1, totalPages: 1 } })).mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?q=repair&sort=newest&page=8')
  expect(await screen.findByText('No artisans on this page')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Return to first page' }))
  expect(await screen.findByRole('link', { name: 'Ada Works' })).toBeVisible()
  expect(fetcher.mock.calls[1]?.[0]).toBe('/api/v1/artisans?q=repair&sort=newest')
})

it('shows loading and recoverable error for a new page without displaying previous results', async () => {
  let rejectPage: (reason: Error) => void = () => {}
  const fetcher = vi.fn().mockResolvedValueOnce(response({ ...payload, pagination: { page: 1, limit: 1, total: 2, totalPages: 2 } }))
    .mockImplementationOnce(() => new Promise<Response>((_resolve, reject) => { rejectPage = reject }))
    .mockResolvedValue(response({ ...payload, pagination: { page: 2, limit: 1, total: 2, totalPages: 2 } }))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?sort=rating')
  await screen.findByRole('link', { name: 'Ada Works' })
  fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
  expect(screen.getByText('Finding artisans...')).toBeVisible()
  expect(screen.queryByRole('link', { name: 'Ada Works' })).not.toBeInTheDocument()
  rejectPage(new TypeError('offline'))
  await screen.findByRole('alert')
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('Page 2 of 2')).toBeVisible()
  expect(fetcher.mock.calls[2]?.[0]).toBe('/api/v1/artisans?sort=rating&page=2')
})

it.each([
  { page: 1, limit: 20, total: 1, totalPages: 0 },
  { page: 1, limit: 20, total: 0, totalPages: 0 },
  { page: 2, limit: 20, total: 1, totalPages: 1 },
  { page: 9007199254740992, limit: 20, total: 1, totalPages: 1 },
])('rejects unsafe or inconsistent pagination metadata %j', async pagination => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ...payload, pagination })))
  setup()
  expect(await screen.findByRole('alert')).toHaveTextContent('Artisans are unavailable')
  expect(screen.queryByRole('navigation', { name: 'Results pages' })).not.toBeInTheDocument()
})

it('retains sorting but resets page on search and removes distance sorting when location clears', async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup('/artisans?sort=distance&page=2&latitude=0&longitude=0')
  await screen.findByRole('link', { name: 'Ada Works' })
  fireEvent.change(screen.getByLabelText('Search artisans'), { target: { value: 'Ada' } })
  fireEvent.click(screen.getByRole('button', { name: 'Search artisans' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
  expect(fetcher.mock.calls[1]?.[0]).toBe('/api/v1/artisans?q=Ada&latitude=0&longitude=0&sort=distance')
  fireEvent.click(screen.getByRole('button', { name: 'Clear location' }))
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3))
  expect(fetcher.mock.calls[2]?.[0]).toBe('/api/v1/artisans?q=Ada')
  expect(screen.getByLabelText('Sort results')).toHaveValue('')
})
