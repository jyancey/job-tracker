import type { Job } from '../domain'

export function formatDate(value: string): string {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleDateString(undefined, {
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
