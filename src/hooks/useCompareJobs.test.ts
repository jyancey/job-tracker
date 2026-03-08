import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { Job, JobStatus } from '../domain'
import { useCompareJobs } from './useCompareJobs'

function makeJob(overrides: Partial<Job> = {}): Job {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    company: 'Acme',
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

describe('useCompareJobs', () => {
  it('opens compare when there is a selection', () => {
    const addNotification = vi.fn()
    const jobs = [makeJob({ id: '1' }), makeJob({ id: '2' })]
    const selectedIds = new Set(['1'])

    const { result } = renderHook(() => useCompareJobs({ jobs, selectedIds, addNotification }))

    act(() => {
      result.current.handleCompare()
    })

    expect(result.current.showCompare).toBe(true)
    expect(addNotification).not.toHaveBeenCalled()
  })

  it('notifies when selection is empty', () => {
    const addNotification = vi.fn()
    const jobs = [makeJob({ id: '1' })]

    const { result } = renderHook(() =>
      useCompareJobs({ jobs, selectedIds: new Set<string>(), addNotification }),
    )

    act(() => {
      result.current.handleCompare()
    })

    expect(result.current.showCompare).toBe(false)
    expect(addNotification).toHaveBeenCalledWith('Select jobs to compare', 'info')
  })

  it('derives selectedJobs from selected ids', () => {
    const addNotification = vi.fn()
    const jobs = [makeJob({ id: '1' }), makeJob({ id: '2' }), makeJob({ id: '3' })]

    const { result } = renderHook(() =>
      useCompareJobs({ jobs, selectedIds: new Set(['2', '3']), addNotification }),
    )

    expect(result.current.selectedJobs.map((j) => j.id)).toEqual(['2', '3'])
  })
})
