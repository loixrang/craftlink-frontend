import { AppShell } from '../components/layout/AppShell'
import { AppRoutes } from '../routes/AppRoutes'

export function App() {
  return (
    <AppShell navigation={[{ label: 'Home', href: '/' }, { label: 'Find an artisan', href: '/artisans' }, { label: 'Log in', href: '/login' }, { label: 'Join Craftlink', href: '/register' }]}>
      <AppRoutes />
    </AppShell>
  )
}
