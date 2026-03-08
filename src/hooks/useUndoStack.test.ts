import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUndoStack } from './useUndoStack'
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

describe('useUndoStack', () => {
  it('initializes with empty undo stack', () => {
    const { result } = renderHook(() => useUndoStack())

    expect(result.current.undoStack).toEqual([])
    expect(result.current.canUndo).toBe(false)
  })

  it('pushState adds to the stack', () => {
    const { result } = renderHook(() => useUndoStack())
    const jobs = [createJob('1')]

    act(() => result.current.pushState(jobs))

    expect(result.current.undoStack).toHaveLength(1)
    expect(result.current.undoStack[0]).toBe(jobs)
    expect(result.current.canUndo).toBe(true)
  })

  it('pushState can add multiple states', () => {
    const { result } = renderHook(() => useUndoStack())
    const jobs1 = [createJob('1')]
    const jobs2 = [createJob('1'), createJob('2')]
    const jobs3 = [createJob('1'), createJob('2'), createJob('3')]

    act(() => {
      result.current.pushState(jobs1)
      result.current.pushState(jobs2)
      result.current.pushState(jobs3)
    })

    expect(result.current.undoStack).toHaveLength(3)
  })

  it('undo returns the last state and pops from stack', () => {
    const { result } = renderHook(() => useUndoStack())
    const jobs1 = [createJob('1')]
    const jobs2 = [createJob('1'), createJob('2')]

    act(() => {
      result.current.pushState(jobs1)
      result.current.pushState(jobs2)
    })

    expect(result.current.undoStack).toHaveLength(2)

    act(() => {
      result.current.undo()
    })

    expect(result.current.undoStack).toHaveLength(1)
    expect(result.current.undoStack[0]).toBe(jobs1)
  })

  it('undo removes item every time it is called', () => {
    const { result } = renderHook(() => useUndoStack())
    const jobs1 = [createJob('1')]
    const jobs2 = [createJob('1'), createJob('2')]
    const jobs3 = [createJob('1'), createJob('2'), createJob('3')]

    act(() => {
      result.current.pushState(jobs1)
      result.current.pushState(jobs2)
      result.current.pushState(jobs3)
    })

    expect(result.current.undoStack).toHaveLength(3)

    act(() => result.current.undo())
    expect(result.current.undoStack).toHaveLength(2)
    expect(result.current.undoStack[1]).toBe(jobs2)

    act(() => result.current.undo())
    expect(result.current.undoStack).toHaveLength(1)
    expect(result.current.undoStack[0]).toBe(jobs1)

    act(() => result.current.undo())
    expect(result.current.undoStack).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
  })

  it('undo returns undefined when stack is empty', () => {
    const { result } = renderHook(() => useUndoStack())

    expect(result.current.undoStack).toHaveLength(0)

    act(() => {
      result.current.undo()
    })

    expect(result.current.undoStack).toHaveLength(0)
  })

  it('canUndo reflects stack state accurately', () => {
    const { result } = renderHook(() => useUndoStack())
    const jobs = [createJob('1')]

    expect(result.current.canUndo).toBe(false)

    act(() => result.current.pushState(jobs))
    expect(result.current.canUndo).toBe(true)

    act(() => result.current.undo())
    expect(result.current.canUndo).toBe(false)
  })

  it('maintains correct LIFO (Last In First Out) order', () => {
    const { result } = renderHook(() => useUndoStack())
    const jobs1 = [createJob('1')]
    const jobs2 = [createJob('2')]
    const jobs3 = [createJob('3')]

    act(() => {
      result.current.pushState(jobs1)
      result.current.pushState(jobs2)
      result.current.pushState(jobs3)
    })

    // First undo should pop jobs3
    act(() => result.current.undo())
    expect(result.current.undoStack).toHaveLength(2)
    expect(result.current.undoStack[1][0].id).toBe('2')

    // Second undo should pop jobs2
    act(() => result.current.undo())
    expect(result.current.undoStack).toHaveLength(1)
    expect(result.current.undoStack[0][0].id).toBe('1')

    // Third undo should pop jobs1
    act(() => result.current.undo())
    expect(result.current.undoStack).toHaveLength(0)
  })
})
