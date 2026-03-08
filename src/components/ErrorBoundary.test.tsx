import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

let shouldThrow = false

function FlakyComponent() {
  if (shouldThrow) {
    throw new Error('Boom')
  }

  return <div>Recovered view</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = false
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Healthy child</div>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Healthy child')).toBeInTheDocument()
  })

  it('shows fallback UI when a child throws', () => {
    shouldThrow = true

    render(
      <ErrorBoundary>
        <FlakyComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByText('Boom')).toBeInTheDocument()
  })

  it('retries rendering children when Retry is clicked', async () => {
    const user = userEvent.setup()
    shouldThrow = true

    render(
      <ErrorBoundary>
        <FlakyComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Boom')).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(screen.getByText('Recovered view')).toBeInTheDocument()
  })
})
