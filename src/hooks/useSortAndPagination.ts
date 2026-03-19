// Manages sort column/direction state and pagination together with auto-reset on page count changes.
import { useCallback, useState } from 'react'
import type { SortColumn, SortDirection } from './useJobFiltering'

interface UseSortAndPaginationProps {
  totalPages: number
}

/**
 * Manages sort state and pagination state together.
 * Auto-resets current page when totalPages changes.
 * Provides sort direction toggle and column selection handlers.
 */
export function useSortAndPagination({ totalPages }: UseSortAndPaginationProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('applicationDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const safeCurrentPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1

  const handleSort = useCallback((column: SortColumn) => {
    setSortColumn((prevColumn) => {
      setSortDirection((prevDirection) => {
        // If same column, toggle direction
        if (prevColumn === column) {
          return prevDirection === 'asc' ? 'desc' : 'asc'
        }
        // If new column, set default direction (desc for dates, asc for others)
        return column === 'applicationDate' || column === 'nextActionDueDate' ? 'desc' : 'asc'
      })
      return column
    })
  }, [])

  return {
    sortColumn,
    sortDirection,
    currentPage: safeCurrentPage,
    pageSize,
    setSortColumn,
    setSortDirection,
    setCurrentPage,
    setPageSize,
    handleSort,
  }
}
