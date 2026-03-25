import { describe, it, expect } from 'vitest'
import { exportAnalyticsToCSV } from './analyticsExport'
import { Job, JobStatus } from '../../domain'

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

describe('analyticsExport', () => {
  it('exports empty analytics to CSV', () => {
    const csv = exportAnalyticsToCSV([])
    
    expect(csv).toContain('Job Tracker Analytics Export')
    expect(csv).toContain('Total Jobs: 0')
    expect(csv).toContain('Status Distribution')
    expect(csv).toContain('Conversion Rates')
  })

  it('exports analytics with jobs to CSV', () => {
    const jobs = [
      createJob({ status: 'Applied' }),
      createJob({ status: 'Interview' }),
    ]

    const csv = exportAnalyticsToCSV(jobs)
    
    expect(csv).toContain('Total Jobs: 2')
    expect(csv).toContain('Status Distribution')
    expect(csv).toContain('Applied,1')
    expect(csv).toContain('Interview,1')
  })

  it('includes conversion rates in CSV', () => {
    const jobs = [
      createJob({ status: 'Applied' }),
    ]

    const csv = exportAnalyticsToCSV(jobs)
    
    expect(csv).toContain('Conversion Rates')
    expect(csv).toContain('Applied → Phone Screen')
  })

  it('includes time in stage metrics in CSV', () => {
    const jobs = [
      createJob({ status: 'Applied' }),
      createJob({ status: 'Interview' }),
    ]

    const csv = exportAnalyticsToCSV(jobs)
    
    expect(csv).toContain('Median Time in Stage (Days)')
    expect(csv).toContain('Applied,')
    expect(csv).toContain('Interview,')
  })

  it('includes weekly momentum in CSV', () => {
    const jobs = [createJob()]

    const csv = exportAnalyticsToCSV(jobs)
    
    expect(csv).toContain('Weekly Momentum (This Week)')
    expect(csv).toContain('Applications,')
    expect(csv).toContain('Phone Screens,')
    expect(csv).toContain('Interviews,')
    expect(csv).toContain('Offers,')
  })

  it('formats CSV with proper headers and structure', () => {
    const jobs = [createJob()]

    const csv = exportAnalyticsToCSV(jobs)
    const lines = csv.split('\n')
    
    // Should have content sections
    expect(lines.length).toBeGreaterThan(10)
    expect(lines[0]).toContain('Job Tracker Analytics Export')
  })
})
