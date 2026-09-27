import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { AppProviders } from './AppProviders'
import { MemoryRouter } from 'react-router-dom'

function renderApp(path = '/') {
  return render(<AppProviders><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></AppProviders>)
}

describe('application bootstrap', () => {
  it('renders the landing page in the main landmark', () => {
    renderApp()
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Find the right hands for the job.' })).toBeVisible()
  })

  it('provides shell landmarks, a skip target and current navigation', () => {
    renderApp()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('toggles navigation and returns focus to its trigger on Escape', () => {
    renderApp()
    const toggle = screen.getByRole('button', { name: 'Menu' })
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', navigation.id)
    expect(navigation).toHaveClass('hidden')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    screen.getByRole('link', { name: 'Home' }).focus()
    fireEvent.keyDown(navigation, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
    fireEvent.click(toggle)
    fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it.each([
    ['/login', 'Log in'], ['/register', 'Create an account'],
    ['/artisans', 'Find an artisan'], ['/artisans/artisan-123', 'Artisan profile'],
    ['/customer/requests', 'Customer dashboard'], ['/artisan/services', 'Artisan dashboard'],
    ['/admin/users', 'Admin dashboard'], ['/missing', 'Page not found'],
  ])('renders the route at %s', (path, title) => {
    renderApp(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeVisible()
  })

  it('navigates within the shell and updates active navigation', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    fireEvent.click(screen.getByRole('link', { name: 'Find an artisan' }))
    expect(screen.getByRole('heading', { name: 'Find an artisan' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Find an artisan' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('returns home from an unknown route', () => {
    renderApp('/missing')
    fireEvent.click(screen.getByRole('link', { name: 'Return home' }))
    expect(screen.getByRole('heading', { name: 'Find the right hands for the job.' })).toBeVisible()
  })
})
