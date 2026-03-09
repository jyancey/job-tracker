import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useJobFiltering, useJobSorting, useJobPagination } from './useJobFiltering'
import type { Job } from '../domain'

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '1',
    company: 'Acme Corp',
    roleTitle: 'Senior Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '$150000-$180000',
    notes: 'Good company culture',
    contactPerson: 'John Doe',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-15',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('useJobFiltering', () => {
  it('filters by status', () => {
    const jobs = [
      createJob({ id: '1', status: 'Applied' }),
      createJob({ id: '2', status: 'Interview' }),
      createJob({ id: '3', status: 'Applied' }),
    ]
    const { result } = renderHook(() =>
      useJobFiltering(jobs, { statusFilter: 'Applied', query: '', dateRangeStart: '', dateRangeEnd: '', salaryRangeMin: '', salaryRangeMax: '', contactPersonFilter: '' }),
    )

    expect(result.current.filteredJobs).toHaveLength(2)
    expect(result.current.filteredJobs.every((j) => j.status === 'Applied')).toBe(true)
  })

  it('filters by query across multiple fields', () => {
    const jobs = [
      createJob({ id: '1', company: 'TechCorp', roleTitle: 'Engineer' }),
      createJob({ id: '2', company: 'StartupXYZ', roleTitle: 'Manager', contactPerson: 'Taylor' }),
      createJob({ id: '3', company: 'OtherCorp', roleTitle: 'TechLead', notes: 'TechCorp connection' }),
    ]
    const { result } = renderHook(() =>
      useJobFiltering(jobs, { statusFilter: 'All', query: 'TechCorp', dateRangeStart: '', dateRangeEnd: '', salaryRangeMin: '', salaryRangeMax: '', contactPersonFilter: '' }),
    )

    expect(result.current.filteredJobs).toHaveLength(2)
    expect(result.current.filteredJobs.map((j) => j.id)).toEqual(['1', '3'])
  })

  it('supports tokenized AND query matching across searchable fields', () => {
    const jobs = [
      createJob({ id: '1', company: 'TechCorp', notes: 'React frontend', contactPerson: 'Taylor' }),
      createJob({ id: '2', company: 'TechCorp', notes: 'Backend services', contactPerson: 'Taylor' }),
    ]

    const { result } = renderHook(() =>
      useJobFiltering(jobs, { statusFilter: 'All', query: 'techcorp react', dateRangeStart: '', dateRangeEnd: '', salaryRangeMin: '', salaryRangeMax: '', contactPersonFilter: '' }),
    )

    expect(result.current.filteredJobs).toHaveLength(1)
    expect(result.current.filteredJobs[0].id).toBe('1')
  })

  it('filters by date range inclusively', () => {
    const jobs = [
      createJob({ id: '1', applicationDate: '2026-03-01' }),
      createJob({ id: '2', applicationDate: '2026-03-15' }),
      createJob({ id: '3', applicationDate: '2026-04-01' }),
    ]
    const { result } = renderHook(() =>
      useJobFiltering(jobs, { statusFilter: 'All', query: '', dateRangeStart: '2026-03-10', dateRangeEnd: '2026-03-20', salaryRangeMin: '', salaryRangeMax: '', contactPersonFilter: '' }),
    )

    expect(result.current.filteredJobs).toHaveLength(1)
    expect(result.current.filteredJobs[0].id).toBe('2')
  })

  it('filters by contact person (case-insensitive)', () => {
    const jobs = [
      createJob({ id: '1', contactPerson: 'Alice Smith' }),
      createJob({ id: '2', contactPerson: 'Bob Johnson' }),
      createJob({ id: '3', contactPerson: 'alice jones' }),
    ]
    const { result } = renderHook(() =>
      useJobFiltering(jobs, { statusFilter: 'All', query: '', dateRangeStart: '', dateRangeEnd: '', salaryRangeMin: '', salaryRangeMax: '', contactPersonFilter: 'alice' }),
    )

    expect(result.current.filteredJobs).toHaveLength(2)
    expect(result.current.filteredJobs.map((j) => j.id)).toEqual(['1', '3'])
  })

  it('counts overdue follow-ups correctly', () => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const jobs = [
      createJob({ id: '1', nextActionDueDate: yesterday }),
      createJob({ id: '2', nextActionDueDate: tomorrow }),
      createJob({ id: '3', nextActionDueDate: '' }),
    ]
    const { result } = renderHook(() =>
      useJobFiltering(jobs, { statusFilter: 'All', query: '', dateRangeStart: '', dateRangeEnd: '', salaryRangeMin: '', salaryRangeMax: '', contactPersonFilter: '' }),
    )

    expect(result.current.overdueCount).toBe(1)
  })

  it('combines multiple filters with AND logic', () => {
    const jobs = [
      createJob({ id: '1', company: 'TechCorp', status: 'Applied', contactPerson: 'Alice' }),
      createJob({ id: '2', company: 'TechCorp', status: 'Interview', contactPerson: 'Alice' }),
      createJob({ id: '3', company: 'OtherCorp', status: 'Applied', contactPerson: 'Alice' }),
    ]
    const { result } = renderHook(() =>
      useJobFiltering(jobs, { statusFilter: 'Applied', query: 'TechCorp', dateRangeStart: '', dateRangeEnd: '', salaryRangeMin: '', salaryRangeMax: '', contactPersonFilter: 'Alice' }),
    )

    expect(result.current.filteredJobs).toHaveLength(1)
    expect(result.current.filteredJobs[0].id).toBe('1')
  })
})

