import { describe, it, expect } from 'vitest'
import {
  calculateDaysInCurrentStatus,
  calculateTimeInStage,
  findStuckJobs,
  countStuckJobsByStatus,
  DEFAULT_STUCK_THRESHOLDS,
} from './timeInStage'
import { Job, JobStatus } from '../../domain'

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

// Helper to create a date N days ago (at midnight for consistent day calculations)
function daysAgo(days: number): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0) // Set to midnight
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

describe('calculateDaysInCurrentStatus', () => {
  it('returns 0 for job updated today', () => {
    const job = createJob({ updatedAt: new Date().toISOString() })
    const days = calculateDaysInCurrentStatus(job)
    expect(days).toBe(0)
  })

  it('calculates days correctly for job updated in past', () => {
    const job = createJob({ updatedAt: daysAgo(5) })
    const days = calculateDaysInCurrentStatus(job)
    expect(days).toBe(5)
  })

  it('calculates days correctly for job updated 30 days ago', () => {
    const job = createJob({ updatedAt: daysAgo(30) })
    const days = calculateDaysInCurrentStatus(job)
    expect(days).toBe(30)
  })

  it('handles fractional days by flooring', () => {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    const job = createJob({ updatedAt: twelveHoursAgo })
    const days = calculateDaysInCurrentStatus(job)
    expect(days).toBe(0) // Floor of 0.5 days
  })
})

describe('calculateTimeInStage', () => {
  it('handles empty job list', () => {
    const metrics = calculateTimeInStage([])

    expect(metrics.Applied).toEqual({ median: 0, jobs: 0 })
    expect(metrics['Phone Screen']).toEqual({ median: 0, jobs: 0 })
    expect(metrics.Interview).toEqual({ median: 0, jobs: 0 })
  })

  it('calculates median for single job at each status', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(10) }),
      createJob({ status: 'Phone Screen', updatedAt: daysAgo(3) }),
      createJob({ status: 'Interview', updatedAt: daysAgo(5) }),
    ]

    const metrics = calculateTimeInStage(jobs)

    expect(metrics.Applied).toEqual({ median: 10, jobs: 1 })
    expect(metrics['Phone Screen']).toEqual({ median: 3, jobs: 1 })
    expect(metrics.Interview).toEqual({ median: 5, jobs: 1 })
    expect(metrics.Offer).toEqual({ median: 0, jobs: 0 })
  })

  it('calculates median for multiple jobs at same status', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(5) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(10) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(15) }),
    ]

    const metrics = calculateTimeInStage(jobs)

    expect(metrics.Applied.median).toBe(10) // Median of [5, 10, 15]
    expect(metrics.Applied.jobs).toBe(3)
  })

  it('calculates median for even number of values', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(5) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(10) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(20) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(30) }),
    ]

    const metrics = calculateTimeInStage(jobs)

    // Median of [5, 10, 20, 30] = (10 + 20) / 2 = 15
    expect(metrics.Applied.median).toBe(15)
    expect(metrics.Applied.jobs).toBe(4)
  })

  it('handles jobs at all statuses', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(2) }),
      createJob({ status: 'Phone Screen', updatedAt: daysAgo(3) }),
      createJob({ status: 'Interview', updatedAt: daysAgo(4) }),
      createJob({ status: 'Offer', updatedAt: daysAgo(5) }),
      createJob({ status: 'Rejected', updatedAt: daysAgo(6) }),
      createJob({ status: 'Withdrawn', updatedAt: daysAgo(7) }),
    ]

    const metrics = calculateTimeInStage(jobs)

    expect(metrics.Applied.jobs).toBe(1)
    expect(metrics['Phone Screen'].jobs).toBe(1)
    expect(metrics.Interview.jobs).toBe(1)
    expect(metrics.Offer.jobs).toBe(1)
    expect(metrics.Rejected.jobs).toBe(1)
    expect(metrics.Withdrawn.jobs).toBe(1)
  })
})

