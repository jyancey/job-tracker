import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardView } from './DashboardView'
import { JOB_STATUSES, type Job, type JobStatus } from '../domain'

function createJob(id: string, status: JobStatus): Job {
  return {
    id,
    company: `Company ${id}`,
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status,
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  }
}

describe('DashboardView', () => {
  it('renders all status cards', () => {
    const byStatus = new Map<JobStatus, Job[]>()
    for (const status of JOB_STATUSES) {
      byStatus.set(status, [])
    }

    render(<DashboardView byStatus={byStatus} />)

    for (const status of JOB_STATUSES) {
      expect(screen.getAllByText(status).length).toBeGreaterThan(0)
    }
  })

  it('renders counts for each status', () => {
    const byStatus = new Map<JobStatus, Job[]>([
      ['Wishlist', [createJob('1', 'Wishlist')]],
      ['Applied', [createJob('2', 'Applied'), createJob('3', 'Applied')]],
      ['Phone Screen', []],
      ['Interview', [createJob('4', 'Interview')]],
      ['Offer', []],
      ['Rejected', []],
      ['Withdrawn', []],
    ])

    render(<DashboardView byStatus={byStatus} />)

    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
  })

  it('falls back to 0 for missing status entries', () => {
    const byStatus = new Map<JobStatus, Job[]>([['Applied', [createJob('1', 'Applied')]]])

    render(<DashboardView byStatus={byStatus} />)

    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Applied').length).toBeGreaterThan(0)
  })
})
