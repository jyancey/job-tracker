// Date formatting, comparison, and overdue follow-up checking utilities.
import type { Job } from '../domain'

/**
 * Format a YYYY-MM-DD date string for display
 * Parses as local date to avoid timezone offset issues
 */
export function formatDate(value: string): string {
  if (!value) {
    return '-'
  }

  // Parse YYYY-MM-DD as local date to avoid UTC timezone shift
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isOverdueFollowUp(job: Job, today: string): boolean {
  return Boolean(job.nextActionDueDate && job.nextActionDueDate < today)
}

export type SortDirection = 'asc' | 'desc'

export function compareDates(a: string, b: string, direction: SortDirection): number {
  const emptyFallbackAsc = '9999-12-31'
  const emptyFallbackDesc = '0000-01-01'
  const left = a || (direction === 'asc' ? emptyFallbackAsc : emptyFallbackDesc)
  const right = b || (direction === 'asc' ? emptyFallbackAsc : emptyFallbackDesc)
  return direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left)
}

export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}
