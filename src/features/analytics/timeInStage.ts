import type { Job, JobStatus } from '../../domain'

/**
 * Time spent in each stage (in days)
 */
export interface TimeInStageMetrics {
  Wishlist: { median: number; jobs: number }
  Applied: { median: number; jobs: number }
  'Phone Screen': { median: number; jobs: number }
  Interview: { median: number; jobs: number }
  Offer: { median: number; jobs: number }
  Rejected: { median: number; jobs: number }
  Withdrawn: { median: number; jobs: number }
}

/**
 * Jobs that have been in their current status beyond threshold
 */
export interface StuckJob {
  job: Job
  daysInStatus: number
  threshold: number
}

/**
 * Configuration for stuck job thresholds (in days)
 */
export interface StuckThresholds {
  Wishlist?: number
  Applied?: number
  'Phone Screen'?: number
  Interview?: number
  Offer?: number
  Rejected?: number
  Withdrawn?: number
}

export const DEFAULT_STUCK_THRESHOLDS: StuckThresholds = {
  Wishlist: 30,
  Applied: 14,
  'Phone Screen': 10,
  Interview: 7,
  Offer: 7,
  Rejected: undefined, // No alerts for rejected
  Withdrawn: undefined, // No alerts for withdrawn
}

/**
 * Calculate days between two dates
 */
function daysBetween(startDate: string | Date, endDate: string | Date = new Date()): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const diffMs = end.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Calculate median of an array of numbers
 */
function median(values: number[]): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2)
  }
  return sorted[mid]
}

/**
 * Calculate time in current status for a job
 */
export function calculateDaysInCurrentStatus(job: Job): number {
  // Use updatedAt as the time when status was last changed
  return daysBetween(job.updatedAt)
}

/**
 * Calculate median time spent in each status across all jobs
 * 
 * Note: This is an approximation. For exact time-in-stage, we'd need
 * a status history log. Here we use updatedAt as a proxy.
 */
export function calculateTimeInStage(jobs: Job[]): TimeInStageMetrics {
  const statusGroups: { [key in JobStatus]: number[] } = {
    Wishlist: [],
    Applied: [],
    'Phone Screen': [],
    Interview: [],
    Offer: [],
    Rejected: [],
    Withdrawn: [],
  }

  // Group jobs by current status and calculate days in that status
  jobs.forEach((job) => {
    const days = calculateDaysInCurrentStatus(job)
    statusGroups[job.status].push(days)
  })

  // Calculate median for each status
  const metrics: TimeInStageMetrics = {} as TimeInStageMetrics

  for (const status of Object.keys(statusGroups) as JobStatus[]) {
    const days = statusGroups[status]
    metrics[status] = {
      median: median(days),
      jobs: days.length,
    }
  }

  return metrics
}

/**
 * Find jobs that have been stuck in their current status
 */
export function findStuckJobs(
  jobs: Job[],
  thresholds: StuckThresholds = DEFAULT_STUCK_THRESHOLDS
): StuckJob[] {
  const stuck: StuckJob[] = []

  jobs.forEach((job) => {
    const threshold = thresholds[job.status]
    
    // Skip if no threshold defined for this status
    if (threshold === undefined) return

    const daysInStatus = calculateDaysInCurrentStatus(job)

    if (daysInStatus >= threshold) {
      stuck.push({
        job,
        daysInStatus,
        threshold,
      })
    }
  })

  // Sort by days in status (most stuck first)
  return stuck.sort((a, b) => b.daysInStatus - a.daysInStatus)
}

/**
 * Get count of stuck jobs by status
 */
export function countStuckJobsByStatus(
  jobs: Job[],
  thresholds?: StuckThresholds
): { [key in JobStatus]?: number } {
  const stuckJobs = findStuckJobs(jobs, thresholds)
  const counts: { [key in JobStatus]?: number } = {}

  stuckJobs.forEach((stuck) => {
    const status = stuck.job.status
    counts[status] = (counts[status] || 0) + 1
  })

  return counts
}
