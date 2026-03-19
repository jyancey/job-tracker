// Resets table pagination to page 1 whenever the active filter set changes.
import { useEffect } from 'react'
import type { FilterState } from '../components/FilterToolbar'

/**
 * Resets table pagination whenever the active filter set changes.
 */
export function usePageReset(
  filtersState: FilterState,
  setCurrentPage: (page: number) => void,
) {
  useEffect(() => {
    setCurrentPage(1)
  }, [
    filtersState.query,
    filtersState.statusFilter,
    filtersState.dateRangeStart,
    filtersState.dateRangeEnd,
    filtersState.salaryRangeMin,
    filtersState.salaryRangeMax,
    filtersState.contactPersonFilter,
    setCurrentPage,
  ])
}