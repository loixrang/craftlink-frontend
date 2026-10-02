import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../app/authContext'
import { Badge } from '../components/ui/Badge'

export function CustomerAccountPage() {
  const { session } = useAuth()

  return <section className="mx-auto max-w-3xl space-y-8" aria-labelledby="account-title">
    <Link className="inline-flex min-h-11 items-center" to="/customer">Back to dashboard</Link>
    <header>
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.04em] text-accent-text"><ShieldCheck size={18} aria-hidden="true" />Account</p>
      <h1 id="account-title" className="text-3xl sm:text-headline">Your account</h1>
      <p className="mt-4 max-w-2xl text-ink-muted">Review the account details Craftlink uses to identify you.</p>
    </header>

    <dl className="divide-y divide-line rounded-panel border border-line bg-surface px-5 shadow-card sm:px-6">
      <div className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
        <dt className="text-sm text-ink-muted">Email address</dt>
        <dd className="break-all font-medium">{session?.user.email}</dd>
      </div>
      <div className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
        <dt className="text-sm text-ink-muted">Account type</dt>
        <dd><Badge>Customer</Badge></dd>
      </div>
    </dl>

    <aside className="rounded-panel border border-line bg-surface-muted p-5 sm:p-6" aria-label="Profile editing information">
      <h2 className="text-lg">Profile editing</h2>
      <p className="mt-2 text-sm text-ink-muted">Email and profile changes are not available yet. Your account details are verified when you sign in.</p>
    </aside>
  </section>
}
