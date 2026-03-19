// Task filtering and sorting utilities for today/week views using priority and due date ordering.
import type { Job, JobPriority } from '../../domain'

const PRIORITY_ORDER: Record<JobPriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
}

function normalizePriority(priority?: JobPriority): JobPriority {
  return priority ?? 'Medium'
}

function sortByPriorityThenDueDate(a: Job, b: Job): number {
  const priorityDiff = PRIORITY_ORDER[normalizePriority(a.priority)] - PRIORITY_ORDER[normalizePriority(b.priority)]
  if (priorityDiff !== 0) {
    return priorityDiff
  }

  if (a.nextActionDueDate && b.nextActionDueDate) {
    return a.nextActionDueDate.localeCompare(b.nextActionDueDate)
  }

  if (a.nextActionDueDate) {
    return -1
  }

  if (b.nextActionDueDate) {
    return 1
  }

  return a.company.localeCompare(b.company)
}

/**
 * Filter jobs to those with a next action due today or overdue.
 *
 * Jobs without a `nextActionDueDate` or with an empty `nextAction` are excluded.
 * Results are sorted by priority descending, then due date ascending.
 *
 * @param jobs - The full job list to filter.
 * @param today - The current date as an ISO date string (`YYYY-MM-DD`).
 * @returns Jobs with a next action due on or before today.
 */
export function getTodayTasks(jobs: Job[], today: string): Job[] {
  return jobs
    .filter((job) => {
      if (!job.nextActionDueDate || !job.nextAction.trim()) {
        return false
      }
      return job.nextActionDueDate <= today
    })
    .sort(sortByPriorityThenDueDate)
}

/**
 * Filter jobs to those with a next action due within the next 7 days.
 *
 * Excludes jobs already overdue (use {@link getTodayTasks} for those).
 * Results are sorted by priority descending, then due date ascending.
 *
 * @param jobs - The full job list to filter.
 * @param today - The current date as an ISO date string (`YYYY-MM-DD`).
 * @returns Jobs with a next action due between today and 7 days from now, inclusive.
 */
export function getThisWeekTasks(jobs: Job[], today: string): Job[] {
  const endDate = new Date(`${today}T00:00:00`)
  endDate.setDate(endDate.getDate() + 7)
  const end = endDate.toISOString().slice(0, 10)

  return jobs
    .filter((job) => {
      if (!job.nextActionDueDate || !job.nextAction.trim()) {
        return false
      }
      return job.nextActionDueDate >= today && job.nextActionDueDate <= end
    })
    .sort(sortByPriorityThenDueDate)
}

/**
 * Group a list of jobs by their `nextActionDueDate`, sorted by date ascending.
 *
 * Jobs without a due date are excluded. Within each date group, jobs are
 * sorted by priority then due date.
 *
 * @param jobs - The list of jobs to group.
 * @returns An array of `[dueDate, jobs]` tuples ordered by ascending date.
 */
export function groupTasksByDueDate(jobs: Job[]): Array<[string, Job[]]> {
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

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dueDate, dueJobs]) => [dueDate, dueJobs.sort(sortByPriorityThenDueDate)])
}

/**
 * Count jobs with a non-empty next action that is past due.
 *
 * @param jobs - The full job list.
 * @param today - The current date as an ISO date string (`YYYY-MM-DD`).
 * @returns The number of jobs with a next action due before today.
 */
export function countOverdueTasks(jobs: Job[], today: string): number {
  return jobs.filter((job) => Boolean(job.nextActionDueDate && job.nextActionDueDate < today && job.nextAction.trim())).length
}
