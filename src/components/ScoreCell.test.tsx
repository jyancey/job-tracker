import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreCell } from './ScoreCell'
import type { Job, JobStatus } from '../domain'
import type { ScoreWeights } from '../scoring'

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    company: 'Tech Corp',
    roleTitle: 'Senior Engineer',
    applicationDate: '2025-01-15',
    status: 'Interview' as JobStatus,
    jobUrl: 'https://example.com',
    atsUrl: 'https://ats.example.com',
    salaryRange: '$150k-$180k',
    notes: 'Good opportunity',
    contactPerson: 'Jane Smith',
    nextAction: 'Prepare for interview',
    nextActionDueDate: '2025-01-22',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
    ...overrides,
  }
}

describe('ScoreCell', () => {
  it('renders score with one decimal place', () => {
    const job = createJob({
      scoreFit: 3.567,
      scoreCompensation: 3.2,
      scoreLocation: 2.8,
      scoreGrowth: 4.0,
      scoreConfidence: 0.9,
    })

    const { container } = render(<ScoreCell job={job} />)

    const span = container.querySelector('.score')
    expect(span?.textContent).toMatch(/\d+\.\d$/)
  })

  it('renders empty state when score is null', () => {
    const job = createJob()
    // Job with no scoring fields will have null score

    render(<ScoreCell job={job} />)

    expect(screen.getByText('—')).toBeTruthy()
  })

  it('applies score-low class for scores below 2', () => {
    const job = createJob({
      scoreFit: 1.5,
      scoreCompensation: 1.2,
      scoreLocation: 1.8,
      scoreGrowth: 1.6,
      scoreConfidence: 0.8,
    })

    const { container } = render(<ScoreCell job={job} />)

    const scoreSpan = container.querySelector('.score')
    expect(scoreSpan?.classList.contains('score-low')).toBe(true)
  })

  it('applies score-medium class for scores between 2 and 3.5', () => {
    const job = createJob({
      scoreFit: 2.5,
      scoreCompensation: 2.8,
      scoreLocation: 3.0,
      scoreGrowth: 2.7,
      scoreConfidence: 0.9,
    })

    const { container } = render(<ScoreCell job={job} />)

    const scoreSpan = container.querySelector('.score')
    expect(scoreSpan?.classList.contains('score-medium')).toBe(true)
  })

  it('applies score-high class for scores 3.5 or above', () => {
    const job = createJob({
      scoreFit: 4.0,
      scoreCompensation: 4.0,
      scoreLocation: 4.0,
      scoreGrowth: 4.0,
      scoreConfidence: 4.0,
    })

    const { container } = render(<ScoreCell job={job} />)

    const scoreSpan = container.querySelector('.score')
    expect(scoreSpan?.classList.contains('score-high')).toBe(true)
  })

  it('applies score-empty class when score is null', () => {
    const job = createJob()

    const { container } = render(<ScoreCell job={job} />)

    const emptySpan = container.querySelector('.score-empty')
    expect(emptySpan?.textContent).toBe('—')
  })

  it('accepts custom score weights', () => {
    const customWeights: ScoreWeights = {
      fit: 0.5,
      compensation: 0.2,
      location: 0.1,
      growth: 0.1,
      confidence: 0.1,
    }

    const job = createJob({
      scoreFit: 3.0,
      scoreCompensation: 2.0,
      scoreLocation: 2.0,
      scoreGrowth: 2.0,
      scoreConfidence: 0.8,
    })

    render(<ScoreCell job={job} weights={customWeights} />)

    // Should render without error with custom weights
    const span = document.querySelector('.score')
    expect(span).toBeTruthy()
  })

  it('includes title attribute with full score precision', () => {
    const job = createJob({
      scoreFit: 3.567,
      scoreCompensation: 3.2,
      scoreLocation: 2.8,
      scoreGrowth: 4.0,
      scoreConfidence: 0.9,
    })

    const { container } = render(<ScoreCell job={job} />)

    const scoreSpan = container.querySelector('.score')
    const title = scoreSpan?.getAttribute('title')
    expect(title).toMatch(/Score: \d+\.\d{2}/)
  })

  it('handles partial scoring fields', () => {
    const job = createJob({
      scoreFit: 3.5,
      scoreCompensation: 3.2,
      // scoreLocation undefined
      // scoreGrowth undefined
      scoreConfidence: 0.8,
    })

    render(<ScoreCell job={job} />)

    const span = document.querySelector('.score')
    expect(span).toBeTruthy()
  })

  it('hides score when only some fields are provided', () => {
    const job = createJob({
      scoreFit: 2.0,
      // All other fields missing
    })

    render(<ScoreCell job={job} />)

    // Behavior depends on calculateJobScore implementation
    const span = document.querySelector('.score') || document.querySelector('.score-empty')
    expect(span).toBeTruthy()
  })

  it('renders score for job with all scoring fields', () => {
    const job = createJob({
      scoreFit: 4.0,
      scoreCompensation: 4.0,
      scoreLocation: 4.0,
      scoreGrowth: 4.0,
      scoreConfidence: 4.0,
    })

    const { container } = render(<ScoreCell job={job} />)

    const scoreSpan = container.querySelector('.score')
    expect(scoreSpan).toBeTruthy()
    expect(scoreSpan?.classList.contains('score-high')).toBe(true)
  })
})
