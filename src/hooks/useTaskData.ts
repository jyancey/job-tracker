import { useMemo } from 'react'
import type { Job } from '../domain'
import { getTodayString } from '../utils/dateUtils'
import {
  countOverdueTasks,
  getThisWeekTasks,
  getTodayTasks,
  groupTasksByDueDate,
} from '../features/tasks/taskFilters'
import { useJobGrouping } from './useJobGrouping'

/**
 * Builds task/date-derived collections shared across non-table views.
 */
export function useTaskData(jobs: Job[]) {
  const { byStatus, dueByDate } = useJobGrouping(jobs)
  const today = getTodayString()

  const todayTasks = useMemo(() => getTodayTasks(jobs, today), [jobs, today])
  const thisWeekTasks = useMemo(() => getThisWeekTasks(jobs, today), [jobs, today])
  const thisWeekTaskGroups = useMemo(() => groupTasksByDueDate(thisWeekTasks), [thisWeekTasks])
  const taskOverdueCount = useMemo(() => countOverdueTasks(jobs, today), [jobs, today])

  return {
    byStatus,
    dueByDate,
    today,
    todayTasks,
    thisWeekTaskGroups,
    taskOverdueCount,
  }
}