import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { Job } from '../domain'
import * as jobService from '../services/jobService'
import { useTaskActions } from './useTaskActions'

function makeJob(id: string): Job {
  return {
    id,
    company: `Company ${id}`,
    roleTitle: 'Engineer',
    applicationDate: '2026-03-01',
    status: 'Applied',
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: 'Follow up',
    nextActionDueDate: '2026-03-12',
    priority: 'Medium',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useTaskActions', () => {
  it('complete task calls service with updater and sends success notification', () => {
    const setJobs = vi.fn()
    const addNotification = vi.fn()
    const serviceSpy = vi.spyOn(jobService, 'completeJobAction').mockReturnValue([])
    const jobs = [makeJob('a')]

    const { result } = renderHook(() => useTaskActions({ setJobs, addNotification }))

    act(() => {
      result.current.handleCompleteTask('a')
    })

    expect(setJobs).toHaveBeenCalledTimes(1)
    const updater = setJobs.mock.calls[0][0] as (current: Job[]) => Job[]
    updater(jobs)
    expect(serviceSpy).toHaveBeenCalledWith(jobs, 'a')
    expect(addNotification).toHaveBeenCalledWith('Task marked complete', 'success')
  })

  it('snooze task calls service and sends info notification with day count', () => {
    const setJobs = vi.fn()
    const addNotification = vi.fn()
    const serviceSpy = vi.spyOn(jobService, 'snoozeJobAction').mockReturnValue([])
    const jobs = [makeJob('a')]

    const { result } = renderHook(() => useTaskActions({ setJobs, addNotification }))

    act(() => {
      result.current.handleSnoozeTask('a', 3)
    })

    const updater = setJobs.mock.calls[0][0] as (current: Job[]) => Job[]
    updater(jobs)
    expect(serviceSpy).toHaveBeenCalledWith(jobs, 'a', 3)
    expect(addNotification).toHaveBeenCalledWith('Task snoozed by 3 day(s)', 'info')
  })

  it('priority change calls update priority service without notification', () => {
    const setJobs = vi.fn()
    const addNotification = vi.fn()
    const serviceSpy = vi.spyOn(jobService, 'updateJobPriority').mockReturnValue([])
    const jobs = [makeJob('a')]

    const { result } = renderHook(() => useTaskActions({ setJobs, addNotification }))

    act(() => {
      result.current.handleTaskPriorityChange('a', 'High')
    })

    const updater = setJobs.mock.calls[0][0] as (current: Job[]) => Job[]
    updater(jobs)
    expect(serviceSpy).toHaveBeenCalledWith(jobs, 'a', 'High')
    expect(addNotification).not.toHaveBeenCalled()
  })

  it('quick add action updates task fields and sends success notification', () => {
    const setJobs = vi.fn()
    const addNotification = vi.fn()
    const serviceSpy = vi.spyOn(jobService, 'updateJobTaskAction').mockReturnValue([])
    const jobs = [makeJob('a')]

    const { result } = renderHook(() => useTaskActions({ setJobs, addNotification }))

    act(() => {
      result.current.handleQuickAddTaskAction('a', 'Prepare interview answers', '2026-03-20')
    })

    const updater = setJobs.mock.calls[0][0] as (current: Job[]) => Job[]
    updater(jobs)
    expect(serviceSpy).toHaveBeenCalledWith(jobs, 'a', 'Prepare interview answers', '2026-03-20')
    expect(addNotification).toHaveBeenCalledWith('Task updated', 'success')
  })

  it('returns stable handler names for all task workflows', () => {
    const { result } = renderHook(() => useTaskActions({ setJobs: vi.fn(), addNotification: vi.fn() }))

    expect(typeof result.current.handleCompleteTask).toBe('function')
    expect(typeof result.current.handleSnoozeTask).toBe('function')
    expect(typeof result.current.handleTaskPriorityChange).toBe('function')
    expect(typeof result.current.handleQuickAddTaskAction).toBe('function')
  })

  it('supports multiple sequential task operations', () => {
    const setJobs = vi.fn()
    const addNotification = vi.fn()

    const { result } = renderHook(() => useTaskActions({ setJobs, addNotification }))

    act(() => {
      result.current.handleCompleteTask('a')
      result.current.handleSnoozeTask('a', 1)
      result.current.handleQuickAddTaskAction('a', 'Email recruiter', '2026-03-13')
    })

    expect(setJobs).toHaveBeenCalledTimes(3)
    expect(addNotification).toHaveBeenCalledTimes(3)
  })
})
