import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobModal } from './JobModal'
import { Job, JobStatus } from '../domain'

function createJob(overrides: Partial<Job> = {}): Job {
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
  const onReAnalyze = vi.fn()
  const setJobs = vi.fn()

  beforeEach(() => {
    onReAnalyze.mockClear()
    setJobs.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders null when job is null', () => {
    const onClose = vi.fn()
    const { container } = render(<JobModal job={null} onClose={onClose} onReAnalyze={onReAnalyze} setJobs={setJobs} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('renders job details when job is provided', () => {
    const job = createJob({ roleTitle: 'Senior Engineer', company: 'Acme Corp' })
    const onClose = vi.fn()
    
    render(<JobModal job={job} onClose={onClose} onReAnalyze={onReAnalyze} setJobs={setJobs} />)
    
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const job = createJob()
    const onClose = vi.fn()
    const user = userEvent.setup()
    
    const { container } = render(<JobModal job={job} onClose={onClose} onReAnalyze={onReAnalyze} setJobs={setJobs} />)
    
    const closeButton = container.querySelector('.job-modal-header button') as HTMLButtonElement
    expect(closeButton).not.toBeNull()
    
    await user.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('does not show stuck job badge for recent jobs', () => {
    const now = new Date().toISOString()
    const job = createJob({ status: 'Applied', updatedAt: now })
    const onClose = vi.fn()
    
    render(<JobModal job={job} onClose={onClose} onReAnalyze={onReAnalyze} setJobs={setJobs} />)
    
    expect(screen.queryByText('⚠️ Stuck')).not.toBeInTheDocument()
    expect(screen.queryByText(/been in/)).not.toBeInTheDocument()
  })

  it('shows stuck job badge for jobs exceeding threshold', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 21) // 21 days ago (> 14 day Applied threshold)
    
    const job = createJob({ status: 'Applied', updatedAt: oldDate.toISOString() })
    const onClose = vi.fn()
    
    render(<JobModal job={job} onClose={onClose} onReAnalyze={onReAnalyze} setJobs={setJobs} />)
    
    expect(screen.getByText('⚠️ Stuck')).toBeInTheDocument()
    expect(screen.getByText(/been in Applied for.*days/)).toBeInTheDocument()
  })

  it('shows correct threshold message in stuck job info', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 25) // 25 days ago
    
    const job = createJob({ status: 'Applied', updatedAt: oldDate.toISOString() })
    const onClose = vi.fn()
    
    const { container } = render(<JobModal job={job} onClose={onClose} onReAnalyze={onReAnalyze} setJobs={setJobs} />)
    const stuckInfo = container.querySelector('.stuck-job-info')
    
    expect(stuckInfo).toBeInTheDocument()
    expect(stuckInfo?.textContent).toContain('threshold: 14 days')
  })

  it('does not show stuck job info for statuses without thresholds', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 100)
    
    const job = createJob({ status: 'Rejected', updatedAt: oldDate.toISOString() })
    const onClose = vi.fn()
    
    const { container } = render(<JobModal job={job} onClose={onClose} onReAnalyze={onReAnalyze} setJobs={setJobs} />)
    
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
    
    render(<JobModal job={job} onClose={onClose} onReAnalyze={onReAnalyze} setJobs={setJobs} />)
    
    expect(screen.getByText('Product Manager')).toBeInTheDocument()
    expect(screen.getByText('Tech Startup')).toBeInTheDocument()
    expect(screen.getByText('Interview')).toBeInTheDocument()
  })

  it('renders the job description when present', () => {
    const job = createJob({
      jobDescription: 'Lead frontend architecture across design systems and performance-sensitive pages.',
    })

    render(<JobModal job={job} onClose={vi.fn()} onReAnalyze={onReAnalyze} setJobs={setJobs} />)

    expect(screen.getByRole('heading', { name: 'Job Description' })).toBeInTheDocument()
    expect(screen.getByText('Lead frontend architecture across design systems and performance-sensitive pages.')).toBeInTheDocument()
  })

  it('does not render job description section when description is empty', () => {
    const job = createJob({ jobDescription: '' })

    render(<JobModal job={job} onClose={vi.fn()} onReAnalyze={onReAnalyze} setJobs={setJobs} />)

    expect(screen.queryByRole('heading', { name: 'Job Description' })).not.toBeInTheDocument()
  })

  it('does not render job description section when description is whitespace only', () => {
    const job = createJob({ jobDescription: '   \n   ' })

    render(<JobModal job={job} onClose={vi.fn()} onReAnalyze={onReAnalyze} setJobs={setJobs} />)

    expect(screen.queryByRole('heading', { name: 'Job Description' })).not.toBeInTheDocument()
  })

  it('preserves multiline job descriptions', () => {
    const description = 'Responsibilities:\n- Build APIs\n- Write tests\n\nRequirements:\n- 3+ years experience'
    const job = createJob({ jobDescription: description })

    const { container } = render(<JobModal job={job} onClose={vi.fn()} onReAnalyze={onReAnalyze} setJobs={setJobs} />)

    expect(screen.getByRole('heading', { name: 'Job Description' })).toBeInTheDocument()
    const descriptionParagraph = container.querySelector('.job-modal-notes p')
    expect(descriptionParagraph?.textContent).toBe(description)
  })

  it('shows AI processing state when scoring is in progress', () => {
    const job = createJob({ aiScoringInProgress: true })

    render(<JobModal job={job} onClose={vi.fn()} onReAnalyze={onReAnalyze} setJobs={setJobs} />)

    expect(screen.getByText('Processing...')).toBeInTheDocument()
    expect(screen.getByText('Scoring is running in the background')).toBeInTheDocument()
  })

  it('shows re-analyze button when job has a description and triggers AI scoring with job data', async () => {
    const user = userEvent.setup()
    const job = createJob({
      id: 'job-123',
      company: 'Acme Corp',
      roleTitle: 'Platform Engineer',
      salaryRange: '$120k-$140k',
      jobDescription: 'Build distributed systems',
    })

    render(<JobModal job={job} onClose={vi.fn()} onReAnalyze={onReAnalyze} setJobs={setJobs} />)

    await user.click(screen.getByRole('button', { name: 'Re-Analyze' }))

    expect(onReAnalyze).toHaveBeenCalledWith(
      'Build distributed systems',
      'Platform Engineer',
      'Acme Corp',
      '$120k-$140k',
      'job-123',
      setJobs,
    )
  })

  it('hides re-analyze button when job description is missing', () => {
    const job = createJob({ jobDescription: '' })

    render(<JobModal job={job} onClose={vi.fn()} onReAnalyze={onReAnalyze} setJobs={setJobs} />)

    expect(screen.queryByRole('button', { name: 'Re-Analyze' })).not.toBeInTheDocument()
  })

  it('disables re-analyze button while scoring is in progress', () => {
    const job = createJob({
      jobDescription: 'AI-parsable JD',
      aiScoringInProgress: true,
    })

    render(<JobModal job={job} onClose={vi.fn()} onReAnalyze={onReAnalyze} setJobs={setJobs} />)

    expect(screen.getByRole('button', { name: 'Re-Analyze' })).toBeDisabled()
  })

  it('renders AI analysis date and model metadata', () => {
    const job = createJob({
      aiScoredAt: '2026-03-09T10:00:00.000Z',
      aiModel: 'google/gemma-3-27b',
    })

    render(<JobModal job={job} onClose={vi.fn()} onReAnalyze={onReAnalyze} setJobs={setJobs} />)

    expect(screen.getByText('AI Analysis')).toBeInTheDocument()
    expect(screen.getByText('via google/gemma-3-27b')).toBeInTheDocument()
  })
})
