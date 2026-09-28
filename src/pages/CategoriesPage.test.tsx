import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CategoriesPage } from './CategoriesPage'

vi.mock('./ArtisanResults', () => ({ ArtisanResults: () => null }))

const data = [{ id: 'plumbing-id', name: 'Plumbing' }, { id: 'fashion/id &1', name: 'Tailoring/Fashion Design' }]
const response = (value: unknown = data) => new Response(JSON.stringify({ data: value }), { status: 200 })

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  return <><output aria-label="Route">{location.search}</output><button onClick={() => navigate(-1)}>Back</button></>
}
function setup(path = '/artisans') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><CategoriesPage /><Navigation /></MemoryRouter></QueryClientProvider>)
}
afterEach(() => vi.unstubAllGlobals())

describe('category browsing', () => {
  it('loads public categories with cancellation and no bearer token', async () => {
    const fetcher = vi.fn().mockResolvedValue(response())
    vi.stubGlobal('fetch', fetcher)
    setup()
    expect(screen.getByText('Loading categories...')).toBeVisible()
    expect(await screen.findByRole('link', { name: 'Plumbing' })).toBeVisible()
    const [url, options] = fetcher.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/v1/categories')
    expect(options.method).toBe('GET')
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(new Headers(options.headers).has('Authorization')).toBe(false)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('uses server IDs, resets search/page, preserves other parameters and supports history', async () => {
    const fetcher = vi.fn().mockResolvedValue(response())
    vi.stubGlobal('fetch', fetcher)
    setup('/artisans?q=Plumbing&page=3&sort=rating')
    const plumbing = await screen.findByRole('link', { name: 'Plumbing' })
    expect(plumbing).toHaveAttribute('aria-current', 'true')
    fireEvent.click(screen.getByRole('link', { name: 'Tailoring/Fashion Design' }))
    expect(screen.getByText('Selected: Tailoring/Fashion Design')).toBeVisible()
    const query = new URLSearchParams(screen.getByLabelText('Route').textContent ?? '')
    expect(query.get('categoryId')).toBe('fashion/id &1')
    expect(query.get('sort')).toBe('rating')
    expect(query.has('q')).toBe(false)
    expect(query.has('page')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(plumbing).toHaveAttribute('aria-current', 'true')
    fireEvent.click(screen.getByRole('link', { name: 'All categories' }))
    expect(screen.queryByText(/^Selected:/)).not.toBeInTheDocument()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('restores a category from a direct URL before considering landing search intent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()))
    setup('/artisans?categoryId=plumbing-id&q=Tailoring%2FFashion%20Design')
    expect(await screen.findByRole('link', { name: 'Plumbing' })).toHaveAttribute('aria-current', 'true')
  })

  it('handles an unavailable category and clears it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()))
    setup('/artisans?categoryId=removed')
    expect(await screen.findByText('Category not available')).toBeVisible()
    fireEvent.click(screen.getByRole('link', { name: 'Clear category selection' }))
    expect(screen.queryByText('Category not available')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Route')).toBeEmptyDOMElement()
  })

  it('shows an empty state without fabricated fallback categories', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response([])))
    setup()
    expect(await screen.findByText('No categories yet')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Plumbing' })).not.toBeInTheDocument()
  })

  it.each(['network', 'server', 'rate-limit'])('recovers from a %s error by retrying', async kind => {
    const fetcher = vi.fn()
    if (kind === 'network') fetcher.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    else fetcher.mockResolvedValueOnce(new Response('{}', { status: kind === 'server' ? 503 : 429 }))
    fetcher.mockResolvedValueOnce(response())
    vi.stubGlobal('fetch', fetcher)
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Categories are unavailable')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: 'Plumbing' })).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([null, {}, [{ name: 'Missing ID' }], [{ id: '1', name: '' }], [{ id: '1', name: 'A' }, { id: '1', name: 'B' }]])('rejects malformed category data: %j', async value => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(value)))
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Categories are unavailable')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('cancels category loading on unmount', async () => {
    let signal: AbortSignal | null | undefined
    vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => {
      signal = options.signal
      return new Promise<Response>(() => {})
    }))
    const view = setup()
    await waitFor(() => expect(signal).toBeInstanceOf(AbortSignal))
    view.unmount()
    expect(signal?.aborted).toBe(true)
  })
})
