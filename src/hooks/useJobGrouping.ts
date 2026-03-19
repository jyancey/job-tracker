// Groups jobs by status and groups tasks by due date for kanban and task views.
import { useMemo } from 'react'
import { JOB_STATUSES, type Job, type JobStatus } from '../domain'

export function useJobGrouping(jobs: Job[]) {
  const byStatus = useMemo(() => {
    const grouped = new Map<JobStatus, Job[]>()
    for (const status of JOB_STATUSES) {
      grouped.set(status, [])
    }

    for (const job of jobs) {
      grouped.get(job.status)?.push(job)
    }

    return grouped
  }, [jobs])

  const dueByDate = useMemo(() => {
    const grouped = new Map<string, Job[]>()

    for (const job of jobs) {
      if (!job.nextActionDueDate) {
        continue
      }

      if (!grouped.has(job.nextActionDueDate)) {
        grouped.set(job.nextActionDueDate, [])
      }

      grouped.get(job.nextActionDueDate)?.push(job)
    }

    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [jobs])

  return { byStatus, dueByDate }
}
