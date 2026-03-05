import { describe, it, expect, beforeEach, vi } from 'vitest'
import { formatDate, isOverdueFollowUp, compareDates, getTodayString } from './dateUtils'
import type { Job } from '../domain'

describe('dateUtils', (): void => {
  beforeEach((): void => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-05T00:00:00Z'))
  })

  describe('formatDate', (): void => {
    it('formats date string correctly', (): void => {
      expect(formatDate('2026-03-05')).toMatch(/Mar 5, 2026/)
    })

    it('returns dash for empty string', (): void => {
      expect(formatDate('')).toBe('-')
    })

    it('formats different dates correctly', (): void => {
      expect(formatDate('2024-01-15')).toMatch(/Jan 15, 2024/)
      expect(formatDate('2025-12-31')).toMatch(/Dec 31, 2025/)
    })
  })

  describe('isOverdueFollowUp', (): void => {
    const mockJob = (dueDate: string): Job => ({
      id: '1',
      company: 'Test',
      roleTitle: 'Role',
      applicationDate: '2026-03-01',
      status: 'Applied',
      jobUrl: '',
      atsUrl: '',
      salaryRange: '',
      contactPerson: '',
      nextAction: '',
      nextActionDueDate: dueDate,
      notes: '',
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    })

    it('returns true for past dates', (): void => {
      expect(isOverdueFollowUp(mockJob('2026-03-04'), '2026-03-05')).toBe(true)
      expect(isOverdueFollowUp(mockJob('2026-01-01'), '2026-03-05')).toBe(true)
    })

    it('returns false for today and future dates', (): void => {
      expect(isOverdueFollowUp(mockJob('2026-03-05'), '2026-03-05')).toBe(false)
      expect(isOverdueFollowUp(mockJob('2026-03-06'), '2026-03-05')).toBe(false)
      expect(isOverdueFollowUp(mockJob('2026-12-31'), '2026-03-05')).toBe(false)
    })

    it('returns false for empty due date', (): void => {
      expect(isOverdueFollowUp(mockJob(''), '2026-03-05')).toBe(false)
    })
  })

  describe('compareDates', (): void => {
    it('returns negative for earlier dates in ascending order', (): void => {
      expect(compareDates('2026-03-04', '2026-03-05', 'asc')).toBeLessThan(0)
    })

    it('returns positive for later dates in ascending order', (): void => {
      expect(compareDates('2026-03-06', '2026-03-05', 'asc')).toBeGreaterThan(0)
    })

    it('returns zero for same dates', (): void => {
      expect(compareDates('2026-03-05', '2026-03-05', 'asc')).toBe(0)
    })

    it('reverses order in descending mode', (): void => {
      expect(compareDates('2026-03-04', '2026-03-05', 'desc')).toBeGreaterThan(0)
      expect(compareDates('2026-03-06', '2026-03-05', 'desc')).toBeLessThan(0)
    })
  })

  describe('getTodayString', (): void => {
    it('returns today date in YYYY-MM-DD format', (): void => {
      expect(getTodayString()).toBe('2026-03-05')
    })
  })
})
