import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Job } from '../domain'
import { useViewState, type View } from './useViewState'

function createJob(id = 'job-1'): Job {
  return {
    id,
    company: 'Acme',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  }
}

describe('useViewState', () => {
  it('defaults to analytics view', () => {
    const { result } = renderHook(() => useViewState())

    expect(result.current.view).toBe('analytics')
    expect(result.current.viewingJob).toBeNull()
  })

  it('supports custom initial view', () => {
    const { result } = renderHook(() => useViewState('table'))

    expect(result.current.view).toBe('table')
  })

  it('updates view through updateView', () => {
    const { result } = renderHook(() => useViewState('analytics'))

    act(() => {
      result.current.updateView('kanban')
    })

    expect(result.current.view).toBe('kanban')
  })

  it('supports switching across all views', () => {
    const { result } = renderHook(() => useViewState('analytics'))
    const views: View[] = ['table', 'kanban', 'calendar', 'analytics', 'today', 'thisWeek', 'profile', 'settings']

    for (const view of views) {
      act(() => {
        result.current.updateView(view)
      })
      expect(result.current.view).toBe(view)
    }
  })

  it('opens view-only job modal', () => {
    const { result } = renderHook(() => useViewState())
    const job = createJob('job-42')

    act(() => {
      result.current.openViewOnly(job)
    })

    expect(result.current.viewingJob).toEqual(job)
  })

  it('closes view-only job modal', () => {
    const { result } = renderHook(() => useViewState())
    const job = createJob('job-42')

    act(() => {
      result.current.openViewOnly(job)
    })
    expect(result.current.viewingJob?.id).toBe('job-42')

    act(() => {
      result.current.closeViewOnly()
    })

    expect(result.current.viewingJob).toBeNull()
  })

  it('replaces currently viewed job when opening another', () => {
    const { result } = renderHook(() => useViewState())
    const firstJob = createJob('job-1')
    const secondJob = createJob('job-2')

    act(() => {
      result.current.openViewOnly(firstJob)
      result.current.openViewOnly(secondJob)
    })

    expect(result.current.viewingJob?.id).toBe('job-2')
  })
})