describe('useJobSorting', () => {
  it('sorts by applicationDate descending (most recent first)', () => {
    const jobs = [
      createJob({ id: '1', applicationDate: '2026-03-01' }),
      createJob({ id: '2', applicationDate: '2026-03-15' }),
      createJob({ id: '3', applicationDate: '2026-03-05' }),
    ]
    const { result } = renderHook(() =>
      useJobSorting(jobs, { sortColumn: 'applicationDate', sortDirection: 'desc' }),
    )

    expect(result.current.map((j) => j.id)).toEqual(['2', '3', '1'])
  })

  it('sorts by company name ascending (alphabetical)', () => {
    const jobs = [
      createJob({ id: '1', company: 'Zebra Inc' }),
      createJob({ id: '2', company: 'Acme Corp' }),
      createJob({ id: '3', company: 'Beta Ltd' }),
    ]
    const { result } = renderHook(() =>
      useJobSorting(jobs, { sortColumn: 'company', sortDirection: 'asc' }),
    )

    expect(result.current.map((j) => j.company)).toEqual(['Acme Corp', 'Beta Ltd', 'Zebra Inc'])
  })

  it('sorts by score with unscored jobs at the end', () => {
    const jobs = [
      createJob({ id: '1', scoreFit: 8, scoreCompensation: 7, scoreLocation: 6, scoreGrowth: 8, scoreConfidence: 0.9 }),
      createJob({ id: '2' }),
      createJob({ id: '3', scoreFit: 9, scoreCompensation: 9, scoreLocation: 8, scoreGrowth: 9, scoreConfidence: 0.95 }),
    ]
    const { result } = renderHook(() =>
      useJobSorting(jobs, { sortColumn: 'score', sortDirection: 'desc' }),
    )

    expect(result.current[0].id).toBe('3') // highest score
    expect(result.current[1].id).toBe('1') // middle score
    expect(result.current[2].id).toBe('2') // unscored last
  })
})

describe('useJobPagination', () => {
  it('calculates correct total pages', () => {
    const jobs = Array.from({ length: 25 }, (_, i) => createJob({ id: String(i) }))
    const { result } = renderHook(() =>
      useJobPagination(jobs, { currentPage: 1, pageSize: 10 }),
    )

    expect(result.current.totalPages).toBe(3)
  })

  it('returns correct page slice', () => {
    const jobs = Array.from({ length: 25 }, (_, i) => createJob({ id: String(i) }))
    const { result } = renderHook(() =>
      useJobPagination(jobs, { currentPage: 2, pageSize: 10 }),
    )

    expect(result.current.paginatedJobs).toHaveLength(10)
    expect(result.current.paginatedJobs[0].id).toBe('10')
    expect(result.current.paginatedJobs[9].id).toBe('19')
  })

  it('returns 1 page for empty list', () => {
    const { result } = renderHook(() =>
      useJobPagination([], { currentPage: 1, pageSize: 10 }),
    )

    expect(result.current.totalPages).toBe(1)
    expect(result.current.paginatedJobs).toHaveLength(0)
  })
})
