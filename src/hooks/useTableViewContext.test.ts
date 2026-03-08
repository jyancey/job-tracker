import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTableViewContext } from './useTableViewContext'
import { createRef } from 'react'

describe('useTableViewContext', () => {
  it('should compose context value with all provided parameters', () => {
    const mockParams = {
      paginatedJobs: [],
      sortedJobs: [],
      selectedIds: new Set<number>(),
      selectedVisibleCount: 0,
      allVisibleSelected: false,
      sortColumn: 'applicationDate' as const,
      sortDirection: 'desc' as const,
      currentPage: 1,
      totalPages: 5,
      pageSize: 10,
      handleSort: () => {},
      toggleJobSelection: () => {},
      toggleSelectAllVisible: () => {},
      bulkDeleteSelected: () => {},
      handleCompare: () => {},
      handleQuickMoveJob: () => {},
      handleEditJob: () => {},
      handleRemoveJob: () => {},
      openViewOnly: () => {},
      setCurrentPage: () => {},
      setPageSize: () => {},
      selectAllCheckboxRef: createRef<HTMLInputElement>(),
    }

    const { result } = renderHook(() => useTableViewContext(mockParams))

    expect(result.current).toMatchObject({
      paginatedJobs: [],
      sortedJobs: [],
      selectedIds: new Set(),
      selectedVisibleCount: 0,
      allVisibleSelected: false,
      sortColumn: 'applicationDate',
      sortDirection: 'desc',
      currentPage: 1,
      totalPages: 5,
      pageSize: 10,
    })
    expect(result.current.onSort).toBe(mockParams.handleSort)
    expect(result.current.onToggleSelection).toBe(mockParams.toggleJobSelection)
    expect(result.current.onToggleSelectAll).toBe(mockParams.toggleSelectAllVisible)
    expect(result.current.onBulkDelete).toBe(mockParams.bulkDeleteSelected)
    expect(result.current.onCompare).toBe(mockParams.handleCompare)
    expect(result.current.onQuickMove).toBe(mockParams.handleQuickMoveJob)
    expect(result.current.onEdit).toBe(mockParams.handleEditJob)
    expect(result.current.onRemove).toBe(mockParams.handleRemoveJob)
    expect(result.current.onView).toBe(mockParams.openViewOnly)
    expect(result.current.onPageChange).toBe(mockParams.setCurrentPage)
    expect(result.current.onPageSizeChange).toBe(mockParams.setPageSize)
    expect(result.current.selectAllCheckboxRef).toBe(mockParams.selectAllCheckboxRef)
  })

  it('should memoize context value based on data dependencies', () => {
    const mockParams = {
      paginatedJobs: [],
      sortedJobs: [],
      selectedIds: new Set<number>(),
      selectedVisibleCount: 0,
      allVisibleSelected: false,
      sortColumn: 'applicationDate' as const,
      sortDirection: 'desc' as const,
      currentPage: 1,
      totalPages: 5,
      pageSize: 10,
      handleSort: () => {},
      toggleJobSelection: () => {},
      toggleSelectAllVisible: () => {},
      bulkDeleteSelected: () => {},
      handleCompare: () => {},
      handleQuickMoveJob: () => {},
      handleEditJob: () => {},
      handleRemoveJob: () => {},
      openViewOnly: () => {},
      setCurrentPage: () => {},
      setPageSize: () => {},
      selectAllCheckboxRef: createRef<HTMLInputElement>(),
    }

    const { result, rerender } = renderHook((props) => useTableViewContext(props), {
      initialProps: mockParams,
    })

    const firstRender = result.current

    // Rerender with same data dependencies but new handler references
    rerender({
      ...mockParams,
      handleSort: () => {}, // New function reference
      toggleJobSelection: () => {}, // New function reference
    })

    // Context should be the same object (memoized)
    expect(result.current).toBe(firstRender)

    // Rerender with different data dependency
    rerender({
      ...mockParams,
      currentPage: 2, // Changed data dependency
    })

    // Context should be a new object
    expect(result.current).not.toBe(firstRender)
    expect(result.current.currentPage).toBe(2)
  })

  it('should include ref without triggering memo updates', () => {
    const ref = createRef<HTMLInputElement>()
    const mockParams = {
      paginatedJobs: [],
      sortedJobs: [],
      selectedIds: new Set<number>(),
      selectedVisibleCount: 0,
      allVisibleSelected: false,
      sortColumn: 'applicationDate' as const,
      sortDirection: 'desc' as const,
      currentPage: 1,
      totalPages: 5,
      pageSize: 10,
      handleSort: () => {},
      toggleJobSelection: () => {},
      toggleSelectAllVisible: () => {},
      bulkDeleteSelected: () => {},
      handleCompare: () => {},
      handleQuickMoveJob: () => {},
      handleEditJob: () => {},
      handleRemoveJob: () => {},
      openViewOnly: () => {},
      setCurrentPage: () => {},
      setPageSize: () => {},
      selectAllCheckboxRef: ref,
    }

    const { result } = renderHook(() => useTableViewContext(mockParams))

    expect(result.current.selectAllCheckboxRef).toBe(ref)
  })
})
