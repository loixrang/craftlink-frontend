import { CircleAlert, CircleCheck, Inbox, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

type FeedbackProps = { title: string; description?: string; children?: ReactNode }

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div role="status" className="flex items-center gap-3 py-8 text-ink-muted"><LoaderCircle aria-hidden="true" size={20} /><span>{label}</span></div>
}

export function ErrorState({ title, description, onRetry }: Omit<FeedbackProps, 'children'> & { onRetry?: () => void }) {
  return (
    <div className="space-y-4 border-l-4 border-accent bg-surface-muted p-5">
      <div role="alert">
        <p className="flex items-center gap-2 font-semibold"><CircleAlert aria-hidden="true" size={20} />{title}</p>
        {description && <p className="mt-2 text-sm text-ink-muted">{description}</p>}
      </div>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function EmptyState({ title, description, children }: FeedbackProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <Inbox aria-hidden="true" size={28} className="text-ink-muted" />
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="max-w-prose text-sm text-ink-muted">{description}</p>}
      {children}
    </div>
  )
}

export function SuccessState({ title, description }: Omit<FeedbackProps, 'children'>) {
  return <div role="status" className="space-y-2 bg-surface-muted p-4"><p className="flex items-center gap-2 font-semibold"><CircleCheck aria-hidden="true" size={20} />{title}</p>{description && <p className="text-sm text-ink-muted">{description}</p>}</div>
}
