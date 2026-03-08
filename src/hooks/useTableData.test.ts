import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Job, JobStatus } from '../domain'
import { useTableData } from './useTableData'
import type { FilterOptions, PaginationOptions, SortOptions } from '../types/filters'

// Mock the composed hooks
vi.mock('./useJobFiltering', () => ({
  useJobFiltering: vi.fn(),
  useJobSorting: vi.fn(),
  useJobPagination: vi.fn(),
}))

import { useJobFiltering, useJobSorting, useJobPagination } from './useJobFiltering'

const mockedUseJobFiltering = vi.mocked(useJobFiltering)
const mockedUseJobSorting = vi.mocked(useJobSorting)
const mockedUseJobPagination = vi.mocked(useJobPagination)

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    company: 'Tech Corp',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-08',
    status: 'Applied' as JobStatus,
    jobUrl: 'https://example.com',
    atsUrl: 'https://ats.example.com',
    salaryRange: '$100k-$120k',
    notes: 'Good fit',
    contactPerson: 'John',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-15',
    createdAt: '2026-03-08T10:00:00Z',
    updatedAt: '2026-03-08T10:00:00Z',
    ...overrides,
  }
}

describe('useTableData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('combines filtered, sorted, and paginated data', () => {
    const jobs = [createJob({ id: '1' }), createJob({ id: '2' }), createJob({ id: '3' })]
    const filters: FilterOptions = {
      query: '',
      statusFilter: 'All',
      dateRangeStart: '',
      dateRangeEnd: '',
      salaryRangeMin: '0',
      salaryRangeMax: '999999',
      contactPersonFilter: '',
    }
    const sort: SortOptions = { sortColumn: 'applicationDate', sortDirection: 'desc' }
    const pagination: PaginationOptions = { currentPage: 1, pageSize: 10 }

    const filteredJobs = [jobs[0], jobs[1]]
    const sortedJobs = [jobs[1], jobs[0]]
    const paginatedJobs = [jobs[1], jobs[0]]

    mockedUseJobFiltering.mockReturnValue({
      filteredJobs,
      overdueCount: 0,
    })
    mockedUseJobSorting.mockReturnValue(sortedJobs)
    mockedUseJobPagination.mockReturnValue({
      paginatedJobs,
      totalPages: 1,
    })

    const { result } = renderHook(() => useTableData(jobs, filters, sort, pagination))

    expect(result.current.paginatedJobs).toEqual(paginatedJobs)
    expect(result.current.filteredJobs).toEqual(filteredJobs)
    expect(result.current.sortedJobs).toEqual(sortedJobs)
    expect(result.current.totalPages).toBe(1)
  })

  it('calculates filteredCount from filtered jobs', () => {
    const jobs = [createJob({ id: '1' }), createJob({ id: '2' }), createJob({ id: '3' })]
    const filters: FilterOptions = {
      query: 'engineer',
      statusFilter: 'Applied',
      dateRangeStart: '',
      dateRangeEnd: '',
      salaryRangeMin: '50000',
      salaryRangeMax: '200000',
      contactPersonFilter: '',
    }
    const sort: SortOptions = { sortColumn: 'company', sortDirection: 'asc' }
    const pagination: PaginationOptions = { currentPage: 1, pageSize: 10 }

    const filteredJobs = [jobs[0], jobs[1]]
    mockedUseJobFiltering.mockReturnValue({
      filteredJobs,
      overdueCount: 1,
    })
    mockedUseJobSorting.mockReturnValue(filteredJobs)
    mockedUseJobPagination.mockReturnValue({
      paginatedJobs: filteredJobs,
      totalPages: 1,
    })

    const { result } = renderHook(() => useTableData(jobs, filters, sort, pagination))

    expect(result.current.filteredCount).toBe(2)
  })

  it('includes overdueCount from filtering', () => {
    const jobs = [createJob()]
    const filters: FilterOptions = {
      query: '',
      statusFilter: 'All',
      dateRangeStart: '',
      dateRangeEnd: '',
      salaryRangeMin: '0',
      salaryRangeMax: '999999',
      contactPersonFilter: '',
    }
    const sort: SortOptions = { sortColumn: 'applicationDate', sortDirection: 'desc' }
    const pagination: PaginationOptions = { currentPage: 1, pageSize: 10 }

    mockedUseJobFiltering.mockReturnValue({
      filteredJobs: jobs,
      overdueCount: 3,
    })
    mockedUseJobSorting.mockReturnValue(jobs)
    mockedUseJobPagination.mockReturnValue({
      paginatedJobs: jobs,
      totalPages: 1,
    })

    const { result } = renderHook(() => useTableData(jobs, filters, sort, pagination))

    expect(result.current.overdueCount).toBe(3)
  })

  it('handles empty job list', () => {
    const jobs: Job[] = []
    const filters: FilterOptions = {
      query: '',
      statusFilter: 'All',
      dateRangeStart: '',
      dateRangeEnd: '',
      salaryRangeMin: '0',
      salaryRangeMax: '999999',
      contactPersonFilter: '',
    }
    const sort: SortOptions = { sortColumn: 'applicationDate', sortDirection: 'desc' }
    const pagination: PaginationOptions = { currentPage: 1, pageSize: 10 }

    mockedUseJobFiltering.mockReturnValue({
      filteredJobs: [],
      overdueCount: 0,
    })
    mockedUseJobSorting.mockReturnValue([])
    mockedUseJobPagination.mockReturnValue({
      paginatedJobs: [],
      totalPages: 0,
    })

    const { result } = renderHook(() => useTableData(jobs, filters, sort, pagination))

    expect(result.current.paginatedJobs).toEqual([])
    expect(result.current.filteredCount).toBe(0)
    expect(result.current.totalPages).toBe(0)
  })

  it('calculates correct totalPages from pagination', () => {
    const jobs = [
      createJob({ id: '1' }),
      createJob({ id: '2' }),
      createJob({ id: '3' }),
      createJob({ id: '4' }),
      createJob({ id: '5' }),
    ]
    const filters: FilterOptions = {
      query: '',
      statusFilter: 'All',
      dateRangeStart: '',
      dateRangeEnd: '',
      salaryRangeMin: '0',
      salaryRangeMax: '999999',
      contactPersonFilter: '',
    }
    const sort: SortOptions = { sortColumn: 'applicationDate', sortDirection: 'desc' }
    const pagination: PaginationOptions = { currentPage: 2, pageSize: 2 }

    mockedUseJobFiltering.mockReturnValue({
      filteredJobs: jobs,
      overdueCount: 0,
    })
    mockedUseJobSorting.mockReturnValue(jobs)
    mockedUseJobPagination.mockReturnValue({
      paginatedJobs: [jobs[2], jobs[3]],
      totalPages: 3,
    })

    const { result } = renderHook(() => useTableData(jobs, filters, sort, pagination))

    expect(result.current.totalPages).toBe(3)
  })

  it('handles filtering reducing job list significantly', () => {
    const jobs = Array.from({ length: 100 }, (_, i) => createJob({ id: `job-${i}` }))
    const filters: FilterOptions = {
      query: 'senior',
      statusFilter: 'Interview',
      dateRangeStart: '2026-01-01',
      dateRangeEnd: '2026-03-01',
      salaryRangeMin: '150000',
      salaryRangeMax: '300000',
      contactPersonFilter: '',
    }
    const sort: SortOptions = { sortColumn: 'applicationDate', sortDirection: 'desc' }
    const pagination: PaginationOptions = { currentPage: 1, pageSize: 10 }

    const filteredJobs = [jobs[5], jobs[12], jobs[23]]
    mockedUseJobFiltering.mockReturnValue({
      filteredJobs,
      overdueCount: 1,
    })
    mockedUseJobSorting.mockReturnValue(filteredJobs)
    mockedUseJobPagination.mockReturnValue({
      paginatedJobs: filteredJobs,
      totalPages: 1,
    })

    const { result } = renderHook(() => useTableData(jobs, filters, sort, pagination))

    expect(result.current.filteredCount).toBe(3)
  })

  it('returns all required properties from result', () => {
    const jobs = [createJob()]
    const filters: FilterOptions = {
      query: '',
      statusFilter: 'All',
      dateRangeStart: '',
      dateRangeEnd: '',
      salaryRangeMin: '0',
      salaryRangeMax: '999999',
      contactPersonFilter: '',
    }
    const sort: SortOptions = { sortColumn: 'applicationDate', sortDirection: 'desc' }
    const pagination: PaginationOptions = { currentPage: 1, pageSize: 10 }

    mockedUseJobFiltering.mockReturnValue({
      filteredJobs: jobs,
      overdueCount: 0,
    })
    mockedUseJobSorting.mockReturnValue(jobs)
    mockedUseJobPagination.mockReturnValue({
      paginatedJobs: jobs,
      totalPages: 1,
    })

    const { result } = renderHook(() => useTableData(jobs, filters, sort, pagination))

    expect(result.current).toHaveProperty('paginatedJobs')
    expect(result.current).toHaveProperty('filteredJobs')
    expect(result.current).toHaveProperty('sortedJobs')
    expect(result.current).toHaveProperty('overdueCount')
    expect(result.current).toHaveProperty('totalPages')
    expect(result.current).toHaveProperty('filteredCount')
  })
})
