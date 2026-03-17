import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Job } from '../domain'
import { loadJobs, saveJobs } from './storageService'

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

describe('storageService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('returns empty array when no data exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ jobs: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(loadJobs()).resolves.toEqual({ jobs: [], didLoad: true })
  })

  it('saves and loads jobs', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ jobs: [sampleJob()] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const jobs = [sampleJob()]
    await saveJobs(jobs)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/jobs',
      expect.objectContaining({
        method: 'PUT',
      }),
    )

    await expect(loadJobs()).resolves.toEqual({ jobs, didLoad: true })
  })

  it('returns empty array when request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })))
    await expect(loadJobs()).resolves.toEqual({ jobs: [], didLoad: false })
  })

  it('loads jobs from local fallback when fetch URL parsing fails', async () => {
    const jobs = [sampleJob()]
    localStorage.setItem(FALLBACK_JOBS_KEY, JSON.stringify(jobs))
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('The string did not match the expected pattern.')
    }))

    await expect(loadJobs()).resolves.toEqual({ jobs, didLoad: true })
  })

  it('saves jobs to local fallback when fetch URL parsing fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('The string did not match the expected pattern.')
    }))

    const jobs = [sampleJob()]
    await expect(saveJobs(jobs)).resolves.toBeUndefined()
    expect(localStorage.getItem(FALLBACK_JOBS_KEY)).toBe(JSON.stringify(jobs))
  })
})
