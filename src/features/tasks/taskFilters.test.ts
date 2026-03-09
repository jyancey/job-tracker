import { describe, expect, it } from 'vitest'
import type { Job } from '../../domain'
import { countOverdueTasks, getThisWeekTasks, getTodayTasks, groupTasksByDueDate } from './taskFilters'

function createJob(overrides: Partial<Job> = {}): Job {
  return {
    id: '1',
    company: 'Acme',
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: 'Follow up recruiter',
    nextActionDueDate: '2026-03-08',
    priority: 'Medium',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('taskFilters', () => {
  const today = '2026-03-08'

  it('returns today and overdue tasks for Today view', () => {
    const jobs = [
      createJob({ id: 'today', nextActionDueDate: today }),
      createJob({ id: 'overdue', nextActionDueDate: '2026-03-07' }),
      createJob({ id: 'future', nextActionDueDate: '2026-03-10' }),
    ]

    const tasks = getTodayTasks(jobs, today)
    expect(tasks.map((job) => job.id)).toEqual(['overdue', 'today'])
  })

  it('sorts by priority high to low', () => {
    const jobs = [
      createJob({ id: 'low', priority: 'Low' }),
      createJob({ id: 'high', priority: 'High' }),
      createJob({ id: 'medium', priority: 'Medium' }),
    ]

    const tasks = getTodayTasks(jobs, today)
    expect(tasks.map((job) => job.id)).toEqual(['high', 'medium', 'low'])
  })

  it('returns only next 7 days for This Week view', () => {
    const jobs = [
      createJob({ id: 'today', nextActionDueDate: today }),
      createJob({ id: 'in-range', nextActionDueDate: '2026-03-15' }),
      createJob({ id: 'out-of-range', nextActionDueDate: '2026-03-16' }),
      createJob({ id: 'overdue', nextActionDueDate: '2026-03-07' }),
    ]

    const tasks = getThisWeekTasks(jobs, today)
    expect(tasks.map((job) => job.id)).toEqual(['today', 'in-range'])
  })

  it('groups tasks by due date', () => {
    const jobs = [
      createJob({ id: 'a', nextActionDueDate: '2026-03-08', priority: 'Low' }),
      createJob({ id: 'b', nextActionDueDate: '2026-03-08', priority: 'High' }),
      createJob({ id: 'c', nextActionDueDate: '2026-03-09' }),
    ]

    const grouped = groupTasksByDueDate(jobs)
    expect(grouped).toHaveLength(2)
    expect(grouped[0][0]).toBe('2026-03-08')
    expect(grouped[0][1].map((job) => job.id)).toEqual(['b', 'a'])
    expect(grouped[1][0]).toBe('2026-03-09')
  })

  it('counts overdue tasks with action text', () => {
    const jobs = [
      createJob({ id: 'overdue', nextActionDueDate: '2026-03-07' }),
      createJob({ id: 'today', nextActionDueDate: today }),
      createJob({ id: 'no-action', nextAction: '', nextActionDueDate: '2026-03-07' }),
    ]

    expect(countOverdueTasks(jobs, today)).toBe(1)
  })
})
