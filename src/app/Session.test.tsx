import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import { AppProviders } from './AppProviders'
import { useAuth } from './authContext'
import { safeReturnPath } from '../routes/returnPath'

const key = 'craftlink.accessToken'
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
function Probe() {
  const { signOut } = useAuth()
  const location = useLocation()
  return <><output aria-label="Path">{location.pathname + location.search + location.hash}</output><button onClick={signOut}>End session</button></>
}
function mount(path = '/customer/requests?view=open#list') {
  return render(<AppProviders><MemoryRouter initialEntries={[path]}><App /><Probe /></MemoryRouter></AppProviders>)
}
function user(role = 'CUSTOMER') { return new Response(JSON.stringify({ data: { id: 'u1', email: 'user@example.com', role, ignored: 'private' } })) }

it.each(['CUSTOMER', 'ARTISAN', 'ADMIN'])('restores %s and exposes only its dashboard navigation', async role => {
  sessionStorage.setItem(key, 'saved-token')
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(user(role))
  vi.stubGlobal('fetch', fetcher)
  mount(`/${role.toLowerCase()}/nested`)
  expect(screen.queryByRole('heading', { name: /dashboard/ })).not.toBeInTheDocument()
  await screen.findByRole('heading', { name: /dashboard/ })
  expect(screen.getAllByRole('link', { name: /dashboard/ })).toHaveLength(1)
  expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument()
  const [url, options] = fetcher.mock.calls[0]!
  expect(url).toBe('/api/v1/auth/me')
  expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer saved-token')
  expect(document.body).not.toHaveTextContent('saved-token')
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
  await screen.findByRole('form', { name: 'Login' })
  expect(sessionStorage.getItem(key)).toBeNull()
})

it.each([['CUSTOMER', '/artisan'], ['CUSTOMER', '/admin'], ['ARTISAN', '/customer'], ['ARTISAN', '/admin'], ['ADMIN', '/customer'], ['ADMIN', '/artisan']])('denies %s entry to %s', async (role, path) => {
  sessionStorage.setItem(key, 'token')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(user(role)))
  mount(path)
  await screen.findByRole('heading', { name: 'Access unavailable' })
  expect(screen.queryByRole('heading', { name: /dashboard/ })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Go to your dashboard' })).toHaveAttribute('href', `/${role.toLowerCase()}`)
})

it.each([401, 403])('clears a rejected %s session and redirects to login', async status => {
  sessionStorage.setItem(key, 'expired')
  const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status }))
  vi.stubGlobal('fetch', fetcher)
  mount()
  await screen.findByRole('form', { name: 'Login' })
  expect(sessionStorage.getItem(key)).toBeNull()
  expect(fetcher).toHaveBeenCalledTimes(1)
})

it.each(['network', 'server', 'malformed'])('keeps protected content hidden on %s failure and supports retry', async failure => {
  sessionStorage.setItem(key, 'token')
  const fetcher = vi.fn<typeof fetch>()
  if (failure === 'network') fetcher.mockRejectedValueOnce(new TypeError('offline'))
  else fetcher.mockResolvedValueOnce(failure === 'server' ? new Response('{}', { status: 503 }) : new Response('{"data":{"role":"ADMIN"}}'))
  fetcher.mockResolvedValueOnce(user())
  vi.stubGlobal('fetch', fetcher)
  mount()
  await screen.findByRole('alert')
  expect(screen.queryByRole('heading', { name: 'Customer dashboard' })).not.toBeInTheDocument()
  expect(fetcher).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await screen.findByRole('heading', { name: 'Customer dashboard' })
})

it('does not restore a session after logout while verification is pending', async () => {
  sessionStorage.setItem(key, 'token')
  let resolve!: (response: Response) => void
  const fetcher = vi.fn<typeof fetch>().mockReturnValue(new Promise(done => { resolve = done }))
  vi.stubGlobal('fetch', fetcher)
  mount()
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  fireEvent.click(screen.getByRole('button', { name: 'End session' }))
  await act(async () => { resolve(user()) })
  expect(screen.getByRole('form', { name: 'Login' })).toBeVisible()
  expect(sessionStorage.getItem(key)).toBeNull()
  expect(fetcher.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
})

it('returns an anonymous visitor to the requested path after login', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { user: { id: 'u1', email: 'user@example.com', role: 'CUSTOMER' }, accessToken: 'token' } }))))
  mount()
  fireEvent.change(screen.getByLabelText(/^Email address/), { target: { value: 'user@example.com' } })
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'password' } })
  fireEvent.submit(screen.getByRole('form', { name: 'Login' }))
  await screen.findByRole('heading', { name: 'Customer dashboard' })
  expect(screen.getByLabelText('Path')).toHaveTextContent('/customer/requests?view=open#list')
})

it('keeps public discovery available without waiting for restoration', () => {
  sessionStorage.setItem(key, 'token')
  vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
  mount('/artisans')
  expect(screen.getByRole('heading', { name: 'Find an artisan' })).toBeVisible()
})

it('supports login when browser storage is unavailable', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('disabled') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('disabled') })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { user: { id: 'u1', email: 'user@example.com', role: 'CUSTOMER' }, accessToken: 'token' } }))))
  mount('/customer')
  fireEvent.change(screen.getByLabelText(/^Email address/), { target: { value: 'user@example.com' } })
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'password' } })
  fireEvent.submit(screen.getByRole('form', { name: 'Login' }))
  await screen.findByRole('heading', { name: 'Customer dashboard' })
})

it.each(['https://evil.test', '//evil.test', '/admin', '/customer/../admin', '/customer/%2e%2e/admin', '/customer\\evil', 'customer', null])('rejects unsafe or mismatched return target %s', value => {
  expect(safeReturnPath(value, 'CUSTOMER')).toBeNull()
})
