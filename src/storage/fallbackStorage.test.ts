import { beforeEach, describe, expect, it } from 'vitest'
import type { Job } from '../domain'
import { readFallbackJobs, writeFallbackJobs } from './fallbackStorage'

const FALLBACK_JOBS_KEY = 'job-tracker.jobs.fallback'

function sampleJob(): Job {
  return {
    id: '1',
    company: 'Acme Labs',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: 'https://example.com/job',
    atsUrl: '',
    salaryRange: '$120k - $150k',
    notes: '',
    contactPerson: 'Sam',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-08',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  }
}

describe('fallbackStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array when fallback key is missing', () => {
    expect(readFallbackJobs()).toEqual([])
  })

  it('writes and reads fallback jobs', () => {
    const jobs = [sampleJob()]
    writeFallbackJobs(jobs)

    expect(localStorage.getItem(FALLBACK_JOBS_KEY)).toBe(JSON.stringify(jobs))
    expect(readFallbackJobs()).toEqual(jobs)
  })

  it('returns empty array when fallback payload is invalid json', () => {
    localStorage.setItem(FALLBACK_JOBS_KEY, '{not json')
    expect(readFallbackJobs()).toEqual([])
  })

  it('returns empty array when fallback payload is not an array', () => {
    localStorage.setItem(FALLBACK_JOBS_KEY, JSON.stringify({ jobs: [sampleJob()] }))
    expect(readFallbackJobs()).toEqual([])
  })
})
