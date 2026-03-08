import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTableSelectionState } from './useTableSelectionState'
import type { Job } from '../domain'

function createJob(id: string): Job {
  return {
    id,
    company: `Company ${id}`,
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

describe('useTableSelectionState', () => {
  it('computes visible and selected ids correctly', () => {
    const paginatedJobs = [createJob('1'), createJob('2'), createJob('3')]
    const selectedIds = new Set(['2', '3', '999'])
    const selectAllCheckboxRef = { current: document.createElement('input') }

    const { result } = renderHook(() =>
      useTableSelectionState(paginatedJobs, selectedIds, selectAllCheckboxRef),
    )

    expect(result.current.visibleTableIds).toEqual(['1', '2', '3'])
    expect(result.current.selectedVisibleIds).toEqual(['2', '3'])
    expect(result.current.selectedVisibleCount).toBe(2)
    expect(result.current.allVisibleSelected).toBe(false)
    expect(result.current.someVisibleSelected).toBe(true)
    expect(selectAllCheckboxRef.current?.indeterminate).toBe(true)
  })

  it('marks all visible selected when all ids are selected', () => {
    const paginatedJobs = [createJob('a'), createJob('b')]
    const selectedIds = new Set(['a', 'b'])
    const selectAllCheckboxRef = { current: document.createElement('input') }

    const { result } = renderHook(() =>
      useTableSelectionState(paginatedJobs, selectedIds, selectAllCheckboxRef),
    )

    expect(result.current.allVisibleSelected).toBe(true)
    expect(result.current.someVisibleSelected).toBe(false)
    expect(selectAllCheckboxRef.current?.indeterminate).toBe(false)
  })

  it('handles empty page state', () => {
    const selectAllCheckboxRef = { current: document.createElement('input') }

    const { result } = renderHook(() =>
      useTableSelectionState([], new Set(['a']), selectAllCheckboxRef),
    )

    expect(result.current.visibleTableIds).toEqual([])
    expect(result.current.selectedVisibleIds).toEqual([])
    expect(result.current.selectedVisibleCount).toBe(0)
    expect(result.current.allVisibleSelected).toBe(false)
    expect(result.current.someVisibleSelected).toBe(false)
  })
})