describe('findStuckJobs', () => {
  it('returns empty array for empty job list', () => {
    const stuck = findStuckJobs([])
    expect(stuck).toEqual([])
  })

  it('identifies jobs beyond default threshold', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(20) }), // Beyond 14 day threshold
      createJob({ status: 'Applied', updatedAt: daysAgo(5) }), // Within threshold
    ]

    const stuck = findStuckJobs(jobs)

    expect(stuck).toHaveLength(1)
    expect(stuck[0].job.status).toBe('Applied')
    expect(stuck[0].daysInStatus).toBe(20)
    expect(stuck[0].threshold).toBe(14)
  })

  it('uses custom thresholds when provided', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(5) }),
    ]

    const customThresholds = { Applied: 3 }
    const stuck = findStuckJobs(jobs, customThresholds)

    expect(stuck).toHaveLength(1)
    expect(stuck[0].daysInStatus).toBe(5)
    expect(stuck[0].threshold).toBe(3)
  })

  it('does not flag rejected and withdrawn jobs by default', () => {
    const jobs: Job[] = [
      createJob({ status: 'Rejected', updatedAt: daysAgo(100) }),
      createJob({ status: 'Withdrawn', updatedAt: daysAgo(100) }),
    ]

    const stuck = findStuckJobs(jobs)

    expect(stuck).toHaveLength(0) // No thresholds for Rejected/Withdrawn
  })

  it('sorts stuck jobs by days in status descending', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(20) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(50) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(30) }),
    ]

    const stuck = findStuckJobs(jobs)

    expect(stuck).toHaveLength(3)
    expect(stuck[0].daysInStatus).toBe(50) // Most stuck first
    expect(stuck[1].daysInStatus).toBe(30)
    expect(stuck[2].daysInStatus).toBe(20)
  })

  it('handles jobs at exactly the threshold', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(14) }), // Exactly at threshold
    ]

    const stuck = findStuckJobs(jobs)

    expect(stuck).toHaveLength(1) // >= threshold counts as stuck
  })

  it('ignores jobs just below threshold', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(13) }), // Below 14 day threshold
    ]

    const stuck = findStuckJobs(jobs)

    expect(stuck).toHaveLength(0)
  })

  it('handles multiple statuses with different thresholds', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(20) }), // Beyond 14
      createJob({ status: 'Interview', updatedAt: daysAgo(10) }), // Beyond 7
      createJob({ status: 'Phone Screen', updatedAt: daysAgo(5) }), // Within 10
      createJob({ status: 'Offer', updatedAt: daysAgo(9) }), // Beyond 7
    ]

    const stuck = findStuckJobs(jobs)

    expect(stuck).toHaveLength(3)
    expect(stuck.map((s) => s.job.status)).toContain('Applied')
    expect(stuck.map((s) => s.job.status)).toContain('Interview')
    expect(stuck.map((s) => s.job.status)).toContain('Offer')
  })
})

describe('countStuckJobsByStatus', () => {
  it('returns empty object for no stuck jobs', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(1) }),
    ]

    const counts = countStuckJobsByStatus(jobs)

    expect(counts).toEqual({})
  })

  it('counts stuck jobs by status', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(20) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(25) }),
      createJob({ status: 'Interview', updatedAt: daysAgo(15) }),
      createJob({ status: 'Phone Screen', updatedAt: daysAgo(5) }), // Not stuck
    ]

    const counts = countStuckJobsByStatus(jobs)

    expect(counts.Applied).toBe(2)
    expect(counts.Interview).toBe(1)
    expect(counts['Phone Screen']).toBeUndefined()
  })

  it('handles all jobs stuck at same status', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied', updatedAt: daysAgo(40) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(50) }),
      createJob({ status: 'Applied', updatedAt: daysAgo(60) }),
    ]

    const counts = countStuckJobsByStatus(jobs)

    expect(counts.Applied).toBe(3)
  })
})

describe('DEFAULT_STUCK_THRESHOLDS', () => {
  it('has thresholds for active statuses', () => {
    expect(DEFAULT_STUCK_THRESHOLDS.Applied).toBe(14)
    expect(DEFAULT_STUCK_THRESHOLDS['Phone Screen']).toBe(10)
    expect(DEFAULT_STUCK_THRESHOLDS.Interview).toBe(7)
    expect(DEFAULT_STUCK_THRESHOLDS.Offer).toBe(7)
  })

  it('has no thresholds for terminal statuses', () => {
    expect(DEFAULT_STUCK_THRESHOLDS.Rejected).toBeUndefined()
    expect(DEFAULT_STUCK_THRESHOLDS.Withdrawn).toBeUndefined()
  })
})
