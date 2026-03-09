import type { Job } from '../domain'

const FALLBACK_JOBS_KEY = 'job-tracker.jobs.fallback'

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

export function writeFallbackJobs(jobs: Job[]): void {
  localStorage.setItem(FALLBACK_JOBS_KEY, JSON.stringify(jobs))
}
