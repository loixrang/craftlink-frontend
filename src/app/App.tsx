import { AppShell } from '../components/layout/AppShell'

export function App() {
  return (
    <AppShell navigation={[{ label: 'Home', href: '/', current: true }]}>
      <h1 className="text-3xl tracking-tight sm:text-4xl">Craftlink</h1>
      <p className="mt-4 text-base text-ink-muted">The frontend foundation is ready.</p>
    </AppShell>
  )
}
