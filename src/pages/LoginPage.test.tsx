import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../app/AppProviders'
import { useAuth } from '../app/authContext'
import { App } from '../app/App'

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

function Probe() {
  const { session } = useAuth()
  const client = useQueryClient()
  return <><output aria-label="Session role">{session?.user.role ?? 'anonymous'}</output>
    <button onClick={() => client.setQueryData(['private'], 'private data')}>Seed cache</button>
    <button onClick={() => { expect(client.getQueryData(['private'])).toBeUndefined() }}>Check cache</button>
    <button onClick={() => {
      for (const mutation of client.getMutationCache().getAll()) {
        expect(mutation.state.variables).toBeUndefined()
        expect(mutation.state.data).toBeUndefined()
      }
    }}>Check mutations</button></>
}
function setup() {
  const fetcher = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetcher)
  const view = render(<AppProviders><MemoryRouter initialEntries={['/login']}><App /><Probe /></MemoryRouter></AppProviders>)
  return { fetcher, ...view }
}
function fill() {
  fireEvent.change(screen.getByLabelText(/^Email address/), { target: { value: ' user@example.com ' } })
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: ' password ' } })
}
function submit() { fireEvent.submit(screen.getByRole('form', { name: 'Login' })) }
function success(role = 'CUSTOMER') {
  return new Response(JSON.stringify({ data: { user: { id: 'u1', email: 'user@example.com', role }, accessToken: 'private-token' } }))
}

describe('login and authenticated state', () => {
  it('validates required fields and focuses email without requesting', async () => {
    const { fetcher } = setup()
    submit()
    expect(await screen.findByText('Enter a valid email address.')).toBeVisible()
    expect(screen.getByText('Enter your password.')).toBeVisible()
    expect(screen.getByLabelText(/^Email address/)).toHaveFocus()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each(['CUSTOMER', 'ARTISAN', 'ADMIN'])('authenticates %s, retains state on navigation and signs out', async role => {
    const storage = vi.spyOn(Storage.prototype, 'setItem')
    const { fetcher } = setup()
    fetcher.mockResolvedValueOnce(success(role))
    fill(); submit()
    await screen.findByText('You’re signed in')
    expect(screen.getByLabelText('Session role')).toHaveTextContent(role)
    const [url, options] = fetcher.mock.calls[0]!
    expect(url).toBe('/api/v1/auth/login')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(String(options?.body))).toEqual({ email: 'user@example.com', password: ' password ' })
    expect(storage).not.toHaveBeenCalled()
    expect(document.body).not.toHaveTextContent('private-token')
    fireEvent.click(screen.getByRole('button', { name: 'Check mutations' }))
    fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    fireEvent.click(screen.getByRole('link', { name: 'Log in' }))
    expect(screen.getByText('You’re signed in')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Seed cache' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(screen.getByLabelText('Session role')).toHaveTextContent('anonymous')
    expect(screen.getByLabelText(/^Password/)).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: 'Check cache' }))
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('prevents duplicate pending requests and does not cache credentials', async () => {
    const { fetcher } = setup()
    let resolve!: (response: Response) => void
    fetcher.mockReturnValue(new Promise(done => { resolve = done }))
    fill(); submit()
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Check mutations' }))
    submit()
    resolve(success())
    await screen.findByText('You’re signed in')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it.each([
    [401, 'Email or password is incorrect.'], [403, 'Unable to sign in to this account.'],
    [422, 'Check your input.'], [429, 'Too many attempts.'],
    [503, 'Craftlink is temporarily unavailable.'], [0, 'Unable to reach Craftlink.'],
  ])('handles %s without retrying automatically and permits correction', async (status, message) => {
    const { fetcher } = setup()
    if (status === 0) fetcher.mockRejectedValueOnce(new TypeError('Network'))
    else fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'ERROR', message: 'Check your input.' } }), { status }))
    fill(); submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByLabelText('Session role')).toHaveTextContent('anonymous')
    expect(fetcher).toHaveBeenCalledTimes(1)
    fetcher.mockResolvedValueOnce(success())
    submit()
    await screen.findByText('You’re signed in')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it.each([{}, { user: { id: 'u1', email: 'user@example.com', role: 'OWNER' }, accessToken: 'token' },
    { user: { id: 'u1', email: 'user@example.com', role: 'CUSTOMER' }, accessToken: '' },
  ])('rejects malformed successful login responses', async data => {
    const { fetcher } = setup()
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ data })))
    fill(); submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('unexpected login response')
    expect(screen.getByLabelText('Session role')).toHaveTextContent('anonymous')
  })

  it('starts anonymous after the application is remounted', async () => {
    const { fetcher, unmount } = setup()
    fetcher.mockResolvedValueOnce(success())
    fill(); submit()
    await screen.findByText('You’re signed in')
    unmount()
    setup()
    expect(screen.getByLabelText('Session role')).toHaveTextContent('anonymous')
    expect(screen.getByRole('form', { name: 'Login' })).toBeVisible()
  })
})
