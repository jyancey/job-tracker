import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { Job, JobStatus } from '../domain'
import { JOB_STATUSES } from '../domain'
import { useJobGrouping } from './useJobGrouping'

function createJob(id: string, status: JobStatus, dueDate = ''): Job {
  return {
    id,
    company: `Company ${id}`,
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status,
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: dueDate,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  }
}

describe('useJobGrouping', () => {
  it('returns all statuses in byStatus map', () => {
    const { result } = renderHook(() => useJobGrouping([]))

    for (const status of JOB_STATUSES) {
      expect(result.current.byStatus.has(status)).toBe(true)
      expect(result.current.byStatus.get(status)).toEqual([])
    }
  })

  it('groups jobs by status correctly', () => {
    const jobs = [
      createJob('1', 'Applied'),
      createJob('2', 'Applied'),
      createJob('3', 'Interview'),
    ]

    const { result } = renderHook(() => useJobGrouping(jobs))

    expect(result.current.byStatus.get('Applied')).toHaveLength(2)
    expect(result.current.byStatus.get('Interview')).toHaveLength(1)
    expect(result.current.byStatus.get('Offer')).toHaveLength(0)
  })

  it('preserves input order within each status group', () => {
    const jobs = [
      createJob('a', 'Applied'),
      createJob('b', 'Applied'),
      createJob('c', 'Applied'),
    ]

    const { result } = renderHook(() => useJobGrouping(jobs))

    const applied = result.current.byStatus.get('Applied') || []
    expect(applied.map((j) => j.id)).toEqual(['a', 'b', 'c'])
  })

  it('groups dueByDate and sorts ascending by date key', () => {
    const jobs = [
      createJob('1', 'Applied', '2026-03-20'),
      createJob('2', 'Interview', '2026-03-10'),
      createJob('3', 'Offer', '2026-03-15'),
    ]

    const { result } = renderHook(() => useJobGrouping(jobs))

    expect(result.current.dueByDate.map(([date]) => date)).toEqual([
      '2026-03-10',
      '2026-03-15',
      '2026-03-20',
    ])
  })

  it('omits jobs with empty nextActionDueDate from dueByDate', () => {
    const jobs = [
      createJob('1', 'Applied', ''),
      createJob('2', 'Interview', '2026-03-10'),
      createJob('3', 'Offer', ''),
    ]

    const { result } = renderHook(() => useJobGrouping(jobs))

    expect(result.current.dueByDate).toHaveLength(1)
    expect(result.current.dueByDate[0][0]).toBe('2026-03-10')
    expect(result.current.dueByDate[0][1].map((j) => j.id)).toEqual(['2'])
  })

  it('groups multiple jobs on the same due date', () => {
    const jobs = [
      createJob('1', 'Applied', '2026-03-10'),
      createJob('2', 'Interview', '2026-03-10'),
      createJob('3', 'Offer', '2026-03-12'),
    ]

    const { result } = renderHook(() => useJobGrouping(jobs))

    expect(result.current.dueByDate).toHaveLength(2)
    const sameDay = result.current.dueByDate.find(([date]) => date === '2026-03-10')
    expect((sameDay?.[1] || []).map((j) => j.id)).toEqual(['1', '2'])
  })
})
