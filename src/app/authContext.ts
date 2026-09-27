import { createContext, useContext } from 'react'
import type { AuthSession } from '../services/login'

export const AuthContext = createContext<{
  session: AuthSession | null
  signIn: (session: AuthSession) => void
  signOut: () => void
} | null>(null)

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth requires AppProviders.')
  return auth
}
