import { createJobFromDraft, type Job, type JobDraft, type JobStatus } from '../domain'

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
