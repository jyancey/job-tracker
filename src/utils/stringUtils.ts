// URL normalization and case-insensitive string comparison utilities.
import type { SortDirection } from './dateUtils'

/**
 * Normalize a URL string by prepending `https://` when no protocol is present.
 *
 * Returns an empty string when `url` is blank.
 *
 * @param url - The raw URL input to normalize.
 * @returns A URL with an explicit protocol, or `''` for blank input.
 */
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
