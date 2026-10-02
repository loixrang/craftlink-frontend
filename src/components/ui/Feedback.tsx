import { CircleAlert, CircleCheck, Inbox, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

type FeedbackProps = { title: string; description?: string; children?: ReactNode }

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div role="status" className="flex items-center gap-3 py-8 text-sm text-ink-muted"><LoaderCircle aria-hidden="true" size={20} className="animate-spin text-accent" /><span>{label}</span></div>
}

export function ErrorState({ title, description, onRetry }: Omit<FeedbackProps, 'children'> & { onRetry?: () => void }) {
  return (
    <div className="space-y-4 rounded-panel border border-danger/40 bg-danger/10 p-5">
      <div role="alert">
        <p className="flex items-center gap-2 font-semibold"><CircleAlert aria-hidden="true" size={20} className="text-danger" />{title}</p>
        {description && <p className="mt-2 text-sm text-ink-muted">{description}</p>}
      </div>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function EmptyState({ title, description, children }: FeedbackProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel border border-line bg-surface-muted px-6 py-10 text-center">
      <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-soft-ink"><Inbox size={22} /></span>
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="max-w-prose text-sm text-ink-muted">{description}</p>}
      {children}
    </div>
  )
}

export function SuccessState({ title, description }: Omit<FeedbackProps, 'children'>) {
  return <div role="status" className="space-y-2 rounded-panel border border-success/40 bg-success/10 p-5"><p className="flex items-center gap-2 font-semibold"><CircleCheck aria-hidden="true" size={20} className="text-success" />{title}</p>{description && <p className="text-sm text-ink-muted">{description}</p>}</div>
}