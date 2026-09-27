import type { HTMLAttributes } from 'react'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'accent' }

export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return <span {...props} className={`inline-flex items-center gap-1 rounded-control px-2 py-1 text-xs font-semibold ${tone === 'accent' ? 'bg-accent-soft text-accent-hover' : 'bg-surface-muted text-ink-muted'} ${className}`} />
}
