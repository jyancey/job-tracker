import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
      createJob({ status: 'Wishlist' }),
      createJob({ status: 'Wishlist' }),
      createJob({ status: 'Applied' }),
      createJob({ status: 'Phone Screen' }),
      createJob({ status: 'Interview' }),
    ]

    render(<AnalyticsView jobs={jobs} />)
    
    expect(screen.getAllByText('Wishlist')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Applied')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Phone Screens')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Interviews')[0]).toBeInTheDocument()
  })

  it('shows conversion rate cards', () => {
    const jobs = [
      createJob({ status: 'Wishlist' }),
      createJob({ status: 'Applied' }),
    ]

    render(<AnalyticsView jobs={jobs} />)
    
    expect(screen.getAllByText('Wishlist → Applied')[0]).toBeInTheDocument()
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
})
