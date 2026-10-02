import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

function mockSystemTheme(dark: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })))
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('light', 'dark')
})

describe('ThemeToggle', () => {
  it('uses the system theme by default and persists an explicit choice', () => {
    mockSystemTheme(false)
    render(<ThemeToggle />)

    const toggle = screen.getByRole('button', { name: 'Switch to dark theme' })
    fireEvent.click(toggle)

    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('craftlink-theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })

  it('restores a stored preference over the system theme', () => {
    mockSystemTheme(true)
    localStorage.setItem('craftlink-theme', 'light')
    render(<ThemeToggle />)

    expect(document.documentElement).toHaveClass('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })
})
