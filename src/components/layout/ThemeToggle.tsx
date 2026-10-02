import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const storageKey = 'craftlink-theme'
type Theme = 'light' | 'dark'

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    return
  }
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<Theme | null>(readStoredTheme)
  const [system, setSystem] = useState<Theme>(systemTheme)
  const resolved = preference ?? system

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystem(event.matches ? 'dark' : 'light')
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', preference === 'dark')
    root.classList.toggle('light', preference === 'light')
  }, [preference])

  function toggle() {
    const next: Theme = resolved === 'dark' ? 'light' : 'dark'
    storeTheme(next)
    setPreference(next)
  }

  return (
    <button type="button" onClick={toggle} aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex min-h-11 items-center justify-center rounded-control px-4 py-2 text-ink hover:bg-surface-muted">
      {resolved === 'dark' ? <Sun aria-hidden="true" size={20} /> : <Moon aria-hidden="true" size={20} />}
    </button>
  )
}
