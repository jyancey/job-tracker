import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Job, JobStatus } from '../domain'
import { useJobOperations } from './useJobOperations'
import * as jobService from '../services/jobService'
import { scoreJobWithAI } from '../services/aiScoringService'
import { loadAIConfig } from '../storage/aiStorage'

// Mock dependencies
vi.mock('../services/jobService', () => ({
  deleteJob: vi.fn((jobs: Job[], id: string) => jobs.filter((j: Job) => j.id !== id)),
  findJobById: vi.fn((jobs: Job[], id: string) => jobs.find((j: Job) => j.id === id)),
  updateJobStatus: vi.fn((jobs: Job[], id: string, status: JobStatus) =>
    jobs.map((j: Job) => (j.id === id ? { ...j, status } : j)),
  ),
  updateJob: vi.fn((jobs: Job[], id: string, updates: Partial<Job>) =>
    jobs.map((j: Job) => (j.id === id ? { ...j, ...updates } : j)),
  ),
}))

vi.mock('../services/aiScoringService', () => ({
  scoreJobWithAI: vi.fn(() => Promise.resolve({
    scoreFit: 4.5,
    scoreCompensation: 4.0,
    scoreLocation: 3.5,
    scoreGrowth: 4.2,
    scoreConfidence: 4.0,
    analyzedAt: '2026-03-08T10:00:00Z',
    model: 'gpt-4',
    reasoning: 'Test reasoning',
  })),
}))

vi.mock('../storage/aiStorage', () => ({
  loadAIConfig: vi.fn(() => ({
    provider: 'disabled',
    apiKey: '',
    baseUrl: '',
  })),
  loadUserProfile: vi.fn(() => ({
    targetCompensationMin: 100000,
    targetCompensationMax: 200000,
  })),
}))

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

