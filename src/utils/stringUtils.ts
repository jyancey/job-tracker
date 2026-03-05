import type { SortDirection } from './dateUtils'

export function normalizeUrl(url: string): string {
  if (!url.trim()) {
    return ''
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.trim()
  }

  return `https://${url.trim()}`
}

export function compareStrings(a: string, b: string, direction: SortDirection): number {
  const left = a.toLowerCase()
  const right = b.toLowerCase()
  return direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left)
}
