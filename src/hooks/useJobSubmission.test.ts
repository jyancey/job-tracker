import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { FormEvent } from 'react'
import type { Job, JobDraft } from '../domain'
import { useJobSubmission } from './useJobSubmission'

vi.mock('../services/jobService', () => ({
  createJob: vi.fn((jobs: Job[], draft: JobDraft) => [
    {
      id: 'created-id',
      ...draft,
      createdAt: '2026-03-09T00:00:00Z',
      updatedAt: '2026-03-09T00:00:00Z',
    } as Job,
    ...jobs,
  ]),
  updateJob: vi.fn((jobs: Job[], jobId: string, draft: JobDraft) =>
    jobs.map((job) => (job.id === jobId ? { ...job, ...draft } : job)),
  ),
}))

function createDraft(overrides: Partial<JobDraft> = {}): JobDraft {
  return {
    company: 'Acme',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-09',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    priority: 'Medium',
    jobDescription: 'A full role description',
    jobDescriptionSource: 'paste',
    scoreFit: undefined,
    scoreCompensation: undefined,
    scoreLocation: undefined,
    scoreGrowth: undefined,
    scoreConfidence: undefined,
    aiScoredAt: undefined,
    aiModel: undefined,
    aiReasoning: undefined,
    aiScoringInProgress: undefined,
    ...overrides,
  }
}

describe('useJobSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not trigger AI scoring on edit when draft already has scores', () => {
    const submitForm = vi.fn(() => createDraft({ scoreFit: 4.2, aiScoredAt: '2026-03-09T01:00:00Z' }))
    const resetForm = vi.fn()
    const setJobs = vi.fn()
    const triggerAiScoring = vi.fn()

    const { result } = renderHook(() =>
      useJobSubmission({ editingId: 'job-1', submitForm, resetForm, setJobs, triggerAiScoring }),
    )

    act(() => {
      result.current.handleSubmitJob({ preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>)
    })

    expect(setJobs).toHaveBeenCalledTimes(1)
    expect(resetForm).toHaveBeenCalledTimes(1)
    expect(triggerAiScoring).not.toHaveBeenCalled()
  })

  it('triggers AI scoring on edit when draft has no scores', () => {
    const submitForm = vi.fn(() => createDraft())
    const resetForm = vi.fn()
    const setJobs = vi.fn()
    const triggerAiScoring = vi.fn()

    const { result } = renderHook(() =>
      useJobSubmission({ editingId: 'job-1', submitForm, resetForm, setJobs, triggerAiScoring }),
    )

    act(() => {
      result.current.handleSubmitJob({ preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>)
    })

    expect(triggerAiScoring).toHaveBeenCalledTimes(1)
  })

  it('triggers AI scoring for new job submissions without scores', () => {
    const submitForm = vi.fn(() => createDraft())
    const resetForm = vi.fn()
    const triggerAiScoring = vi.fn()

    let jobs: Job[] = []
    const setJobs = vi.fn((updater: (jobs: Job[]) => Job[]) => {
      jobs = updater(jobs)
    })

    const { result } = renderHook(() =>
      useJobSubmission({ editingId: null, submitForm, resetForm, setJobs, triggerAiScoring }),
    )

    act(() => {
      result.current.handleSubmitJob({ preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>)
    })

    expect(triggerAiScoring).toHaveBeenCalledTimes(1)
    expect(triggerAiScoring).toHaveBeenCalledWith('A full role description', 'Engineer', 'Acme', '', 'created-id', setJobs)
  })
})
