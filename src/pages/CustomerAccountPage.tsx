import { Link } from 'react-router-dom'
import { useAuth } from '../app/authContext'
import { Badge } from '../components/ui/Badge'

export function CustomerAccountPage() {
  const { session } = useAuth()

  return <section className="mx-auto max-w-3xl space-y-8" aria-labelledby="account-title">
    <Link className="inline-flex min-h-11 items-center" to="/customer">Back to dashboard</Link>
    <header>
      <p className="text-sm font-semibold text-accent">Account</p>
      <h1 id="account-title" className="mt-2 text-3xl tracking-tight sm:text-4xl">Your account</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">Review the account details Craftlink uses to identify you.</p>
    </header>

    <dl className="divide-y divide-line border-y border-line">
      <div className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
        <dt className="text-sm text-ink-muted">Email address</dt>
        <dd className="break-all font-medium">{session?.user.email}</dd>
      </div>
      <div className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
        <dt className="text-sm text-ink-muted">Account type</dt>
        <dd><Badge>Customer</Badge></dd>
      </div>
    </dl>

    <aside className="border-l-2 border-accent pl-4" aria-label="Profile editing information">
      <h2 className="font-semibold">Profile editing</h2>
      <p className="mt-2 text-sm text-ink-muted">Email and profile changes are not available yet. Your account details are verified when you sign in.</p>
    </aside>
  </section>
}
