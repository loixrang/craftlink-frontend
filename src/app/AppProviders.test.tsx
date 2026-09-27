import { render, screen } from '@testing-library/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { AppProviders } from './AppProviders'
import { createQueryClient } from './queryClient'
import { ApiError } from '../services/api'

it('provides a stable query cache across rerenders', async () => {
  const queryFn = vi.fn().mockResolvedValue('Ready')
  const clients: unknown[] = []
  function Probe() {
    clients.push(useQueryClient())
    const query = useQuery({ queryKey: ['foundation-test'], queryFn })
    return <p>{query.data ?? 'Loading'}</p>
  }
  const view = render(<AppProviders><Probe /></AppProviders>)
  await screen.findByText('Ready')
  view.rerender(<AppProviders><Probe /></AppProviders>)
  expect(new Set(clients).size).toBe(1)
  expect(queryFn).toHaveBeenCalledTimes(1)
})

it('retries only transient API query failures with a bounded count, never mutations', () => {
  const client = createQueryClient()
  const defaults = client.getDefaultOptions()
  const retry = defaults.queries?.retry
  expect(typeof retry).toBe('function')
  if (typeof retry !== 'function') throw new Error('Missing retry policy')
  expect(retry(0, new ApiError('Unauthorized', 401, 'UNAUTHORIZED'))).toBe(false)
  expect(retry(0, new ApiError('Offline', 0, 'NETWORK_ERROR'))).toBe(true)
  expect(retry(1, new ApiError('Unavailable', 503, 'HTTP_ERROR'))).toBe(true)
  expect(retry(2, new ApiError('Unavailable', 503, 'HTTP_ERROR'))).toBe(false)
  expect(retry(0, new Error('Unexpected application error'))).toBe(false)
  expect(defaults.mutations?.retry).toBe(false)
  client.clear()
})
