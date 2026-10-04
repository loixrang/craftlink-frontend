import type { ComponentPropsWithRef } from 'react'

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'quiet'
  pending?: boolean
}

const variants = {
  primary: 'bg-accent text-on-accent shadow-action hover:bg-accent-hover hover:-translate-y-px',
  secondary: 'border border-line bg-surface-muted text-ink hover:bg-line/60',
  quiet: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
}

export function Button({ variant = 'primary', pending = false, disabled, type = 'button', className = '', children, ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || pending} aria-busy={pending || undefined}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}
