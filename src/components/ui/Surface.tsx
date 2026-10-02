import type { HTMLAttributes } from 'react'

export function Surface({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`rounded-panel border border-line bg-surface p-5 shadow-card sm:p-6 ${className}`} />
}