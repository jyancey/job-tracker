import type { Job } from '../domain'

const FALLBACK_JOBS_KEY = 'job-tracker.jobs.fallback'

/**
 * Read jobs from the localStorage fallback store.
 *
 * Used when the backend API is unavailable. Returns an empty array if no data
 * is present or if parsing fails.
 */
export function readFallbackJobs(): Job[] {
  try {
    const raw = localStorage.getItem(FALLBACK_JOBS_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Job[]) : []
  } catch {
    return []
  }
}

/**
 * Write jobs to the localStorage fallback store.
 *
 * Used when the backend API is unavailable.
 *
 * @param jobs - The complete set of jobs to persist locally.
 */
export function writeFallbackJobs(jobs: Job[]): void {
  localStorage.setItem(FALLBACK_JOBS_KEY, JSON.stringify(jobs))
}
