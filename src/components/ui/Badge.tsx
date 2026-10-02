import type { HTMLAttributes } from 'react'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'accent' }

export function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return <span {...props} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.02em] ${tone === 'accent' ? 'bg-accent-soft text-accent-soft-ink' : 'bg-surface-muted text-ink-muted'} ${className}`} />
}