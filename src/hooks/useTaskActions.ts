import { useCallback } from 'react'
import type { Job, JobPriority } from '../domain'
import * as jobService from '../services/jobService'

interface UseTaskActionsProps {
  setJobs: (updater: (jobs: Job[]) => Job[]) => void
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void
}

/**
 * Encapsulates task-specific job mutation handlers used by Today/This Week views.
 */
export function useTaskActions({ setJobs, addNotification }: UseTaskActionsProps) {
  const handleCompleteTask = useCallback((jobId: string) => {
    setJobs((current) => jobService.completeJobAction(current, jobId))
    addNotification('Task marked complete', 'success')
  }, [addNotification, setJobs])

  const handleSnoozeTask = useCallback((jobId: string, days: number) => {
    setJobs((current) => jobService.snoozeJobAction(current, jobId, days))
    addNotification(`Task snoozed by ${days} day(s)`, 'info')
  }, [addNotification, setJobs])

  const handleTaskPriorityChange = useCallback((jobId: string, priority: JobPriority) => {
    setJobs((current) => jobService.updateJobPriority(current, jobId, priority))
  }, [setJobs])

  const handleQuickAddTaskAction = useCallback((jobId: string, action: string, dueDate: string) => {
    setJobs((current) => jobService.updateJobTaskAction(current, jobId, action, dueDate))
    addNotification('Task updated', 'success')
  }, [addNotification, setJobs])

  return {
    handleCompleteTask,
    handleSnoozeTask,
    handleTaskPriorityChange,
    handleQuickAddTaskAction,
  }
}