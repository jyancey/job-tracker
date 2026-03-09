import { useMemo, type RefObject } from 'react'
import type { Job, JobStatus } from '../domain'
import type { SortColumn, SortDirection } from './useJobFiltering'
import type { TableViewContextValue } from '../views/table/TableViewContext'

interface UseTableViewContextParams {
  paginatedJobs: Job[]
  sortedJobs: Job[]
  selectedIds: Set<string>
  selectedVisibleCount: number
  allVisibleSelected: boolean
  sortColumn: SortColumn
  sortDirection: SortDirection
  currentPage: number
  totalPages: number
  pageSize: number
  searchQuery: string
  handleSort: (column: SortColumn) => void
  toggleJobSelection: (id: string) => void
  toggleSelectAllVisible: () => void
  bulkDeleteSelected: () => void
  handleCompare: () => void
  handleQuickMoveJob: (id: string, status: JobStatus) => void
  handleEditJob: (job: Job) => void
  handleRemoveJob: (id: string) => void
  openViewOnly: (job: Job) => void
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  selectAllCheckboxRef: RefObject<HTMLInputElement | null>
}

/**
 * Composes the TableViewContext value from various state and handlers.
 * Memoizes the context object to prevent unnecessary re-renders of TableView.
 */
export function useTableViewContext(params: UseTableViewContextParams): TableViewContextValue {
  const {
    paginatedJobs,
    sortedJobs,
    selectedIds,
    selectedVisibleCount,
    allVisibleSelected,
    sortColumn,
    sortDirection,
    currentPage,
    totalPages,
    pageSize,
    searchQuery,
    handleSort,
    toggleJobSelection,
    toggleSelectAllVisible,
    bulkDeleteSelected,
    handleCompare,
    handleQuickMoveJob,
    handleEditJob,
    handleRemoveJob,
    openViewOnly,
    setCurrentPage,
    setPageSize,
    selectAllCheckboxRef,
  } = params

  /* eslint-disable react-hooks/exhaustive-deps */
  const contextValue = useMemo(
    () => ({
      paginatedJobs: paginatedJobs,
      sortedJobs: sortedJobs,
      selectedIds: selectedIds,
      selectedVisibleCount,
      allVisibleSelected,
      sortColumn,
      sortDirection,
      currentPage,
      totalPages,
      pageSize,
      searchQuery,
      onSort: handleSort,
      onToggleSelection: toggleJobSelection,
      onToggleSelectAll: toggleSelectAllVisible,
      onBulkDelete: bulkDeleteSelected,
      onCompare: handleCompare,
      onQuickMove: handleQuickMoveJob,
      onEdit: handleEditJob,
      onRemove: handleRemoveJob,
      onView: openViewOnly,
      onPageChange: setCurrentPage,
      onPageSizeChange: setPageSize,
      selectAllCheckboxRef,
    }),
    [
      paginatedJobs,
      sortedJobs,
      selectedIds,
      selectedVisibleCount,
      allVisibleSelected,
      sortColumn,
      sortDirection,
      currentPage,
      totalPages,
      pageSize,
      searchQuery,
    ],
  )
  /* eslint-enable react-hooks/exhaustive-deps */

  return contextValue
}
