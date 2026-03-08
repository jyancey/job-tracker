import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJobSelection } from './useJobSelection'

describe('useJobSelection', () => {
  it('initializes with empty selection', () => {
    const { result } = renderHook(() => useJobSelection())

    expect(result.current.selectedIds).toEqual(new Set())
  })

  it('toggles selection for a single job', () => {
    const { result } = renderHook(() => useJobSelection())

    act(() => result.current.toggle('job-1'))
    expect(result.current.selectedIds).toEqual(new Set(['job-1']))

    act(() => result.current.toggle('job-1'))
    expect(result.current.selectedIds).toEqual(new Set())
  })

  it('toggles multiple jobs independently', () => {
    const { result } = renderHook(() => useJobSelection())

    act(() => {
      result.current.toggle('job-1')
      result.current.toggle('job-2')
      result.current.toggle('job-3')
    })

    expect(result.current.selectedIds).toEqual(new Set(['job-1', 'job-2', 'job-3']))

    act(() => result.current.toggle('job-2'))
    expect(result.current.selectedIds).toEqual(new Set(['job-1', 'job-3']))
  })

  it('toggleAll with allSelected=false selects all provided ids', () => {
    const { result } = renderHook(() => useJobSelection())

    act(() => {
      result.current.toggle('job-1')
    })

    act(() => result.current.toggleAll(['job-1', 'job-2', 'job-3'], false))

    expect(result.current.selectedIds).toEqual(new Set(['job-1', 'job-2', 'job-3']))
  })

  it('toggleAll with allSelected=true deselects all provided ids', () => {
    const { result } = renderHook(() => useJobSelection())

    act(() => {
      result.current.addMultiple(['job-1', 'job-2', 'job-3', 'job-4'])
    })

    act(() => result.current.toggleAll(['job-1', 'job-2', 'job-3'], true))

    expect(result.current.selectedIds).toEqual(new Set(['job-4']))
  })

  it('toggleAll preserves unrelated selections', () => {
    const { result } = renderHook(() => useJobSelection())

    act(() => {
      result.current.addMultiple(['job-1', 'job-2', 'job-3', 'job-99'])
    })

    act(() => result.current.toggleAll(['job-1', 'job-2', 'job-3'], true))

    expect(result.current.selectedIds).toEqual(new Set(['job-99']))
  })

  it('clear empties the selection', () => {
    const { result } = renderHook(() => useJobSelection())

    act(() => {
      result.current.addMultiple(['job-1', 'job-2', 'job-3'])
    })

    expect(result.current.selectedIds.size).toBe(3)

    act(() => result.current.clear())

    expect(result.current.selectedIds).toEqual(new Set())
  })

  it('addMultiple adds jobs without affecting existing',() => {
    const { result } = renderHook(() => useJobSelection())

    act(() => result.current.toggle('job-1'))

    act(() => result.current.addMultiple(['job-2', 'job-3']))

    expect(result.current.selectedIds).toEqual(new Set(['job-1', 'job-2', 'job-3']))
  })

  it('removeMultiple removes specified jobs', () => {
    const { result } = renderHook(() => useJobSelection())

    act(() => {
      result.current.addMultiple(['job-1', 'job-2', 'job-3', 'job-4'])
    })

    act(() => result.current.removeMultiple(['job-1', 'job-3']))

    expect(result.current.selectedIds).toEqual(new Set(['job-2', 'job-4']))
  })

  it('removeMultiple ignores non-existent ids', () => {
    const { result } = renderHook(() => useJobSelection())

    act(() => {
      result.current.addMultiple(['job-1', 'job-2'])
    })

    act(() => result.current.removeMultiple(['job-1', 'job-999']))

    expect(result.current.selectedIds).toEqual(new Set(['job-2']))
  })
})
