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

export function countOverdueTasks(jobs: Job[], today: string): number {
  return jobs.filter((job) => Boolean(job.nextActionDueDate && job.nextActionDueDate < today && job.nextAction.trim())).length
}
