import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../services/api'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => failureCount < 2 && error instanceof ApiError &&
          (error.code === 'NETWORK_ERROR' || error.status >= 500),
      },
      mutations: { retry: false },
    },
  })
}
