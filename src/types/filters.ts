import type { JobStatus } from '../domain'

/**
 * Filter and sort type definitions - centralized for consistency across the app
 */

export type StatusFilter = 'All' | JobStatus | 'Overdue Follow-ups'
export type SortColumn = 'company' | 'roleTitle' | 'status' | 'applicationDate' | 'nextActionDueDate'
export type SortDirection = 'asc' | 'desc'

export interface FilterOptions {
  query: string
  statusFilter: StatusFilter
  dateRangeStart: string
  dateRangeEnd: string
  salaryRangeMin: string
  salaryRangeMax: string
  contactPersonFilter: string
}

export interface SortOptions {
  sortColumn: SortColumn
  sortDirection: SortDirection
}

export interface PaginationOptions {
  currentPage: number
  pageSize: number
}
