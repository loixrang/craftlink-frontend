import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Input } from './Input'
import { EmptyState, ErrorState, LoadingState, SuccessState } from './Feedback'

describe('UI primitives', () => {
  it('prevents pending actions and defaults to a non-submit button', () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button pending onClick={onClick}>Saving…</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('type', 'button')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    rerender(<Button onClick={onClick}>Save</Button>)
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('associates unique inputs with labels, hints and validation errors', () => {
    render(<><p id="context">Public profile</p><Input label="Name" hint="Use your display name." error="Enter a name." aria-describedby="context" required /><Input label="City" disabled /></>)
    const name = screen.getByRole('textbox', { name: 'Name' })
    expect(name).toBeRequired()
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('Public profile Use your display name. Enter a name.')
    const city = screen.getByRole('textbox', { name: 'City' })
    expect(city).toBeDisabled()
    expect(city.id).not.toBe(name.id)
  })

  it('announces loading, failure and success and supports retry', () => {
    const onRetry = vi.fn()
    const { rerender } = render(<LoadingState label="Loading requests…" />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading requests…')
    rerender(<ErrorState title="Could not load requests" description="Please try again." onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load requests')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
    rerender(<SuccessState title="Changes saved" />)
    expect(screen.getByRole('status')).toHaveTextContent('Changes saved')
  })

  it('supports useful empty-state content and an optional action', () => {
    render(<EmptyState title="No results" description="Adjust your filters."><Button>Clear filters</Button></EmptyState>)
    expect(screen.getByText('No results')).toBeVisible()
    expect(screen.getByText('Adjust your filters.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeEnabled()
  })
})
