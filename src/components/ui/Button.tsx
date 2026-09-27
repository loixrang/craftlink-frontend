import type { ComponentPropsWithRef } from 'react'

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'quiet'
  pending?: boolean
}

const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border border-control-border bg-surface text-ink hover:bg-surface-muted',
  quiet: 'text-ink hover:bg-surface-muted',
}

export function Button({ variant = 'primary', pending = false, disabled, type = 'button', className = '', children, ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || pending} aria-busy={pending || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}
