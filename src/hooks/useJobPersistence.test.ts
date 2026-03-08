import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { Job, JobStatus } from '../domain'
import { useJobPersistence } from './useJobPersistence'
import * as jobService from '../services/jobService'

// Mock storage
vi.mock('../storage', () => ({
  loadJobs: vi.fn(),
  saveJobs: vi.fn(),
}))

import { loadJobs, saveJobs } from '../storage'

const mockedLoadJobs = vi.mocked(loadJobs)
const mockedSaveJobs = vi.mocked(saveJobs)

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    company: 'Tech Corp',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-08',
    status: 'Applied' as JobStatus,
    jobUrl: 'https://example.com',
    atsUrl: 'https://ats.example.com',
    salaryRange: '$100k-$120k',
    notes: 'Good fit',
    contactPerson: 'John',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-15',
    createdAt: '2026-03-08T10:00:00Z',
    updatedAt: '2026-03-08T10:00:00Z',
    ...overrides,
  }
}

describe('useJobPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('initializes with hydration not yet complete', () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })

    const { result } = renderHook(() =>
      useJobPersistence([], vi.fn(), vi.fn()),
    )

    expect(result.current.isStorageHydrated).toBe(false)
    expect(result.current.saveStatus).toBe('idle')
  })

  it('loads jobs from storage on mount', async () => {
    const jobs = [createJob({ id: '1' }), createJob({ id: '2' })]
    mockedLoadJobs.mockResolvedValue({ jobs, didLoad: true })

    const setJobs = vi.fn()
    const addNotification = vi.fn()

    renderHook(() => useJobPersistence([], setJobs, addNotification))

    await waitFor(() => {
      expect(mockedLoadJobs).toHaveBeenCalled()
    })

    expect(setJobs).toHaveBeenCalled()
  })

  it('sorts loaded jobs by application date descending', async () => {
    const jobs = [
      createJob({ id: '1', applicationDate: '2026-01-01' }),
      createJob({ id: '2', applicationDate: '2026-03-08' }),
      createJob({ id: '3', applicationDate: '2026-02-01' }),
    ]
    mockedLoadJobs.mockResolvedValue({ jobs, didLoad: true })

    const setJobs = vi.fn()

    renderHook(() => useJobPersistence([], setJobs, vi.fn()))

    await waitFor(() => {
      expect(setJobs).toHaveBeenCalled()
    })

    const passedJobs = setJobs.mock.calls[0][0]
    expect(passedJobs).toHaveLength(3)
    // Verify jobs are sorted by application date descending (newest first)
    expect(passedJobs[0].applicationDate).toBe('2026-03-08')
  })

  it('sets isStorageHydrated to true when storage loads successfully', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })

    const { result } = renderHook(() =>
      useJobPersistence([], vi.fn(), vi.fn()),
    )

    expect(result.current.isStorageHydrated).toBe(false)

    await waitFor(() => {
      expect(result.current.isStorageHydrated).toBe(true)
    })
  })

  it('shows error notification when storage fails to load', async () => {
    mockedLoadJobs.mockResolvedValue({
      jobs: [],
      didLoad: false,
    })

    const addNotification = vi.fn()

    renderHook(() => useJobPersistence([], vi.fn(), addNotification))

    await waitFor(() => {
      expect(addNotification).toHaveBeenCalledWith(
        'Storage is unavailable. Existing jobs were not loaded.',
        'error',
      )
    })
  })

  it('saves jobs to storage when jobs change after hydration', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })
    mockedSaveJobs.mockResolvedValue(undefined)

    const jobs = [createJob({ id: '1' })]
    const setJobs = vi.fn()

    const { rerender } = renderHook(
      ({ jobs: j }) => useJobPersistence(j, setJobs, vi.fn()),
      { initialProps: { jobs: [] } },
    )

    await waitFor(() => {
      expect(mockedLoadJobs).toHaveBeenCalled()
    })

    rerender({ jobs })

    await waitFor(() => {
      expect(mockedSaveJobs).toHaveBeenCalledWith(jobs)
    })
  })

  it('does not save before storage is hydrated', async () => {
    mockedLoadJobs.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ jobs: [], didLoad: true }), 100)),
    )
    mockedSaveJobs.mockResolvedValue(undefined)

    const jobs = [createJob()]

    renderHook(() => useJobPersistence(jobs, vi.fn(), vi.fn()))

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockedSaveJobs).not.toHaveBeenCalled()
  })

  it('sets saveStatus to pending while saving', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })
    mockedSaveJobs.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100)),
    )

    const jobs = [createJob()]
    const { result, rerender } = renderHook(
      ({ jobs: j }) => useJobPersistence(j, vi.fn(), vi.fn()),
      { initialProps: { jobs: [] } },
    )

    await waitFor(() => {
      expect(result.current.isStorageHydrated).toBe(true)
    })

    rerender({ jobs })

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('pending')
    })

    await waitFor(() => {
      expect(result.current.saveStatus).toBe('idle')
    })
  })

  it('shows error notification on save failure', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })
    const saveError = new Error('Storage write failed')
    mockedSaveJobs.mockRejectedValue(saveError)

    const jobs = [createJob()]
    const addNotification = vi.fn()

    const { rerender } = renderHook(
      ({ jobs: j }) => useJobPersistence(j, vi.fn(), addNotification),
      { initialProps: { jobs: [] } },
    )

    await waitFor(() => {
      expect(mockedLoadJobs).toHaveBeenCalled()
    })

    rerender({ jobs })

    await waitFor(() => {
      expect(addNotification).toHaveBeenCalledWith(
        'Autosave failed. Your latest changes are not yet persisted.',
        'error',
      )
    })
  })

  it('returns save status in result', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })
    mockedSaveJobs.mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useJobPersistence([], vi.fn(), vi.fn()),
    )

    expect(result.current).toHaveProperty('saveStatus')
    expect(result.current.saveStatus).toBe('idle')
  })

  it('returns isStorageHydrated in result', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })

    const { result } = renderHook(() =>
      useJobPersistence([], vi.fn(), vi.fn()),
    )

    expect(result.current).toHaveProperty('isStorageHydrated')
  })

  it('handles rapid job updates correctly', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })
    mockedSaveJobs.mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ jobs: j }) => useJobPersistence(j, vi.fn(), vi.fn()),
      { initialProps: { jobs: [] } },
    )

    await waitFor(() => {
      expect(mockedLoadJobs).toHaveBeenCalled()
    })

    const job1 = [createJob({ id: '1' })]
    const job2 = [createJob({ id: '2' })]
    const job3 = [createJob({ id: '3' })]

    rerender({ jobs: job1 })
    rerender({ jobs: job2 })
    rerender({ jobs: job3 })

    await waitFor(() => {
      expect(mockedSaveJobs).toHaveBeenCalledWith(job3)
    })
  })

  it('cleans up mounted state when component unmounts', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })
    mockedSaveJobs.mockResolvedValue(undefined)

    const addNotification = vi.fn()
    const { unmount } = renderHook(() =>
      useJobPersistence([], vi.fn(), addNotification),
    )

    await waitFor(() => {
      expect(mockedLoadJobs).toHaveBeenCalled()
    })

    unmount()

    expect(() => unmount()).not.toThrow()
  })

  it('handles loading jobs from empty storage', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: true })

    const setJobs = vi.fn()

    renderHook(() => useJobPersistence([], setJobs, vi.fn()))

    await waitFor(() => {
      expect(setJobs).toHaveBeenCalledWith([])
    })
  })

  it('handles large job datasets', async () => {
    const largeJobSet = Array.from({ length: 1000 }, (_, i) =>
      createJob({ id: `job-${i}` }),
    )
    mockedLoadJobs.mockResolvedValue({ jobs: largeJobSet, didLoad: true })
    mockedSaveJobs.mockResolvedValue(undefined)

    const setJobs = vi.fn()

    renderHook(() => useJobPersistence([], setJobs, vi.fn()))

    await waitFor(() => {
      expect(setJobs).toHaveBeenCalled()
    })

    expect(setJobs.mock.calls[0][0]).toHaveLength(1000)
  })

  it('does not call saveJobs if hydration fails', async () => {
    mockedLoadJobs.mockResolvedValue({ jobs: [], didLoad: false })

    const { rerender } = renderHook(
      ({ jobs: j }) => useJobPersistence(j, vi.fn(), vi.fn()),
      { initialProps: { jobs: [] } },
    )

    await waitFor(() => {
      expect(mockedLoadJobs).toHaveBeenCalled()
    })

    const jobs = [createJob()]
    rerender({ jobs })

    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(mockedSaveJobs).not.toHaveBeenCalled()
  })
})
