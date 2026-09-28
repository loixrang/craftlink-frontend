import { useState, type ReactNode } from 'react'
import { QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { createQueryClient } from './queryClient'
import { AuthContext } from './authContext'
import type { AuthSession } from '../services/login'
import { ApiError } from '../services/api'
import { getCurrentUser, readSessionToken, storeSessionToken } from '../services/session'

function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(readSessionToken)
  const [signedIn, setSignedIn] = useState<AuthSession | null>(null)
  const [generation, setGeneration] = useState(0)
  const currentUser = useQuery({
    queryKey: ['auth', 'current-user', generation],
    queryFn: async ({ signal }) => {
      try { return await getCurrentUser(token!, signal) } catch (error) {
        if (!signal.aborted && error instanceof ApiError && [401, 403].includes(error.status)) storeSessionToken(null)
        throw error
      }
    },
    enabled: !!token && !signedIn,
    retry: false, staleTime: Infinity, gcTime: 0,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
  })
  const rejected = currentUser.error instanceof ApiError && [401, 403].includes(currentUser.error.status)
  const session = signedIn ?? (token && currentUser.data ? { accessToken: token, user: currentUser.data } : null)
  const status = session ? 'authenticated' : !token || rejected ? 'anonymous' : currentUser.isFetching ? 'restoring' : currentUser.isError ? 'error' : 'restoring'
  function signIn(next: AuthSession) {
    queryClient.clear()
    setGeneration(value => value + 1)
    storeSessionToken(next.accessToken)
    setToken(next.accessToken)
    setSignedIn(next)
  }
  function signOut() {
    queryClient.clear()
    setGeneration(value => value + 1)
    storeSessionToken(null)
    setToken(null)
    setSignedIn(null)
  }
  return <AuthContext.Provider value={{ session, status, retry: () => { void currentUser.refetch() }, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  return <QueryClientProvider client={queryClient}><AuthProvider>{children}</AuthProvider></QueryClientProvider>
}
