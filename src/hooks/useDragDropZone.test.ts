import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDragDropZone } from './useDragDropZone'
import type { JobStatus } from '../domain'

vi.mock('../utils/dragDataUtils', () => ({
  getJobDragData: vi.fn(),
}))

import { getJobDragData } from '../utils/dragDataUtils'

function createDragEvent(overrides: Partial<React.DragEvent<HTMLElement>> = {}) {
  const preventDefault = vi.fn()
  const dataTransfer = { dropEffect: 'none' } as DataTransfer
  const currentTarget = {} as EventTarget & HTMLElement
  const target = currentTarget

  return {
    preventDefault,
    dataTransfer,
    currentTarget,
    target,
    ...overrides,
  } as React.DragEvent<HTMLElement>
}

describe('useDragDropZone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with isDragOver false', () => {
    const { result } = renderHook(() => useDragDropZone('Applied', vi.fn()))

    expect(result.current.isDragOver).toBe(false)
  })

  it('sets isDragOver true on drag over and sets dropEffect to move', () => {
    const { result } = renderHook(() => useDragDropZone('Applied', vi.fn()))
    const event = createDragEvent()

    act(() => {
      result.current.handleDragOver(event)
    })

    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(event.dataTransfer.dropEffect).toBe('move')
    expect(result.current.isDragOver).toBe(true)
  })

  it('sets isDragOver false on drag leave when leaving current target', () => {
    const { result } = renderHook(() => useDragDropZone('Applied', vi.fn()))

    act(() => {
      result.current.handleDragOver(createDragEvent())
    })
    expect(result.current.isDragOver).toBe(true)

    const sameTarget = {} as EventTarget & HTMLElement
    const leaveEvent = createDragEvent({ currentTarget: sameTarget, target: sameTarget })
    act(() => {
      result.current.handleDragLeave(leaveEvent)
    })

    expect(result.current.isDragOver).toBe(false)
  })

  it('keeps isDragOver true on drag leave when moving between children', () => {
    const { result } = renderHook(() => useDragDropZone('Applied', vi.fn()))

    act(() => {
      result.current.handleDragOver(createDragEvent())
    })

    const currentTarget = {} as EventTarget & HTMLElement
    const childTarget = {} as EventTarget & HTMLElement
    const leaveEvent = createDragEvent({ currentTarget, target: childTarget })

    act(() => {
      result.current.handleDragLeave(leaveEvent)
    })

    expect(result.current.isDragOver).toBe(true)
  })

  it('on drop resets isDragOver and calls onStatusChange when status differs', () => {
    const onStatusChange = vi.fn()
    const { result } = renderHook(() => useDragDropZone('Interview', onStatusChange))

    vi.mocked(getJobDragData).mockReturnValue({
      id: 'job-1',
      status: 'Applied' as JobStatus,
    } as never)

    act(() => {
      result.current.handleDragOver(createDragEvent())
    })
    expect(result.current.isDragOver).toBe(true)

    const dropEvent = createDragEvent()
    act(() => {
      result.current.handleDrop(dropEvent)
    })

    expect(dropEvent.preventDefault).toHaveBeenCalledTimes(1)
    expect(result.current.isDragOver).toBe(false)
    expect(onStatusChange).toHaveBeenCalledWith('job-1', 'Interview')
  })

  it('does not call onStatusChange when dropped job already has target status', () => {
    const onStatusChange = vi.fn()
    const { result } = renderHook(() => useDragDropZone('Applied', onStatusChange))

    vi.mocked(getJobDragData).mockReturnValue({
      id: 'job-1',
      status: 'Applied' as JobStatus,
    } as never)

    act(() => {
      result.current.handleDrop(createDragEvent())
    })

    expect(onStatusChange).not.toHaveBeenCalled()
  })

  it('does not call onStatusChange when dropped payload is invalid', () => {
    const onStatusChange = vi.fn()
    const { result } = renderHook(() => useDragDropZone('Applied', onStatusChange))

    vi.mocked(getJobDragData).mockReturnValue(null as never)

    act(() => {
      result.current.handleDrop(createDragEvent())
    })

    expect(onStatusChange).not.toHaveBeenCalled()
  })
})
