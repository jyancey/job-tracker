// Core job operations: create, update, delete, and move with sorting by application date.
import { createJobFromDraft, type Job, type JobDraft, type JobPriority, type JobStatus } from '../domain'

/**
 * Sort jobs by application date (newest first)
 */
export function sortByApplicationDateDesc(a: Job, b: Job): number {
  return b.applicationDate.localeCompare(a.applicationDate)
}

/**
 * Create a new job from draft data
 */
export function createJob(jobs: Job[], draft: JobDraft): Job[] {
  const newJob = createJobFromDraft(draft)
  return [...jobs, newJob].sort(sortByApplicationDateDesc)
}

/**
 * Update an existing job
 */
export function updateJob(jobs: Job[], jobId: string, draft: JobDraft): Job[] {
  return jobs
    .map((job) =>
      job.id === jobId
        ? {
            ...job,
            ...draft,
            updatedAt: new Date().toISOString(),
          }
        : job
    )
    .sort(sortByApplicationDateDesc)
}

/**
 * Delete a job by ID
 */
export function deleteJob(jobs: Job[], jobId: string): Job[] {
  return jobs.filter((job) => job.id !== jobId)
}

/**
 * Delete multiple jobs by IDs
 */
export function deleteJobs(jobs: Job[], jobIds: string[]): Job[] {
  const idsToDelete = new Set(jobIds)
  return jobs.filter((job) => !idsToDelete.has(job.id))
}

/**
 * Update a job's status (quick move)
 */
export function updateJobStatus(jobs: Job[], jobId: string, newStatus: JobStatus): Job[] {
  return jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }
      : job
  )
}

/**
 * Find a job by ID
 */
export function findJobById(jobs: Job[], jobId: string): Job | undefined {
  return jobs.find((job) => job.id === jobId)
}

/**
 * Mark a job's next action as complete by clearing action text and due date.
 */
export function completeJobAction(jobs: Job[], jobId: string): Job[] {
  return jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          nextAction: '',
          nextActionDueDate: '',
          updatedAt: new Date().toISOString(),
        }
      : job,
  )
}

/**
 * Snooze a job's next action due date by a given number of days.
 */
export function snoozeJobAction(jobs: Job[], jobId: string, days: number, today = new Date()): Job[] {
  return jobs.map((job) => {
    if (job.id !== jobId) {
      return job
    }

    const baseDate = job.nextActionDueDate ? new Date(`${job.nextActionDueDate}T00:00:00`) : today
    baseDate.setDate(baseDate.getDate() + days)
    const nextDueDate = baseDate.toISOString().slice(0, 10)

    return {
      ...job,
      nextActionDueDate: nextDueDate,
      updatedAt: new Date().toISOString(),
    }
  })
}

/**
 * Update only task fields from task-focused views.
 */
export function updateJobTaskAction(jobs: Job[], jobId: string, nextAction: string, nextActionDueDate: string): Job[] {
  return jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          nextAction,
          nextActionDueDate,
          updatedAt: new Date().toISOString(),
        }
      : job,
  )
}

/**
 * Update a job priority.
 */
export function updateJobPriority(jobs: Job[], jobId: string, priority: JobPriority): Job[] {
  return jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          priority,
          updatedAt: new Date().toISOString(),
        }
      : job,
  )
}
