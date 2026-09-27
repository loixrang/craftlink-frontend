import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../app/AppProviders'
import { RegisterPage } from './RegisterPage'
import { registrationSchema } from '../schemas/registration'

afterEach(() => vi.unstubAllGlobals())

function setup() {
  const fetcher = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetcher)
  render(<AppProviders><MemoryRouter><RegisterPage /></MemoryRouter></AppProviders>)
  return fetcher
}

function fill() {
  fireEvent.change(screen.getByLabelText('Email address', { exact: false }), { target: { value: 'customer@example.com' } })
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: ' a strong password ' } })
  fireEvent.change(screen.getByLabelText(/^Confirm password/), { target: { value: ' a strong password ' } })
}

function submit() { fireEvent.submit(screen.getByRole('form', { name: 'Registration' })) }

describe('registration', () => {
  it('validates email, required passwords and password confirmation without a request', async () => {
    const fetcher = setup()
    submit()
    expect(await screen.findByText('Enter a valid email address.')).toBeVisible()
    expect(screen.getByText('Enter a password.')).toBeVisible()
    expect(screen.getByText('Confirm your password.')).toBeVisible()
    expect(screen.getByLabelText(/^Email address/)).toHaveFocus()
    fill()
    fireEvent.change(screen.getByLabelText(/^Confirm password/), { target: { value: 'different' } })
    submit()
    expect(await screen.findByText('Passwords must match.')).toBeVisible()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each(['CUSTOMER', 'ARTISAN'] as const)('submits the exact %s contract payload and shows success', async role => {
    const fetcher = setup()
    fetcher.mockResolvedValue(new Response(JSON.stringify({ data: { user: { id: 'u1', role }, accessToken: 'private-token' } }), { status: 201 }))
    fill()
    if (role === 'ARTISAN') fireEvent.click(screen.getByRole('radio', { name: /As an artisan/ }))
    submit()
    expect(await screen.findByText('Your account is ready')).toBeVisible()
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [url, options] = fetcher.mock.calls[0]!
    expect(url).toBe('/api/v1/auth/register')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(String(options?.body))).toEqual({ email: 'customer@example.com', password: ' a strong password ', role })
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue to log in' })).toHaveAttribute('href', '/login')
    expect(document.body).not.toHaveTextContent('private-token')
  })

  it('prevents duplicate submissions while pending', async () => {
    const fetcher = setup()
    let resolveResponse!: (value: Response) => void
    fetcher.mockReturnValue(new Promise(resolve => { resolveResponse = resolve }))
    fill()
    submit()
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Creating your account…' })).toBeDisabled()
    submit()
    resolveResponse(new Response(JSON.stringify({ data: {} }), { status: 201 }))
    await screen.findByText('Your account is ready')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it.each([
    [409, 'Conflict', 'An account with this email already exists.'],
    [422, 'Password does not meet requirements.', 'Password does not meet requirements.'],
    [429, 'Limit reached', 'Too many attempts.'],
    [503, 'Unavailable', 'Craftlink is temporarily unavailable.'],
    [0, 'Network', 'Unable to reach Craftlink.'],
  ])('handles %s errors and allows a corrected retry', async (status, message, expected) => {
    const fetcher = setup()
    if (status === 0) fetcher.mockRejectedValueOnce(new TypeError('Network'))
    else fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'ERROR', message } }), { status }))
    fill()
    submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(expected)
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()
    expect(fetcher).toHaveBeenCalledTimes(1)
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ data: {} }), { status: 201 }))
    submit()
    await screen.findByText('Your account is ready')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('rejects public ADMIN registration and trims only the email', () => {
    const values = { email: ' test@example.com ', password: ' password ', confirmPassword: ' password ', role: 'CUSTOMER' }
    expect(registrationSchema.parse(values)).toEqual({ ...values, email: 'test@example.com' })
    expect(registrationSchema.safeParse({ ...values, role: 'ADMIN' }).success).toBe(false)
  })
})
