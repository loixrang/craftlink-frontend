import type { HTMLAttributes } from 'react'

type VerifiedBadgeProps = HTMLAttributes<HTMLSpanElement> & { verified: boolean }

export function VerifiedBadge({ verified, className = '', ...props }: VerifiedBadgeProps) {
  if (!verified) return null
  return (
    <span {...props} className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-success">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      Verified pro
    </span>
  )
}