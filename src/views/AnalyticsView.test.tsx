import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsView } from './AnalyticsView'
import { Job, JobStatus } from '../domain'

// Helper to create test jobs
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

describe('AnalyticsView', () => {
  it('renders analytics header', () => {
    render(<AnalyticsView jobs={[]} />)
    expect(screen.getAllByText('Pipeline Analytics')[0]).toBeInTheDocument()
  })

  it('renders all main sections', () => {
    render(<AnalyticsView jobs={[]} />)
    
    expect(screen.getAllByText('Overview')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Conversion Rates')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Weekly Momentum')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Median Time in Stage')[0]).toBeInTheDocument()
  })

  it('displays total jobs count', () => {
    const jobs = [
      createJob({ status: 'Applied' }),
      createJob({ status: 'Interview' }),
      createJob({ status: 'Offer' }),
    ]

    render(<AnalyticsView jobs={jobs} />)
    
    // Find "Total Jobs" label and check its associated value
    expect(screen.getAllByText('Total Jobs')[0]).toBeInTheDocument()
    expect(screen.getAllByText('3')[0]).toBeInTheDocument()
  })

  it('displays status distribution', () => {
    const jobs = [
      createJob({ status: 'Applied' }),
      createJob({ status: 'Applied' }),
      createJob({ status: 'Phone Screen' }),
      createJob({ status: 'Interview' }),
    ]

    render(<AnalyticsView jobs={jobs} />)
    
    expect(screen.getAllByText('Applied')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Phone Screens')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Interviews')[0]).toBeInTheDocument()
  })

  it('shows conversion rate cards', () => {
    const jobs = [
      createJob({ status: 'Applied' }),
    ]

    render(<AnalyticsView jobs={jobs} />)
    
    expect(screen.getAllByText('Applied → Phone Screen')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Phone Screen → Interview')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Interview → Offer')[0]).toBeInTheDocument()
  })

  it('displays weekly momentum cards', () => {
    render(<AnalyticsView jobs={[]} />)
    
    expect(screen.getAllByText('Applications This Week')[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Phone Screens/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Interviews/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Offers/i)[0]).toBeInTheDocument()
  })

  it('shows stuck jobs section when jobs are stuck', () => {
    // Create jobs that are stuck (old updatedAt dates)
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 30)
    
    const jobs = [
      createJob({ status: 'Applied', updatedAt: oldDate.toISOString() }),
    ]

    render(<AnalyticsView jobs={jobs} />)
    
    expect(screen.getAllByText(/Stuck Jobs/i)[0]).toBeInTheDocument()
  })

  it('does not show stuck jobs section when no jobs are stuck', () => {
    const jobs = [
      createJob({ status: 'Applied', updatedAt: new Date().toISOString() }),
    ]

    const { container } = render(<AnalyticsView jobs={jobs} />)
    
    // Use container.querySelector for sections that may not exist
    const stuckSection = container.querySelector('.stuck-jobs-section')
    expect(stuckSection).toBeNull()
  })

  it('limits stuck jobs display to 10 items', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 30)
    
    // Create 15 stuck jobs
    const jobs = Array.from({ length: 15 }, () =>
      createJob({ status: 'Applied', updatedAt: oldDate.toISOString() })
    )

    const { container } = render(<AnalyticsView jobs={jobs} />)
    
    const stuckJobItems = container.querySelectorAll('.stuck-job-item')
    expect(stuckJobItems).toHaveLength(10)
    
    // Should show "+ X more" message
    expect(screen.getAllByText('+ 5 more stuck jobs')[0]).toBeInTheDocument()
  })

  it('handles empty jobs list gracefully', () => {
    render(<AnalyticsView jobs={[]} />)
    
    // Should render without errors
    expect(screen.getAllByText('Pipeline Analytics')[0]).toBeInTheDocument()
    expect(screen.getAllByText('0')[0]).toBeInTheDocument() // Total Jobs: 0
  })

  it('invokes drill-down callback when clicking overview cards', async () => {
    const onFilterByStatus = vi.fn()
    const user = userEvent.setup()

    const { container } = render(<AnalyticsView jobs={[createJob({ status: 'Applied' })]} onFilterByStatus={onFilterByStatus} />)

    const appliedCard = container.querySelector('.stats-grid .stat-card.interactive-card:nth-child(2)')
    expect(appliedCard).not.toBeNull()

    await user.click(appliedCard as HTMLElement)

    expect(onFilterByStatus).toHaveBeenCalledWith('Applied')
  })

  it('invokes drill-down callback when clicking conversion cards', async () => {
    const onFilterByStatus = vi.fn()
    const user = userEvent.setup()

    const { container } = render(<AnalyticsView jobs={[createJob({ status: 'Interview' })]} onFilterByStatus={onFilterByStatus} />)

    const offerConversionCard = container.querySelector('.conversion-grid .conversion-card.interactive-card:nth-child(3)')
    expect(offerConversionCard).not.toBeNull()

    await user.click(offerConversionCard as HTMLElement)

    expect(onFilterByStatus).toHaveBeenCalledWith('Offer')
  })

  it('invokes onSelectJob callback when clicking stuck job items', async () => {
    const onSelectJob = vi.fn()
    const user = userEvent.setup()

    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 30)

    const stuckJob = createJob({
      status: 'Applied',
      updatedAt: oldDate.toISOString(),
      company: 'Acme Corp',
      roleTitle: 'Senior Engineer',
    })

    const { container } = render(
      <AnalyticsView jobs={[stuckJob]} onSelectJob={onSelectJob} />
    )

    const stuckJobItem = container.querySelector('.stuck-job-item')
    expect(stuckJobItem).not.toBeNull()

    await user.click(stuckJobItem as HTMLElement)

    expect(onSelectJob).toHaveBeenCalledWith(stuckJob)
    expect(onSelectJob).toHaveBeenCalledTimes(1)
  })

  it('passes correct job object to onSelectJob when multiple stuck jobs exist', async () => {
    const onSelectJob = vi.fn()
    const user = userEvent.setup()

    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 30)

    const stuckJob1 = createJob({
      status: 'Applied',
      updatedAt: oldDate.toISOString(),
      company: 'Company A',
      roleTitle: 'Engineer',
    })

    const stuckJob2 = createJob({
      status: 'Interview',
      updatedAt: oldDate.toISOString(),
      company: 'Company B',
      roleTitle: 'Manager',
    })

    const { container } = render(
      <AnalyticsView jobs={[stuckJob1, stuckJob2]} onSelectJob={onSelectJob} />
    )

    const stuckJobItems = container.querySelectorAll('.stuck-job-item')
    expect(stuckJobItems).toHaveLength(2)

    // Click the second stuck job item
    await user.click(stuckJobItems[1] as HTMLElement)

    // Should pass the second job
    expect(onSelectJob).toHaveBeenCalledWith(stuckJob2)
  })

  it('does not apply interactive styling when onSelectJob is not provided', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 30)

    const stuckJob = createJob({
      status: 'Applied',
      updatedAt: oldDate.toISOString(),
    })

    const { container } = render(<AnalyticsView jobs={[stuckJob]} />)

    const stuckJobItem = container.querySelector('.stuck-job-item')
    expect(stuckJobItem).not.toBeNull()
    expect(stuckJobItem?.classList.contains('stuck-job-interactive')).toBe(false)
  })

  it('applies interactive styling when onSelectJob is provided', () => {
    const onSelectJob = vi.fn()
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 30)

    const stuckJob = createJob({
      status: 'Applied',
      updatedAt: oldDate.toISOString(),
    })

    const { container } = render(<AnalyticsView jobs={[stuckJob]} onSelectJob={onSelectJob} />)

    const stuckJobItem = container.querySelector('.stuck-job-item')
    expect(stuckJobItem).not.toBeNull()
    expect(stuckJobItem?.classList.contains('stuck-job-interactive')).toBe(true)
  })
})
