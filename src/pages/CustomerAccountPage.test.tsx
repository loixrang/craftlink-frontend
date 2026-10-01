import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { AuthContext } from '../app/authContext'
import { AppRoutes } from '../routes/AppRoutes'
import type { AuthSession } from '../services/login'

const customer: AuthSession = { accessToken: 'token', user: { id: 'customer-1', email: 'customer@example.com', role: 'CUSTOMER' } }

function mount(path: string, session: AuthSession | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><AuthContext.Provider value={{ session, status: session ? 'authenticated' : 'anonymous', signIn: vi.fn(), signOut: vi.fn(), retry: vi.fn() }}><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AuthContext.Provider></QueryClientProvider>)
}

it('shows only verified account basics with a dashboard return link', () => {
  mount('/customer/account', customer)
  expect(screen.getByRole('heading', { name: 'Your account' })).toBeVisible()
  expect(screen.getByText('customer@example.com')).toBeVisible()
  expect(screen.getByText('Customer')).toBeVisible()
  expect(screen.getByText(/Email and profile changes are not available yet/)).toBeVisible()
  expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/customer')
})

it('protects account details from anonymous and other-role sessions', () => {
  const anonymous = mount('/customer/account', null)
  expect(screen.getByRole('heading', { name: /Log in/ })).toBeVisible()
  anonymous.unmount()

  mount('/customer/account', { ...customer, user: { ...customer.user, role: 'ARTISAN' } })
  expect(screen.getByText('Access unavailable')).toBeVisible()
  expect(screen.queryByText('customer@example.com')).not.toBeInTheDocument()
})
