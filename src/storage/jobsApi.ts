import type { Job } from '../domain'

const API_JOBS_ENDPOINT = '/api/jobs'

/**
 * Returns `true` if the error is an environment-level URL pattern error,
 * indicating the app is running without a backend (e.g. in a static or dev preview context).
 *
 * Used to distinguish a missing backend from a genuine network failure.
 *
 * @param error - The error to classify.
 */
export function isApiUrlPatternError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes('did not match the expected pattern') || message.includes('failed to parse url')
}

/**
 * Fetch all jobs from the backend API.
 *
 * @returns The list of persisted jobs.
 * @throws When the response is not OK.
 */
export async function fetchJobs(): Promise<Job[]> {
  const response = await fetch(API_JOBS_ENDPOINT)
  if (!response.ok) {
    throw new Error(`load failed with status ${response.status}`)
  }

  const payload = (await response.json()) as { jobs?: Job[] }
  return Array.isArray(payload.jobs) ? payload.jobs : []
}

/**
 * Replace all persisted jobs on the backend with the provided list.
 *
 * Uses full-replace (PUT) semantics — the backend overwrites its entire state
 * with the given array.
 *
 * @param jobs - The complete set of jobs to persist.
 * @throws When the response is not OK.
 */
export async function persistJobs(jobs: Job[]): Promise<void> {
  const response = await fetch(API_JOBS_ENDPOINT, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobs }),
  })

  if (!response.ok) {
    throw new Error(`save failed with status ${response.status}`)
  }
}
