import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Menu, Wrench, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { ThemeToggle } from './ThemeToggle'
import { Link, NavLink, useLocation } from 'react-router-dom'

type NavigationItem = { label: string; href: string }
type AppShellProps = { children: ReactNode; navigation: readonly NavigationItem[]; onSignOut?: () => void }

export function AppShell({ children, navigation, onSignOut }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigationId = useId()
  const menuButton = useRef<HTMLButtonElement>(null)
  const mainContent = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)

  useEffect(() => {
    if (previousPath.current !== pathname) {
      setMenuOpen(false)
      mainContent.current?.focus()
      previousPath.current = pathname
    }
  }, [pathname])

  const linkClass = ({ isActive }: { isActive: boolean }) => `flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors ${isActive ? 'bg-surface text-accent-text shadow-card' : 'text-ink-muted hover:bg-surface hover:text-ink'}`

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-3">Skip to content</a>
      <header className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur-xl">
        <div className="relative">
          <div className="mx-auto flex min-h-20 w-full max-w-content items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <Link to="/" onClick={() => setMenuOpen(false)} aria-label="Craftlink home" className="inline-flex min-h-11 min-w-0 items-center gap-2 text-xl font-bold tracking-tight text-accent-text no-underline">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent"><Wrench size={20} /></span>Craftlink
            </Link>
            <Button ref={menuButton} variant="secondary" className="shrink-0 lg:hidden" aria-expanded={menuOpen} aria-controls={navigationId} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}Menu
            </Button>
            <nav id={navigationId} aria-label="Main navigation" className={`${menuOpen ? 'flex' : 'hidden'} absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-5rem)] flex-col gap-3 overflow-y-auto overscroll-contain border-b border-line bg-surface px-4 py-4 shadow-float lg:static lg:max-h-none lg:flex lg:flex-row lg:items-center lg:gap-3 lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && menuOpen) {
                  setMenuOpen(false)
                  menuButton.current?.focus()
                }
              }}>
              <ul className="flex flex-col gap-1 rounded-panel bg-surface-muted p-1 lg:flex-row lg:items-center lg:gap-0.5">
                {navigation.map(({ label, href }) => <li key={href}><NavLink to={href} end={href === '/'} onClick={() => setMenuOpen(false)} className={linkClass}>{label}</NavLink></li>)}
              </ul>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {onSignOut && <Button variant="quiet" onClick={() => { setMenuOpen(false); onSignOut() }}>Sign out</Button>}
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main ref={mainContent} id="main-content" tabIndex={-1} className="mx-auto w-full max-w-content flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">{children}</main>
      <footer className="border-t border-line bg-surface-muted">
        <div className="mx-auto w-full max-w-content px-4 py-12 sm:px-6 lg:px-10">
          <div className="max-w-md">
            <p className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-accent-text">
              <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-control bg-accent-soft text-accent"><Wrench size={18} /></span>Craftlink
            </p>
            <p className="mt-4 text-sm text-ink-muted">Connecting customers with skilled artisans across Akwa Ibom, from everyday repairs to bespoke work.</p>
          </div>
          <p className="mt-10 border-t border-line pt-6 text-sm text-ink-muted">Craftlink · Dedicated to genuine craftsmanship and local mastery.</p>
        </div>
      </footer>
    </div>
  )
}