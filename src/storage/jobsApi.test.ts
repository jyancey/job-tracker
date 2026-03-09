import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Job } from '../domain'
import { fetchJobs, isApiUrlPatternError, persistJobs } from './jobsApi'

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

describe('jobsApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetchJobs returns jobs from API payload', async () => {
    const jobs = [sampleJob()]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ jobs }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(fetchJobs()).resolves.toEqual(jobs)
  })

  it('fetchJobs throws when API response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('oops', { status: 500 })))
    await expect(fetchJobs()).rejects.toThrow('load failed with status 500')
  })

  it('persistJobs sends PUT request with jobs payload', async () => {
    const jobs = [sampleJob()]
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await persistJobs(jobs)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/jobs',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('persistJobs throws when save response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('fail', { status: 400 })))
    await expect(persistJobs([sampleJob()])).rejects.toThrow('save failed with status 400')
  })

  it('identifies URL pattern errors used for fallback behavior', () => {
    expect(isApiUrlPatternError(new TypeError('The string did not match the expected pattern.'))).toBe(true)
    expect(isApiUrlPatternError(new Error('Failed to parse URL from /api/jobs'))).toBe(true)
    expect(isApiUrlPatternError(new Error('network error'))).toBe(false)
    expect(isApiUrlPatternError('plain string')).toBe(false)
  })
})
