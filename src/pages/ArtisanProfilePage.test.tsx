import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { ArtisanProfilePage } from './ArtisanProfilePage'

const id = 'c567fcea-841e-4be7-95f4-55487865b403'

const profile = {
  id, displayName: 'Ada Obi', bio: 'Electrician.', yearsExperience: 12, city: 'Uyo', state: 'Akwa Ibom',
  isAvailable: true, profileImageUrl: null, phone: null, whatsapp: null, verificationStatus: 'VERIFIED',
  averageRating: 4.8, reviewCount: 24,
  services: [
    { id: 'd1', categoryId: id, title: 'House rewiring', description: 'Full rewiring', priceFrom: 150000 },
    { id: 'd2', categoryId: id, title: 'Fuse box upgrade', description: 'Upgrade', priceFrom: 75000.5 },
    { id: 'd3', categoryId: id, title: 'Consultation', description: 'Advice', priceFrom: null },
  ],
  portfolio: [], credentials: [],
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[`/artisans/${id}`]}><Routes><Route path="/artisans/:artisanId" element={<ArtisanProfilePage />} /></Routes></MemoryRouter></QueryClientProvider>)
}

afterEach(() => vi.unstubAllGlobals())

it('shows every listed starting price in Nigerian Naira without changing the stored amount', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: profile }))))
  mount()
  expect(await screen.findByText('Starting price: ₦150,000 · Confirm the final quote with the artisan.')).toBeVisible()
  expect(screen.getByText('Starting price: ₦75,000.5 · Confirm the final quote with the artisan.')).toBeVisible()
  expect(screen.queryByText(/150,000\.00|150000|£|€|\$/)).not.toBeInTheDocument()
})

it('omits pricing entirely when a service has no starting price', async () => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: profile }))))
  mount()
  expect(await screen.findByRole('heading', { name: 'Consultation' })).toBeVisible()
  expect(screen.getAllByText(/Starting price:/)).toHaveLength(2)
})