describe('useJobOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with all required callbacks', () => {
    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    expect(result.current.handleEditJob).toBeDefined()
    expect(result.current.handleRemoveJob).toBeDefined()
    expect(result.current.handleQuickMove).toBeDefined()
    expect(result.current.triggerAiScoring).toBeDefined()
  })

  it('handleEditJob calls startEdit with the job', () => {
    const startEdit = vi.fn()
    const job = createJob()
    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.handleEditJob(startEdit, job)
    })

    expect(startEdit).toHaveBeenCalledWith(job)
  })

  it('handleRemoveJob deletes job and clears editing when editing same job', () => {
    const setJobs = vi.fn()
    const resetForm = vi.fn()

    const { result } = renderHook(() =>
      useJobOperations({
        editingId: 'job-1',
        resetForm,
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.handleRemoveJob('job-1', setJobs)
    })

    expect(setJobs).toHaveBeenCalled()
    expect(resetForm).toHaveBeenCalled()
  })

  it('handleRemoveJob clears view-only mode when viewing deleted job', () => {
    const setJobs = vi.fn()
    const closeViewOnly = vi.fn()
    const job = createJob()

    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: job,
        closeViewOnly,
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.handleRemoveJob('job-1', setJobs)
    })

    expect(closeViewOnly).toHaveBeenCalled()
  })

  it('handleRemoveJob does not clear form if editing different job', () => {
    const setJobs = vi.fn()
    const resetForm = vi.fn()

    const { result } = renderHook(() =>
      useJobOperations({
        editingId: 'job-2',
        resetForm,
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.handleRemoveJob('job-1', setJobs)
    })

    expect(resetForm).not.toHaveBeenCalled()
  })

  it('handleRemoveJob does not close view-only if viewing different job', () => {
    const setJobs = vi.fn()
    const closeViewOnly = vi.fn()
    const otherJob = createJob({ id: 'job-99' })

    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: otherJob,
        closeViewOnly,
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.handleRemoveJob('job-1', setJobs)
    })

    expect(closeViewOnly).not.toHaveBeenCalled()
  })

  it('handleQuickMove updates job status', () => {
    const setJobs = vi.fn()
    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.handleQuickMove('job-1', 'Interview', setJobs)
    })

    expect(setJobs).toHaveBeenCalled()
  })

  it('handleQuickMove works with all valid status values', () => {
    const setJobs = vi.fn()
    const statuses: JobStatus[] = ['Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Withdrawn']
    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    for (const status of statuses) {
      setJobs.mockClear()
      act(() => {
        result.current.handleQuickMove('job-1', status, setJobs)
      })
      expect(setJobs).toHaveBeenCalledTimes(1)
    }
  })

  it('triggerAiScoring returns early if job descripton is empty', () => {
    const setJobs = vi.fn()
    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.triggerAiScoring(
        '',
        'Engineer',
        'Tech Corp',
        '$100k-$120k',
        'job-1',
        setJobs,
      )
    })

    expect(setJobs).not.toHaveBeenCalled()
  })

  it('triggerAiScoring returns early if job ID is empty', () => {
    const setJobs = vi.fn()
    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.triggerAiScoring(
        'Valid job description',
        'Engineer',
        'Tech Corp',
        '$100k-$120k',
        '',
        setJobs,
      )
    })

    expect(setJobs).not.toHaveBeenCalled()
  })

  it('triggerAiScoring skips when provider is disabled', () => {
    const setJobs = vi.fn()
    const addNotification = vi.fn()
    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification,
      }),
    )

    act(() => {
      result.current.triggerAiScoring(
        'Valid description',
        'Engineer',
        'Tech Corp',
        '$100k-$120k',
        'job-1',
        setJobs,
      )
    })

    expect(setJobs).not.toHaveBeenCalled()
    expect(addNotification).not.toHaveBeenCalled()
  })

  it('triggerAiScoring handles whitespace-only descriptions', () => {
    const setJobs = vi.fn()
    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.triggerAiScoring(
        '   \n  \t  ',
        'Engineer',
        'Tech Corp',
        '$100k-$120k',
        'job-1',
        setJobs,
      )
    })

    expect(setJobs).not.toHaveBeenCalled()
  })

  it('handles multiple calls to useJobOperations independently', () => {
    const resetForm1 = vi.fn()
    const resetForm2 = vi.fn()

    const { result: result1 } = renderHook(() =>
      useJobOperations({
        editingId: 'job-1',
        resetForm: resetForm1,
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    renderHook(() =>
      useJobOperations({
        editingId: 'job-2',
        resetForm: resetForm2,
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    const setJobs = vi.fn()
    act(() => {
      result1.current.handleRemoveJob('job-1', setJobs)
    })

    expect(resetForm1).toHaveBeenCalled()
    expect(resetForm2).not.toHaveBeenCalled()
  })

  it('handleRemoveJob and handleQuickMove handle updates correctly', () => {
    const setJobs = vi.fn()

    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification: vi.fn(),
      }),
    )

    act(() => {
      result.current.handleRemoveJob('job-1', setJobs)
      result.current.handleQuickMove('job-2', 'Interview', setJobs)
    })

    expect(setJobs).toHaveBeenCalledTimes(2)
  })

  it('triggerAiScoring marks job pending then clears pending on success', async () => {
    vi.useFakeTimers()
    vi.mocked(loadAIConfig).mockReturnValue({
      provider: 'openai',
      apiKey: 'test-key',
      baseUrl: '',
      model: 'gpt-4',
    })

    const addNotification = vi.fn()
    let jobs: Job[] = [createJob({ id: 'job-1' })]
    const setJobs = vi.fn((updater: (jobs: Job[]) => Job[]) => {
      jobs = updater(jobs)
    })

    const { result } = renderHook(() =>
      useJobOperations({
        editingId: null,
        resetForm: vi.fn(),
        viewingJob: null,
        closeViewOnly: vi.fn(),
        addNotification,
      }),
    )

    act(() => {
      result.current.triggerAiScoring('Detailed description', 'Engineer', 'Tech Corp', '$100k-$120k', 'job-1', setJobs)
    })

    expect(addNotification).toHaveBeenCalledWith('AI scoring in progress...', 'info')
    expect(jobService.updateJob).toHaveBeenCalledWith(
      expect.any(Array),
      'job-1',
      expect.objectContaining({ aiScoringInProgress: true }),
    )

    act(() => {
      vi.runAllTimers()
    })

    await Promise.resolve()
    await Promise.resolve()

    expect(scoreJobWithAI).toHaveBeenCalled()
    expect(addNotification).toHaveBeenCalledWith('AI scoring completed successfully', 'success')

    expect(jobService.updateJob).toHaveBeenCalledWith(
      expect.any(Array),
      'job-1',
      expect.objectContaining({ aiScoringInProgress: false }),
    )

    vi.useRealTimers()
  })
})
