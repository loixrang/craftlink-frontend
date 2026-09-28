import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { ArtisanProfilePage } from './ArtisanProfilePage'
import { getArtisanProfile } from '../services/artisanProfile'

const profile = {
  id: 'ada', displayName: 'Ada Works', bio: 'Careful repairs.', yearsExperience: 4,
  city: 'Lagos', state: null, isAvailable: true, profileImageUrl: 'https://example.com/ada.jpg',
  phone: '+234 801 234 5678', whatsapp: '+234 801 234 5678', verificationStatus: 'PENDING',
  averageRating: 4.5, reviewCount: 2,
  services: [{ id: 's1', categoryId: 'c1', title: 'Sink repair', description: 'Fix leaks.', priceFrom: 0 }],
  portfolio: [{ id: 'p1', title: 'Kitchen work', imageUrl: 'https://example.com/work.jpg', description: 'New fittings.' }],
  credentials: [{ id: 'c1', title: 'Trade certificate', issuer: 'Trade school', issuedAt: '2024-01-02T00:00:00Z', verificationStatus: 'VERIFIED', documentUrl: 'https://private.example/secret' }],
  latitude: 6.123456, passwordHash: 'private-secret',
}
const response = (data: unknown = profile) => new Response(JSON.stringify({ data }))
function setup(path = '/artisans/ada') {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[path]}><Link to="/artisans/other">Other artisan</Link><Routes><Route path="/artisans/:artisanId" element={<ArtisanProfilePage />} /><Route path="/artisans" element={<h1>Browse results</h1>} /></Routes></MemoryRouter></QueryClientProvider>)
}
afterEach(() => vi.unstubAllGlobals())

it('loads public detail with no credentials and presents all public sections and honest request CTA', async () => {
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup()
  expect(screen.getByText('Loading artisan profile...')).toBeVisible()
  expect(await screen.findByRole('heading', { level: 1, name: 'Ada Works' })).toBeVisible()
  const [url, options] = fetcher.mock.calls[0] as [string, RequestInit]
  expect(url).toBe('/api/v1/artisans/ada')
  expect(new Headers(options.headers).has('Authorization')).toBe(false)
  expect(options.credentials).toBe('omit')
  expect(options.signal).toBeInstanceOf(AbortSignal)
  expect(screen.getByText('Sink repair')).toBeVisible()
  expect(screen.getByText(/Starting price: 0/)).toBeVisible()
  expect(screen.getByText('Kitchen work')).toBeVisible()
  expect(screen.getByText('Verified credential')).toBeVisible()
  expect(screen.getByText('Issued: 2024-01-02')).toBeVisible()
  expect(screen.getByText('4.5 / 5 (2 reviews)')).toBeVisible()
  expect(screen.getByRole('link', { name: /Call/ })).toHaveAttribute('href', 'tel:+2348012345678')
  expect(screen.getByRole('link', { name: /Contact on WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/2348012345678')
  expect(screen.getByRole('button', { name: 'Request a service' })).toBeDisabled()
  expect(screen.getByText(/Online service requests are coming soon/)).toBeVisible()
  expect(document.body.innerHTML).not.toMatch(/private-secret|private.example|6.123456/)
  fireEvent.click(screen.getByRole('link', { name: 'Browse artisans' }))
  expect(screen.getByRole('heading', { name: 'Browse results' })).toBeVisible()
})

it('strips private and unknown fields before caching', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()))
  const data = await getArtisanProfile('ada', new AbortController().signal)
  expect(data).not.toHaveProperty('latitude')
  expect(data).not.toHaveProperty('passwordHash')
  expect(data.credentials[0]).not.toHaveProperty('documentUrl')
})

it('shows empty sections, unavailable status and no invented ratings or contacts', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ...profile, bio: '', city: null, isAvailable: false, profileImageUrl: null, phone: null, whatsapp: null, averageRating: null, reviewCount: 0, services: [], portfolio: [], credentials: [] })))
  setup()
  await screen.findByText('No services listed yet.')
  expect(screen.getByText('No portfolio work shared yet.')).toBeVisible()
  expect(screen.getByText('No credentials shared yet.')).toBeVisible()
  expect(screen.getByText('No public contact methods provided.')).toBeVisible()
  expect(screen.getByText('No ratings yet')).toBeVisible()
  expect(screen.getByText('Currently unavailable')).toBeVisible()
})

it('rejects unsafe image/contact URLs and falls back after image failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ...profile, phone: 'javascript:alert(1)', whatsapp: 'https://evil.example', portfolio: [{ ...profile.portfolio[0], imageUrl: 'data:image/svg+xml,bad' }] })))
  setup()
  await screen.findByRole('heading', { name: 'Ada Works' })
  expect(screen.queryByRole('link', { name: /Call|WhatsApp/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('img', { name: 'Kitchen work' })).not.toBeInTheDocument()
  fireEvent.error(screen.getByRole('img', { name: 'Ada Works' }))
  expect(screen.queryByRole('img', { name: 'Ada Works' })).not.toBeInTheDocument()
})

it.each([404, 429, 500, 0])('handles HTTP/network error %s', async status => {
  const fetcher = vi.fn()
  if (status) fetcher.mockResolvedValueOnce(new Response('{}', { status }))
  else fetcher.mockRejectedValueOnce(new TypeError('offline'))
  fetcher.mockImplementation(() => Promise.resolve(response()))
  vi.stubGlobal('fetch', fetcher)
  setup()
  expect(await screen.findByRole('alert')).toHaveTextContent(status === 404 ? 'Artisan not found' : 'Profile unavailable')
  if (status === 404) expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  else {
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Ada Works' })).toBeVisible()
  }
})

it.each([null, { ...profile, id: 'someone-else' }, { ...profile, averageRating: 6 }, { ...profile, services: [profile.services[0], profile.services[0]] }])('rejects malformed or mismatched detail', async value => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(value)))
  setup()
  expect(await screen.findByRole('alert')).toHaveTextContent('Profile unavailable')
})

it.each(['me', 'bad%2Fpath', '..'])('does not send invalid or reserved public ID %s', async id => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  await expect(getArtisanProfile(decodeURIComponent(id), new AbortController().signal)).rejects.toMatchObject({ status: 404 })
  expect(fetcher).not.toHaveBeenCalled()
})

it('isolates profiles during navigation and cancels an abandoned detail request', async () => {
  let signal: AbortSignal | null | undefined
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response()).mockImplementation((_url: string, options: RequestInit) => {
    signal = options.signal
    return new Promise<Response>(() => {})
  }))
  const view = setup()
  await screen.findByRole('heading', { name: 'Ada Works' })
  fireEvent.click(screen.getByRole('link', { name: 'Other artisan' }))
  await waitFor(() => expect(signal).toBeInstanceOf(AbortSignal))
  expect(screen.queryByRole('heading', { name: 'Ada Works' })).not.toBeInTheDocument()
  expect(screen.getByText('Loading artisan profile...')).toBeVisible()
  view.unmount()
  expect(signal?.aborted).toBe(true)
})
