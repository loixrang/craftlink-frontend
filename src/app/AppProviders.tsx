import { useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from './queryClient'
import { AuthContext } from './authContext'
import type { AuthSession } from '../services/login'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  const [session, setSession] = useState<AuthSession | null>(null)
  function signIn(next: AuthSession) {
    queryClient.clear()
    setSession(next)
  }
  function signOut() {
    setSession(null)
    queryClient.clear()
  }
  return <QueryClientProvider client={queryClient}><AuthContext.Provider value={{ session, signIn, signOut }}>{children}</AuthContext.Provider></QueryClientProvider>
}
