import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { roleHome, useAuth } from '../app/authContext'
import { Button } from '../components/ui/Button'
import { ErrorState, LoadingState } from '../components/ui/Feedback'

export function SessionGate({ children }: { children: ReactNode }) {
  const { status, retry, signOut } = useAuth()
  if (status === 'restoring') return <LoadingState label="Restoring your session…" />
  if (status === 'error') return <div className="space-y-4"><h1 className="text-3xl">Verify your session</h1><ErrorState title="We couldn’t restore your session" description="Check your connection and try again, or sign out to use another account." onRetry={retry} /><Button onClick={signOut}>Sign out</Button></div>
  return children
}

export function RequireRole({ role, children }: { role: keyof typeof roleHome; children: ReactNode }) {
  const { session, status } = useAuth()
  const location = useLocation()
  if (status === 'restoring' || status === 'error') return <SessionGate>{null}</SessionGate>
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />
  if (session.user.role !== role) return <><h1 className="text-3xl">Access unavailable</h1><p className="mt-4 text-ink-muted">This page is for a different account role.</p><Link className="mt-6 inline-flex min-h-11 items-center" to={roleHome[session.user.role]}>Go to your dashboard</Link></>
  return children
}
