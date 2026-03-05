import { useCallback, useState } from 'react'
import type { StatusFilter } from '../types/filters'
import type { FilterAction, FilterState } from '../components/FilterToolbar'

/**
 * Custom hook to manage all filter-related state
 * Consolidates 8 individual useState calls into a single composable hook
 *
 * Returns:
 * - state: Current filter values
 * - dispatch: Handle FilterAction events (for use with FilterToolbar)
 * - updateFilter: Batch update filter values
 * - updateQuery: Update search query
 * - updateStatusFilter: Update status filter
 * - updateDateRange: Update date range (start and/or end)
 * - updateSalaryRange: Update salary range (min and/or max)
 * - updateContactPersonFilter: Update contact person filter
 * - toggleAdvancedFilters: Toggle visibility of advanced filters
 * - clearAdvancedFilters: Reset all advanced filter values
 */

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

  const dispatch = useCallback((action: FilterAction) => {
    setState((prev) => {
      switch (action.type) {
        case 'query':
          return { ...prev, query: action.value }
        case 'status':
          return { ...prev, statusFilter: action.value }
        case 'dateStart':
          return { ...prev, dateRangeStart: action.value }
        case 'dateEnd':
          return { ...prev, dateRangeEnd: action.value }
        case 'salaryMin':
          return { ...prev, salaryRangeMin: action.value }
        case 'salaryMax':
          return { ...prev, salaryRangeMax: action.value }
        case 'contact':
          return { ...prev, contactPersonFilter: action.value }
        default:
          return prev
      }
    })
  }, [])

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
    dispatch,
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
