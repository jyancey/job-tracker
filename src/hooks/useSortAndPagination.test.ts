import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSortAndPagination } from './useSortAndPagination'

describe('useSortAndPagination', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useSortAndPagination({ totalPages: 5 }))

    expect(result.current.sortColumn).toBe('applicationDate')
    expect(result.current.sortDirection).toBe('desc')
    expect(result.current.currentPage).toBe(1)
    expect(result.current.pageSize).toBe(10)
  })

  it('updates current page and page size via setters', () => {
    const { result } = renderHook(() => useSortAndPagination({ totalPages: 5 }))

    act(() => {
      result.current.setCurrentPage(3)
      result.current.setPageSize(20)
    })

    expect(result.current.currentPage).toBe(3)
    expect(result.current.pageSize).toBe(20)
  })

  it('toggles sort direction when sorting the same column', () => {
    const { result } = renderHook(() => useSortAndPagination({ totalPages: 5 }))

    act(() => {
      result.current.handleSort('applicationDate')
    })
    expect(result.current.sortColumn).toBe('applicationDate')
    expect(result.current.sortDirection).toBe('asc')

    act(() => {
      result.current.handleSort('applicationDate')
    })
    expect(result.current.sortDirection).toBe('desc')
  })

  it('uses asc for non-date columns when switching columns', () => {
    const { result } = renderHook(() => useSortAndPagination({ totalPages: 5 }))

    act(() => {
      result.current.handleSort('company')
    })

    expect(result.current.sortColumn).toBe('company')
    expect(result.current.sortDirection).toBe('asc')
  })

  it('uses desc for date columns when switching columns', () => {
    const { result } = renderHook(() => useSortAndPagination({ totalPages: 5 }))

    act(() => {
      result.current.handleSort('company')
    })
    expect(result.current.sortDirection).toBe('asc')

    act(() => {
      result.current.handleSort('nextActionDueDate')
    })
    expect(result.current.sortColumn).toBe('nextActionDueDate')
    expect(result.current.sortDirection).toBe('desc')
  })

  it('clamps currentPage down when totalPages decreases', () => {
    const { result, rerender } = renderHook(
      ({ totalPages }) => useSortAndPagination({ totalPages }),
      { initialProps: { totalPages: 8 } },
    )

    act(() => {
      result.current.setCurrentPage(7)
    })
    expect(result.current.currentPage).toBe(7)

    rerender({ totalPages: 3 })
    expect(result.current.currentPage).toBe(3)
  })

  it('keeps currentPage unchanged when still within totalPages', () => {
    const { result, rerender } = renderHook(
      ({ totalPages }) => useSortAndPagination({ totalPages }),
      { initialProps: { totalPages: 8 } },
    )

    act(() => {
      result.current.setCurrentPage(4)
    })

    rerender({ totalPages: 6 })
    expect(result.current.currentPage).toBe(4)
  })
})
