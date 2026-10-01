import { AppShell } from '../components/layout/AppShell'
import { AppRoutes } from '../routes/AppRoutes'
import { roleHome, useAuth } from './authContext'

export function App() {
  const { session, status, signOut } = useAuth()
  const navigation = [{ label: 'Home', href: '/' }, { label: 'Find an artisan', href: '/artisans' }]
  if (session) {
    navigation.push({ label: `${session.user.role === 'CUSTOMER' ? 'Customer' : session.user.role === 'ARTISAN' ? 'Artisan' : 'Admin'} dashboard`, href: roleHome[session.user.role] })
    if (session.user.role === 'CUSTOMER') navigation.push({ label: 'Account', href: '/customer/account' })
  }
  else if (status === 'anonymous') navigation.push({ label: 'Log in', href: '/login' }, { label: 'Join Craftlink', href: '/register' })
  return (
    <AppShell navigation={navigation} onSignOut={session ? signOut : undefined}>
      <AppRoutes />
    </AppShell>
  )
}
