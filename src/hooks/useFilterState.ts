import { useCallback, useState } from 'react'
import type { FilterOptions, StatusFilter } from '../types/filters'

/**
 * Custom hook to manage all filter-related state
 * Consolidates 8 individual useState calls into a single composable hook
 *
 * Returns:
 * - filterState: Current filter values
 * - updateFilter: Batch update filter values
 * - updateQuery: Update search query
 * - updateStatusFilter: Update status filter
 * - updateDateRange: Update date range (start and/or end)
 * - updateSalaryRange: Update salary range (min and/or max)
 * - updateContactPersonFilter: Update contact person filter
 * - toggleAdvancedFilters: Toggle visibility of advanced filters
 * - clearAdvancedFilters: Reset all advanced filter values
 */

export interface FilterState extends FilterOptions {
  showAdvancedFilters: boolean
}

export function useFilterState(initialState?: Partial<FilterState>) {
  const [state, setState] = useState<FilterState>({
    query: '',
    statusFilter: 'All',
    dateRangeStart: '',
    dateRangeEnd: '',
    salaryRangeMin: '',
    salaryRangeMax: '',
    contactPersonFilter: '',
    showAdvancedFilters: false,
    ...initialState,
  })

  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }))
  }, [])

  const updateStatusFilter = useCallback((statusFilter: StatusFilter) => {
    setState((prev) => ({ ...prev, statusFilter }))
  }, [])

  const updateDateRange = useCallback((start: string, end: string) => {
    setState((prev) => ({
      ...prev,
      dateRangeStart: start,
      dateRangeEnd: end,
    }))
  }, [])

  const updateSalaryRange = useCallback((min: string, max: string) => {
    setState((prev) => ({
      ...prev,
      salaryRangeMin: min,
      salaryRangeMax: max,
    }))
  }, [])

  const updateContactPersonFilter = useCallback((contact: string) => {
    setState((prev) => ({ ...prev, contactPersonFilter: contact }))
  }, [])

  const toggleAdvancedFilters = useCallback(() => {
    setState((prev) => ({ ...prev, showAdvancedFilters: !prev.showAdvancedFilters }))
  }, [])

  const clearAdvancedFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dateRangeStart: '',
      dateRangeEnd: '',
      salaryRangeMin: '',
      salaryRangeMax: '',
      contactPersonFilter: '',
    }))
  }, [])

  return {
    state,
    updateFilter,
    updateQuery,
    updateStatusFilter,
    updateDateRange,
    updateSalaryRange,
    updateContactPersonFilter,
    toggleAdvancedFilters,
    clearAdvancedFilters,
  }
}
