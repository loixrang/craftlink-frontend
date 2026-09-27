import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('application bootstrap', () => {
  it('renders the foundation shell in the main landmark', () => {
    render(<App />)
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Craftlink' })).toBeVisible()
    expect(within(main).getByText('The frontend foundation is ready.')).toBeVisible()
  })

  it('provides shell landmarks, a skip target and current navigation', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('toggles navigation and returns focus to its trigger on Escape', () => {
    render(<App />)
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
})
