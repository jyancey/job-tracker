import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAppState } from './useAppState'

vi.mock('./useJobPersistence', () => ({
  useJobPersistence: vi.fn(() => ({
    saveStatus: 'pending',
  })),
}))

describe('useAppState', () => {
  it('initializes app-level state and exposes persistence status', () => {
    const { result } = renderHook(() => useAppState(vi.fn()))

    expect(result.current.jobs).toEqual([])
    expect(result.current.activeSavedViewId).toBe('')
    expect(result.current.saveStatus).toBe('pending')
    expect(typeof result.current.setJobs).toBe('function')
    expect(typeof result.current.setActiveSavedViewId).toBe('function')
  })
})