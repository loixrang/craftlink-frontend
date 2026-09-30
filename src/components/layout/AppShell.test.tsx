import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'

function ShellRoutes() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <AppShell navigation={[{ label: 'Home', href: '/' }, { label: 'Destination', href: '/destination' }]}>
        <Routes>
          <Route path="/" element={<h1>Home page</h1>} />
          <Route path="/destination" element={<h1>Destination page</h1>} />
        </Routes>
      </AppShell>
    </MemoryRouter>
  )
}

describe('AppShell navigation', () => {
  it('provides a skip link to the main landmark', () => {
    render(<ShellRoutes />)

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
  })

  it('moves focus to main content after a route change', async () => {
    render(<ShellRoutes />)

    fireEvent.click(screen.getByRole('link', { name: 'Destination' }))

    expect(await screen.findByRole('heading', { name: 'Destination page' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus())
  })

  it('closes an open mobile menu after navigation', async () => {
    render(<ShellRoutes />)
    const trigger = screen.getByRole('button', { name: 'Menu' })

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('link', { name: 'Destination' }))

    expect(await screen.findByRole('heading', { name: 'Destination page' })).toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('closes the mobile menu on Escape and returns focus to its trigger', () => {
    render(<ShellRoutes />)
    const trigger = screen.getByRole('button', { name: 'Menu' })

    fireEvent.click(trigger)
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(navigation, { key: 'Escape' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('marks the current navigation link', () => {
    render(<ShellRoutes />)

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })
})
