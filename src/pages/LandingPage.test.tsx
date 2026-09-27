import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { App } from '../app/App'

function Location() {
  const location = useLocation()
  return <output aria-label="Current route">{location.pathname}{location.search}</output>
}

function renderLanding() {
  render(<MemoryRouter><App /><Location /></MemoryRouter>)
}

describe('public landing page', () => {
  it('has a single main heading and an in-page services destination', () => {
    renderLanding()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const services = screen.getByRole('region', { name: 'Skills for the everyday and beyond' })
    expect(screen.getByRole('link', { name: 'Explore services' })).toHaveAttribute('href', `#${services.id}`)
    expect(within(services).getAllByRole('listitem')).toHaveLength(8)
    expect(screen.getByRole('region', { name: 'From an idea to a conversation' })).toBeVisible()
  })

  it.each(['Explore artisans', 'Explore all artisans'])('routes %s to discovery', (name) => {
    renderLanding()
    fireEvent.click(screen.getByRole('link', { name }))
    expect(screen.getByLabelText('Current route')).toHaveTextContent(/^\/artisans$/)
    expect(screen.getByRole('heading', { name: 'Find an artisan' })).toBeVisible()
  })

  it('preserves each category as a search intent without inventing category IDs', () => {
    renderLanding()
    const services = screen.getByRole('region', { name: 'Skills for the everyday and beyond' })
    const links = within(services).getAllByRole('listitem').map(item => within(item).getByRole('link'))
    for (const link of links) {
      const url = new URL(link.getAttribute('href') ?? '', 'https://craftlink.example')
      expect(url.pathname).toBe('/artisans')
      expect(url.searchParams.get('q')).toBe(link.textContent)
      expect(url.searchParams.has('categoryId')).toBe(false)
    }
    fireEvent.click(screen.getByRole('link', { name: 'Tailoring/Fashion Design' }))
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/artisans?q=Tailoring%2FFashion%20Design')
  })

  it('routes the artisan call to action to registration', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('link', { name: 'Join as an artisan' }))
    expect(screen.getByRole('heading', { name: 'Create an account' })).toBeVisible()
  })
})
