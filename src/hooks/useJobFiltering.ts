import { useMemo } from 'react'
import type { Job } from '../domain'
import { isOverdueFollowUp, compareDates, getTodayString } from '../utils/dateUtils'
import { compareStrings } from '../utils/stringUtils'
import { parseSalaryRange } from '../utils/salaryUtils'
import type { FilterOptions, SortOptions, PaginationOptions } from '../types/filters'

// Re-export types from centralized location for backward compatibility
export type { StatusFilter, SortColumn, SortDirection, FilterOptions, SortOptions, PaginationOptions } from '../types/filters'

export function useJobFiltering(jobs: Job[], filterOptions: FilterOptions) {
  const filteredJobs = useMemo(() => {
    const lowerQuery = filterOptions.query.toLowerCase().trim()
    const today = getTodayString()

    return jobs.filter((job) => {
      const matchesStatus =
        filterOptions.statusFilter === 'All'
          ? true
          : filterOptions.statusFilter === 'Overdue Follow-ups'
            ? isOverdueFollowUp(job, today)
            : job.status === filterOptions.statusFilter
      
      const matchesQuery =
        !lowerQuery ||
        job.company.toLowerCase().includes(lowerQuery) ||
        job.roleTitle.toLowerCase().includes(lowerQuery) ||
        job.notes.toLowerCase().includes(lowerQuery)
      
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

      return matchesStatus && matchesQuery && matchesDateRange && matchesSalaryRange && matchesContactPerson
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
