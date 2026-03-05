import { describe, it, expect } from 'vitest'
import { normalizeUrl, compareStrings } from './stringUtils'

describe('stringUtils', (): void => {
  describe('normalizeUrl', (): void => {
    it('adds https:// to URLs without protocol', (): void => {
      expect(normalizeUrl('example.com')).toBe('https://example.com')
      expect(normalizeUrl('www.example.com')).toBe('https://www.example.com')
    })

    it('preserves http:// URLs', (): void => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com')
    })

    it('preserves https:// URLs', (): void => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com')
    })

    it('handles empty string', (): void => {
      expect(normalizeUrl('')).toBe('')
    })

    it('removes trailing whitespace before normalization', (): void => {
      expect(normalizeUrl('example.com ')).toBe('https://example.com')
    })
  })

  describe('compareStrings', (): void => {
    it('returns negative for alphabetically earlier strings in ascending order', (): void => {
      expect(compareStrings('apple', 'banana', 'asc')).toBeLessThan(0)
    })

    it('returns positive for alphabetically later strings in ascending order', (): void => {
      expect(compareStrings('banana', 'apple', 'asc')).toBeGreaterThan(0)
    })

    it('returns zero for identical strings', (): void => {
      expect(compareStrings('apple', 'apple', 'asc')).toBe(0)
    })

    it('is case-insensitive', (): void => {
      expect(compareStrings('Apple', 'banana', 'asc')).toBeLessThan(0)
    })

    it('reverses order in descending mode', (): void => {
      expect(compareStrings('apple', 'banana', 'desc')).toBeGreaterThan(0)
      expect(compareStrings('banana', 'apple', 'desc')).toBeLessThan(0)
    })

    it('handles empty strings', (): void => {
      expect(compareStrings('', 'apple', 'asc')).toBeLessThan(0)
      expect(compareStrings('apple', '', 'asc')).toBeGreaterThan(0)
      expect(compareStrings('', '', 'asc')).toBe(0)
    })
  })
})
