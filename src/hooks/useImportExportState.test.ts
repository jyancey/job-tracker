import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useImportExportState } from './useImportExportState'

describe('useImportExportState', () => {
  it('initializes with append mode', () => {
    const { result } = renderHook(() => useImportExportState())

    expect(result.current.importMode).toBe('append')
  })

  it('updates import mode', () => {
    const { result } = renderHook(() => useImportExportState())

    act(() => {
      result.current.updateImportMode('replace')
    })

    expect(result.current.importMode).toBe('replace')
  })

  it('switches between import modes', () => {
    const { result } = renderHook(() => useImportExportState())

    act(() => {
      result.current.updateImportMode('append')
    })
    expect(result.current.importMode).toBe('append')

    act(() => {
      result.current.updateImportMode('upsert')
    })
    expect(result.current.importMode).toBe('upsert')

    act(() => {
      result.current.updateImportMode('replace')
    })
    expect(result.current.importMode).toBe('replace')
  })

  it('provides importFileRef map', () => {
    const { result } = renderHook(() => useImportExportState())

    expect(result.current.importFileRef).toBeDefined()
    expect(result.current.importFileRef instanceof Map).toBe(true)
  })

  it('provides getFileRef callback', () => {
    const { result } = renderHook(() => useImportExportState())

    expect(typeof result.current.getFileRef).toBe('function')
    expect(result.current.getFileRef()).toBe(null)
  })

  it('maintains independent hook instances', () => {
    const { result: result1 } = renderHook(() => useImportExportState())
    const { result: result2 } = renderHook(() => useImportExportState())

    act(() => {
      result1.current.updateImportMode('replace')
    })

    expect(result1.current.importMode).toBe('replace')
    expect(result2.current.importMode).toBe('append')
  })
})
