import { describe, expect, it } from 'vitest'
import type { Job } from '../../domain'
import { searchJobs } from './searchJobs'

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '1',
    company: 'Acme Corp',
    roleTitle: 'Frontend Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '$140k-$160k',
    notes: 'React and design systems',
    contactPerson: 'Taylor Recruiter',
    nextAction: 'Follow up this week',
    nextActionDueDate: '2026-03-12',
    priority: 'Medium',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('searchJobs', () => {
  it('returns all jobs for empty query', () => {
    const jobs = [createJob({ id: '1' }), createJob({ id: '2' })]
    expect(searchJobs(jobs, '')).toHaveLength(2)
  })

  it('matches across company, role, notes, and contact fields', () => {
    const jobs = [
      createJob({ id: '1', company: 'Acme', notes: 'React' }),
      createJob({ id: '2', company: 'Globex', notes: 'Python', contactPerson: 'Jordan' }),
    ]

    expect(searchJobs(jobs, 'acme')).toHaveLength(1)
    expect(searchJobs(jobs, 'python')).toHaveLength(1)
    expect(searchJobs(jobs, 'jordan')).toHaveLength(1)
  })

  it('supports case-insensitive tokenized matching with AND logic', () => {
    const jobs = [
      createJob({ id: '1', company: 'Acme', notes: 'React platform' }),
      createJob({ id: '2', company: 'Acme', notes: 'Backend platform' }),
    ]

    const result = searchJobs(jobs, 'ACME react')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})
