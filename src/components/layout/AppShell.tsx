import { useId, useRef, useState, type ReactNode } from 'react'
import { Menu, Wrench, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Link, NavLink } from 'react-router-dom'

type NavigationItem = { label: string; href: string }
type AppShellProps = { children: ReactNode; navigation: readonly NavigationItem[]; onSignOut?: () => void }

export function AppShell({ children, navigation, onSignOut }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigationId = useId()
  const menuButton = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-3">Skip to content</a>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" onClick={() => setMenuOpen(false)} aria-label="Craftlink home" className="inline-flex min-h-11 items-center gap-2 text-xl font-semibold tracking-tight text-ink no-underline"><Wrench aria-hidden="true" size={23} className="text-accent" />Craftlink</Link>
          <Button ref={menuButton} variant="secondary" className="md:hidden" aria-expanded={menuOpen} aria-controls={navigationId} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}Menu
          </Button>
          <nav id={navigationId} aria-label="Main navigation" className={`${menuOpen ? 'block' : 'hidden'} w-full md:flex md:w-auto md:items-center md:gap-2`}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && menuOpen) {
                setMenuOpen(false)
                menuButton.current?.focus()
              }
            }}>
            <ul className="flex flex-col gap-2 md:flex-row md:items-center">
              {navigation.map(({ label, href }) => <li key={href}><NavLink to={href} end={href === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex min-h-11 items-center rounded-control px-4 py-2 text-sm font-medium no-underline ${isActive ? 'bg-accent-soft text-accent-hover' : 'text-ink hover:bg-surface-muted'}`}>{label}</NavLink></li>)}
            </ul>
            {onSignOut && <Button variant="quiet" onClick={() => { setMenuOpen(false); onSignOut() }}>Sign out</Button>}
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-content flex-1 px-4 py-10 sm:px-6 sm:py-16">{children}</main>
      <footer className="border-t border-line px-4 py-6 sm:px-6"><div className="mx-auto flex max-w-content flex-col gap-2 text-sm text-ink-muted sm:flex-row sm:justify-between"><span className="font-semibold text-ink">Craftlink</span><p>Connecting customers with skilled artisans.</p></div></footer>
    </div>
  )
}
