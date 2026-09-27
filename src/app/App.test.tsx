import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('application bootstrap', () => {
  it('renders the foundation shell in the main landmark', () => {
    render(<App />)
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Craftlink' })).toBeVisible()
    expect(within(main).getByText('The frontend foundation is ready.')).toBeVisible()
  })
})
