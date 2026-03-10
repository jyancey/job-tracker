import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobModal } from './JobModal'
import { Job, JobStatus } from '../domain'

function createJob(overrides: Partial<Job>): Job {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    company: 'Test Corp',
    roleTitle: 'Engineer',
    applicationDate: now,
    status: 'Applied' as JobStatus,
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('JobModal', () => {
  it('renders null when job is null', () => {
    const onClose = vi.fn()
    const { container } = render(<JobModal job={null} onClose={onClose} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('renders job details when job is provided', () => {
    const job = createJob({ roleTitle: 'Senior Engineer', company: 'Acme Corp' })
    const onClose = vi.fn()
    
    render(<JobModal job={job} onClose={onClose} />)
    
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const job = createJob()
    const onClose = vi.fn()
    const user = userEvent.setup()
    
    const { container } = render(<JobModal job={job} onClose={onClose} />)
    
    const closeButton = container.querySelector('.job-modal-header button') as HTMLButtonElement
    expect(closeButton).not.toBeNull()
    
    await user.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('does not show stuck job badge for recent jobs', () => {
    const now = new Date().toISOString()
    const job = createJob({ status: 'Applied', updatedAt: now })
    const onClose = vi.fn()
    
    render(<JobModal job={job} onClose={onClose} />)
    
    expect(screen.queryByText('⚠️ Stuck')).not.toBeInTheDocument()
    expect(screen.queryByText(/been in/)).not.toBeInTheDocument()
  })

  it('shows stuck job badge for jobs exceeding threshold', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 21) // 21 days ago (> 14 day Applied threshold)
    
    const job = createJob({ status: 'Applied', updatedAt: oldDate.toISOString() })
    const onClose = vi.fn()
    
    render(<JobModal job={job} onClose={onClose} />)
    
    expect(screen.getByText('⚠️ Stuck')).toBeInTheDocument()
    expect(screen.getByText(/been in Applied for.*days/)).toBeInTheDocument()
  })

  it('shows correct threshold message in stuck job info', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 25) // 25 days ago
    
    const job = createJob({ status: 'Applied', updatedAt: oldDate.toISOString() })
    const onClose = vi.fn()
    
    const { container } = render(<JobModal job={job} onClose={onClose} />)
    const stuckInfo = container.querySelector('.stuck-job-info')
    
    expect(stuckInfo).toBeInTheDocument()
    expect(stuckInfo?.textContent).toContain('threshold: 14 days')
  })

  it('does not show stuck job info for statuses without thresholds', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 100)
    
    const job = createJob({ status: 'Rejected', updatedAt: oldDate.toISOString() })
    const onClose = vi.fn()
    
    const { container } = render(<JobModal job={job} onClose={onClose} />)
    
    const badge = container.querySelector('.stuck-job-badge')
    const info = container.querySelector('.stuck-job-info')
    expect(badge).not.toBeInTheDocument()
    expect(info).not.toBeInTheDocument()
  })

  it('renders modal content correctly', () => {
    const job = createJob({
      roleTitle: 'Product Manager',
      company: 'Tech Startup',
      status: 'Interview',
      salaryRange: '100k-150k',
    })
    const onClose = vi.fn()
    
    render(<JobModal job={job} onClose={onClose} />)
    
    expect(screen.getByText('Product Manager')).toBeInTheDocument()
    expect(screen.getByText('Tech Startup')).toBeInTheDocument()
    expect(screen.getByText('Interview')).toBeInTheDocument()
  })

  it('shows AI processing state when scoring is in progress', () => {
    const job = createJob({ aiScoringInProgress: true })

    render(<JobModal job={job} onClose={vi.fn()} />)

    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByText('Scoring is running in the background')).toBeInTheDocument()
  })
})
