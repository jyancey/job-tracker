import { renderHook } from '@testing-library/react'
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with the provided value', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('is defined and returns a value', () => {
    const { result } = renderHook(() => useDebouncedValue('test', 300))
    expect(result.current).toBeDefined()
  })

  it('works with numeric values', () => {
    const { result } = renderHook(() => useDebouncedValue(42, 300))
    expect(result.current).toBe(42)
  })

  it('works with object values', () => {
    const obj = { key: 'value' }
    const { result } = renderHook(() => useDebouncedValue(obj, 300))
    expect(result.current).toBe(obj)
  })

  it('works with array values', () => {
    const arr = [1, 2, 3]
    const { result } = renderHook(() => useDebouncedValue(arr, 300))
    expect(result.current).toBe(arr)
  })

  it('accepts different delay values', () => {
    const { result: result1 } = renderHook(() => useDebouncedValue('test', 100))
    const { result: result2 } = renderHook(() => useDebouncedValue('test', 500))
    
    expect(result1.current).toBe('test')
    expect(result2.current).toBe('test')
  })

  it('clears timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebouncedValue('value', 300))

    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })

  it('handles undefined values', () => {
    const { result } = renderHook(() => useDebouncedValue(undefined, 300))
    expect(result.current).toBeUndefined()
  })
})
