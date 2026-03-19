// Composes table-focused filtering, sorting, and pagination state with debounced query support.
import {
  useJobFiltering,
  useJobSorting,
  useJobPagination,
} from './useJobFiltering'
import { useSortAndPagination } from './useSortAndPagination'
import type { Job } from '../domain'
import type { FilterState } from '../components/FilterToolbar'

interface UseTablePipelineInput {
  jobs: Job[]
  filtersState: FilterState
  debouncedQuery: string
}

/**
 * Composes table-focused filtering, sorting, and pagination state.
 */
export function useTablePipeline({
  jobs,
  filtersState,
  debouncedQuery,
}: UseTablePipelineInput) {
  const { filteredJobs, overdueCount } = useJobFiltering(jobs, {
    ...filtersState,
    query: debouncedQuery,
  })

  const sortedTableJobs = useJobSorting(filteredJobs, {
    sortColumn: 'applicationDate',
    sortDirection: 'desc',
  })

  const { totalPages: tempTotalPages } = useJobPagination(sortedTableJobs, {
    currentPage: 1,
    pageSize: 10,
  })

  const {
    sortColumn,
    sortDirection,
    currentPage,
    pageSize,
    handleSort,
    setSortColumn,
    setSortDirection,
    setCurrentPage,
    setPageSize,
  } = useSortAndPagination({ totalPages: tempTotalPages })

  const sortedJobs = useJobSorting(filteredJobs, {
    sortColumn,
    sortDirection,
  })

  const { paginatedJobs, totalPages } = useJobPagination(sortedJobs, {
    currentPage,
    pageSize,
  })

  return {
    filteredJobs,
    overdueCount,
    sortedJobs,
    paginatedJobs,
    totalPages,
    sortColumn,
    sortDirection,
    currentPage,
    pageSize,
    handleSort,
    setSortColumn,
    setSortDirection,
    setCurrentPage,
    setPageSize,
  }
}