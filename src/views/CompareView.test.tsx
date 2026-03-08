import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CompareView } from './CompareView'
import type { Job } from '../domain'

function createJob(id: string, overrides: Partial<Job> = {}): Job {
  return {
    id,
    company: `Company ${id}`,
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '$120k-$150k',
    notes: 'Notes',
    contactPerson: 'Recruiter',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-20',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('CompareView', () => {
  it('renders empty-state message when jobs list is empty', () => {
    render(<CompareView jobs={[]} onClose={vi.fn()} />)

    expect(screen.getAllByText('Compare Jobs').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Select jobs to compare from the table.').length).toBeGreaterThan(0)
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    const { container } = render(<CompareView jobs={[createJob('1')]} onClose={onClose} />)

    const closeBtn = container.querySelector('.compare-header button') as HTMLButtonElement
    await user.click(closeBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders core comparison table fields for jobs', () => {
    const jobs = [
      createJob('1', { company: 'Acme', roleTitle: 'Backend Engineer' }),
      createJob('2', { company: 'Globex', roleTitle: 'Frontend Engineer' }),
    ]

    render(<CompareView jobs={jobs} onClose={vi.fn()} />)

    expect(screen.getAllByText('Compare Jobs (2)').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Job Details').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Acme').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Globex').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Application Date').length).toBeGreaterThan(0)
  })

  it('shows scoring section when at least one job has scoring', () => {
    const jobs = [
      createJob('1', { scoreFit: 4, scoreCompensation: 3.5, scoreLocation: 3.2, scoreGrowth: 4.1, scoreConfidence: 4.3 }),
      createJob('2'),
    ]

    render(<CompareView jobs={jobs} onClose={vi.fn()} />)

    expect(screen.getAllByText('Quality Scoring').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Total Score').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Fit').length).toBeGreaterThan(0)
  })

  it('renders links when job and ats URLs are provided', () => {
    const jobs = [
      createJob('1', {
        jobUrl: 'https://example.com/job-1',
        atsUrl: 'https://example.com/ats-1',
      }),
    ]

    render(<CompareView jobs={jobs} onClose={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Job Posting' })).toHaveAttribute('href', 'https://example.com/job-1')
    expect(screen.getByRole('link', { name: 'ATS Portal' })).toHaveAttribute('href', 'https://example.com/ats-1')
  })
})
