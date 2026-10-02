import { useId, type ComponentPropsWithRef } from 'react'

type InputProps = ComponentPropsWithRef<'input'> & {
  label: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, id, className = '', 'aria-describedby': describedBy, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const description = [describedBy, hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className="grid min-w-0 gap-2">
      <label htmlFor={inputId} className="text-sm font-semibold">{label}{props.required && <span aria-hidden="true"> *</span>}</label>
      {hint && <p id={`${inputId}-hint`} className="text-sm text-ink-muted">{hint}</p>}
      <input {...props} id={inputId} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={description}
        className={`min-h-12 w-full min-w-0 rounded-control border border-control-border bg-surface px-3 py-2 text-ink transition-colors placeholder:text-ink-muted focus:border-accent aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted ${className}`} />
      {error && <p id={`${inputId}-error`} className="text-sm font-medium text-danger">{error}</p>}
    </div>
  )
}