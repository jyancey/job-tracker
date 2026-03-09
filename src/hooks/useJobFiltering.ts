import { useMemo } from 'react'
import type { Job } from '../domain'
import { isOverdueFollowUp, compareDates, getTodayString } from '../utils/dateUtils'
import { compareStrings } from '../utils/stringUtils'
import { parseSalaryRange } from '../utils/salaryUtils'
import { calculateJobScore, DEFAULT_SCORE_WEIGHTS } from '../scoring'
import type { FilterOptions, SortOptions, PaginationOptions } from '../types/filters'
import { searchJobs } from '../features/search/searchJobs'

// Re-export types from centralized location for backward compatibility
export type { StatusFilter, SortColumn, SortDirection, FilterOptions, SortOptions, PaginationOptions } from '../types/filters'

export function useJobFiltering(jobs: Job[], filterOptions: FilterOptions) {
  const filteredJobs = useMemo(() => {
    const today = getTodayString()

    const queryMatchedJobs = searchJobs(jobs, filterOptions.query)

    return queryMatchedJobs.filter((job) => {
      const matchesStatus =
        filterOptions.statusFilter === 'All'
          ? true
          : filterOptions.statusFilter === 'Overdue Follow-ups'
            ? isOverdueFollowUp(job, today)
            : job.status === filterOptions.statusFilter

      const matchesDateRange =
        (!filterOptions.dateRangeStart || job.applicationDate >= filterOptions.dateRangeStart) &&
        (!filterOptions.dateRangeEnd || job.applicationDate <= filterOptions.dateRangeEnd)
      
      const matchesSalaryRange = 
        !filterOptions.salaryRangeMin && !filterOptions.salaryRangeMax 
          ? true 
          : parseSalaryRange(job.salaryRange, filterOptions.salaryRangeMin, filterOptions.salaryRangeMax)
      
      const matchesContactPerson =
        !filterOptions.contactPersonFilter || 
        job.contactPerson.toLowerCase().includes(filterOptions.contactPersonFilter.toLowerCase())

      return matchesStatus && matchesDateRange && matchesSalaryRange && matchesContactPerson
    })
  }, [jobs, filterOptions.query, filterOptions.statusFilter, filterOptions.dateRangeStart, filterOptions.dateRangeEnd, filterOptions.salaryRangeMin, filterOptions.salaryRangeMax, filterOptions.contactPersonFilter])

  const overdueCount = useMemo(() => {
    const today = getTodayString()
    return jobs.filter((job) => job.nextActionDueDate && job.nextActionDueDate < today).length
  }, [jobs])

  return { filteredJobs, overdueCount }
}

export function useJobSorting(jobs: Job[], sortOptions: SortOptions) {
  return useMemo(() => {
    const sorted = [...jobs]

    sorted.sort((a, b) => {
      if (sortOptions.sortColumn === 'applicationDate') {
        return compareDates(a.applicationDate, b.applicationDate, sortOptions.sortDirection)
      }
      if (sortOptions.sortColumn === 'nextActionDueDate') {
        return compareDates(a.nextActionDueDate, b.nextActionDueDate, sortOptions.sortDirection)
      }
      if (sortOptions.sortColumn === 'company') {
        return compareStrings(a.company, b.company, sortOptions.sortDirection)
      }
      if (sortOptions.sortColumn === 'roleTitle') {
        return compareStrings(a.roleTitle, b.roleTitle, sortOptions.sortDirection)
      }
      if (sortOptions.sortColumn === 'score') {
        const scoreA = calculateJobScore(a, DEFAULT_SCORE_WEIGHTS)
        const scoreB = calculateJobScore(b, DEFAULT_SCORE_WEIGHTS)
        
        // Unscored jobs go to the end (or beginning if asc)
        if (scoreA === null && scoreB === null) return 0
        if (scoreA === null) return sortOptions.sortDirection === 'desc' ? 1 : -1
        if (scoreB === null) return sortOptions.sortDirection === 'desc' ? -1 : 1
        
        // Compare scores
        const diff = scoreA - scoreB
        return sortOptions.sortDirection === 'desc' ? -diff : diff
      }
      return compareStrings(a.status, b.status, sortOptions.sortDirection)
    })

    return sorted
  }, [jobs, sortOptions.sortColumn, sortOptions.sortDirection])
}

export function useJobPagination(jobs: Job[], pagination: PaginationOptions) {
  const totalPages = useMemo(() => {
    if (!jobs.length) {
      return 1
    }
    return Math.ceil(jobs.length / pagination.pageSize)
  }, [jobs.length, pagination.pageSize])

  const paginatedJobs = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize
    return jobs.slice(start, start + pagination.pageSize)
  }, [jobs, pagination.currentPage, pagination.pageSize])

  return { paginatedJobs, totalPages }
}
