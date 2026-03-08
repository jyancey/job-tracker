import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { Job, JobStatus } from '../domain'
import { useAppActions } from './useAppActions'

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

describe('useAppActions', () => {
  it('bulkDeleteSelected deletes visible ids and notifies', () => {
    const jobs = [makeJob({ id: 'a' }), makeJob({ id: 'b' }), makeJob({ id: 'c' })]
    const setJobs = vi.fn()
    const addNotification = vi.fn()
    const selection = {
      selectedIds: new Set(['a', 'b', 'z']),
      toggle: vi.fn(),
      toggleAll: vi.fn(),
      removeMultiple: vi.fn(),
    }
    const undo = { pushState: vi.fn(), undo: vi.fn() }

    const { result } = renderHook(() =>
      useAppActions({
        jobs,
        setJobs,
        selection,
        visibleTableIds: ['a', 'b'],
        selectedVisibleIds: ['a', 'b'],
        allVisibleSelected: false,
        undo,
        addNotification,
        removeJobHelper: vi.fn(),
        quickMoveHelper: vi.fn(),
        startEdit: vi.fn(),
        openViewOnly: vi.fn(),
        closeViewOnly: vi.fn(),
        updateView: vi.fn(),
        showOverdueFilter: vi.fn(),
      }),
    )

    act(() => {
      result.current.bulkDeleteSelected()
    })

    expect(undo.pushState).toHaveBeenCalledWith(jobs)
    expect(setJobs).toHaveBeenCalledTimes(1)
    const updater = setJobs.mock.calls[0][0] as (items: Job[]) => Job[]
    expect(updater(jobs).map((j) => j.id)).toEqual(['c'])
    expect(selection.removeMultiple).toHaveBeenCalledWith(['a', 'b'])
    expect(addNotification).toHaveBeenCalledWith(
      'Deleted 2 visible job(s). 1 hidden selection(s) kept.',
      'success',
    )
  })

  it('showOverdueOnly switches to table and applies overdue filter', () => {
    const updateView = vi.fn()
    const showOverdueFilter = vi.fn()

    const { result } = renderHook(() =>
      useAppActions({
        jobs: [makeJob({ id: 'a' })],
        setJobs: vi.fn(),
        selection: {
          selectedIds: new Set(),
          toggle: vi.fn(),
          toggleAll: vi.fn(),
          removeMultiple: vi.fn(),
        },
        visibleTableIds: [],
        selectedVisibleIds: [],
        allVisibleSelected: false,
        undo: { pushState: vi.fn(), undo: vi.fn() },
        addNotification: vi.fn(),
        removeJobHelper: vi.fn(),
        quickMoveHelper: vi.fn(),
        startEdit: vi.fn(),
        openViewOnly: vi.fn(),
        closeViewOnly: vi.fn(),
        updateView,
        showOverdueFilter,
      }),
    )

    act(() => {
      result.current.showOverdueOnly()
    })

    expect(updateView).toHaveBeenCalledWith('table')
    expect(showOverdueFilter).toHaveBeenCalledTimes(1)
  })
})
