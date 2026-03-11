import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSelectionState } from './useSelectionState'
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

describe('useSelectionState', () => {
  it('combines selection actions with derived table selection state', () => {
    const jobs = [createJob('1'), createJob('2')]
    const { result } = renderHook(() => useSelectionState(jobs))

    act(() => {
      result.current.selection.toggle('2')
    })

    expect(result.current.visibleTableIds).toEqual(['1', '2'])
    expect(result.current.selectedVisibleIds).toEqual(['2'])
    expect(result.current.selectedVisibleCount).toBe(1)
    expect(result.current.allVisibleSelected).toBe(false)
    expect(result.current.selection.selectedIds.has('2')).toBe(true)
  })

  it('exposes a working selection ref for select-all state', () => {
    const jobs = [createJob('1')]
    const { result } = renderHook(() => useSelectionState(jobs))

    expect(result.current.selectAllCheckboxRef).toBeDefined()
    expect(result.current.selection.selectedIds.size).toBe(0)
  })
})