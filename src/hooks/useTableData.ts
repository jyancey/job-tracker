// Orchestrates filtering, sorting, and pagination pipeline for table view data.
import { useMemo } from 'react'
import type { Job } from '../domain'
import type { FilterOptions, PaginationOptions, SortOptions } from '../types/filters'
import { useJobFiltering } from './useJobFiltering'
import { useJobSorting } from './useJobFiltering'
import { useJobPagination } from './useJobFiltering'

/**
 * Composed hook that orchestrates filtering, sorting, and pagination
 * Provides a clean data transformation pipeline for table views
 *
 * Returns:
 * - paginatedJobs: Final jobs to display in table
 * - filteredJobs: Jobs after filtering (before sorting/pagination)
 * - sortedJobs: Jobs after filtering and sorting
 * - overdueCount: Count of overdue follow-ups in full dataset
 * - totalPages: Total pages based on pagination settings
 * - filteredCount: Count of jobs matching filters
 */

export interface TableDataResult {
  paginatedJobs: Job[]
  filteredJobs: Job[]
  sortedJobs: Job[]
  overdueCount: number
  totalPages: number
  filteredCount: number
}

export function useTableData(
  jobs: Job[],
  filters: FilterOptions,
  sort: SortOptions,
  pagination: PaginationOptions,
): TableDataResult {
  const { filteredJobs, overdueCount } = useJobFiltering(jobs, filters)
  const sortedJobs = useJobSorting(filteredJobs, sort)
  const { paginatedJobs, totalPages } = useJobPagination(sortedJobs, pagination)

  const result = useMemo<TableDataResult>(() => {
    return {
      paginatedJobs,
      filteredJobs,
      sortedJobs,
      overdueCount,
      totalPages,
      filteredCount: filteredJobs.length,
    }
  }, [paginatedJobs, filteredJobs, sortedJobs, overdueCount, totalPages])

  return result
}
