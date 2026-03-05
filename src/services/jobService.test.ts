import { describe, it, expect } from 'vitest'
import { createJob, updateJob, deleteJob, deleteJobs, updateJobStatus, sortByApplicationDateDesc } from './jobService'
import type { Job, JobDraft, JobStatus } from '../domain'

describe('jobService', (): void => {
  const mockDraft: JobDraft = {
    company: 'Test Corp',
    roleTitle: 'Software Engineer',
    applicationDate: '2026-03-05',
    status: 'Applied',
    jobUrl: 'https://example.com/job',
    atsUrl: 'https://ats.example.com',
    salaryRange: '$100k - $150k',
    contactPerson: 'John Doe',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-12',
    notes: 'Good opportunity',
  }

  const mockJob: Job = {
    id: '1',
    ...mockDraft,
    createdAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
  }

  describe('createJob', (): void => {
    it('adds a new job to the list and sorts', (): void => {
      const result = createJob([], mockDraft)
      expect(result).toHaveLength(1)
      expect(result[0].company).toBe('Test Corp')
      expect(result[0].id).toBeDefined()
    })

    it('preserves existing jobs and sorts by date', (): void => {
      const existingJob: Job = {
        ...mockJob,
        id: '2',
        applicationDate: '2026-03-01',
      }
      const result = createJob([existingJob], mockDraft)
      expect(result).toHaveLength(2)
      expect(result[0].applicationDate).toBe('2026-03-05') // Newer first
    })
  })

  describe('updateJob', (): void => {
    it('updates an existing job', (): void => {
      const jobs = [mockJob]
      const updated = { ...mockDraft, company: 'New Corp' }
      const result = updateJob(jobs, '1', updated)
      expect(result[0].company).toBe('New Corp')
      expect(result[0].id).toBe('1')
    })

    it('returns empty array if job not found', (): void => {
      const jobs = [mockJob]
      const updated = { ...mockDraft, company: 'New Corp' }
      const result = updateJob(jobs, 'non-existent', updated)
      expect(result).toHaveLength(1)
      expect(result[0].company).toBe('Test Corp')
    })

    it('updates timestamps', (): void => {
      const jobs = [mockJob]
      const updated = { ...mockDraft, company: 'New Corp' }
      const result = updateJob(jobs, '1', updated)
      expect(result[0].updatedAt).not.toBe(mockJob.updatedAt)
    })
  })

  describe('deleteJob', (): void => {
    it('removes a job by ID', (): void => {
      const jobs = [mockJob, { ...mockJob, id: '2' }]
      const result = deleteJob(jobs, '1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('returns all jobs if ID not found', (): void => {
      const jobs = [mockJob]
      const result = deleteJob(jobs, 'non-existent')
      expect(result).toHaveLength(1)
    })
  })

  describe('deleteJobs', (): void => {
    it('removes multiple jobs by IDs', (): void => {
      const jobs = [
        mockJob,
        { ...mockJob, id: '2' },
        { ...mockJob, id: '3' },
      ]
      const result = deleteJobs(jobs, ['1', '3'])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('returns all jobs if no IDs match', (): void => {
      const jobs = [mockJob]
      const result = deleteJobs(jobs, ['non-existent'])
      expect(result).toHaveLength(1)
    })

    it('handles empty ID list', (): void => {
      const jobs = [mockJob]
      const result = deleteJobs(jobs, [])
      expect(result).toHaveLength(1)
    })
  })

  describe('updateJobStatus', (): void => {
    it('updates a job status', (): void => {
      const jobs = [mockJob]
      const result = updateJobStatus(jobs, '1', 'Interview')
      expect(result[0].status).toBe('Interview')
    })

    it('returns jobs unchanged if ID not found', (): void => {
      const jobs = [mockJob]
      const result = updateJobStatus(jobs, 'non-existent', 'Interview')
      expect(result[0].status).toBe('Applied')
    })
  })

  describe('sortByApplicationDateDesc', (): void => {
    it('sorts jobs by application date newest first', (): void => {
      const jobs = [
        { ...mockJob, id: '1', applicationDate: '2026-03-01' },
        { ...mockJob, id: '2', applicationDate: '2026-03-05' },
        { ...mockJob, id: '3', applicationDate: '2026-03-03' },
      ]
      const sorted = jobs.sort(sortByApplicationDateDesc)
      expect(sorted[0].applicationDate).toBe('2026-03-05')
      expect(sorted[1].applicationDate).toBe('2026-03-03')
      expect(sorted[2].applicationDate).toBe('2026-03-01')
    })
  })
})
