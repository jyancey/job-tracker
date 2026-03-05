import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  parseDate,
  getDateString,
  getDaysInMonth,
  getFirstDayOfMonth,
  isDateOverdue,
  getTodayString,
  generateCalendarGrid,
  getMonthName,
  formatDateToString,
} from './dateCalendarUtils'

describe('dateCalendarUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-05T12:00:00Z'))
  })

  describe('parseDate', () => {
    it('parses YYYY-MM-DD string to Date object', () => {
      const result = parseDate('2026-03-15')
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(2) // 0-indexed
      expect(result.getDate()).toBe(15)
    })

    it('handles edge cases', () => {
      const leapYear = parseDate('2024-02-29')
      expect(leapYear.getDate()).toBe(29)

      const endOfYear = parseDate('2025-12-31')
      expect(endOfYear.getMonth()).toBe(11)
      expect(endOfYear.getDate()).toBe(31)
    })
  })

  describe('getDateString', () => {
    it('formats date components to YYYY-MM-DD string', () => {
      expect(getDateString(2026, 2, 5)).toBe('2026-03-05')
      expect(getDateString(2026, 0, 1)).toBe('2026-01-01')
      expect(getDateString(2025, 11, 31)).toBe('2025-12-31')
    })

    it('pads single-digit months and days with zeros', () => {
      expect(getDateString(2026, 0, 5)).toBe('2026-01-05')
      expect(getDateString(2026, 8, 9)).toBe('2026-09-09')
    })
  })

  describe('getDaysInMonth', () => {
    it('returns correct days for different months', () => {
      expect(getDaysInMonth(new Date(2026, 0, 1))).toBe(31) // January
      expect(getDaysInMonth(new Date(2026, 1, 1))).toBe(28) // February (non-leap)
      expect(getDaysInMonth(new Date(2024, 1, 1))).toBe(29) // February (leap year)
      expect(getDaysInMonth(new Date(2026, 3, 1))).toBe(30) // April
      expect(getDaysInMonth(new Date(2026, 11, 1))).toBe(31) // December
    })

    it('handles leap years correctly', () => {
      expect(getDaysInMonth(new Date(2024, 1, 1))).toBe(29)
      expect(getDaysInMonth(new Date(2025, 1, 1))).toBe(28)
      expect(getDaysInMonth(new Date(2000, 1, 1))).toBe(29) // 2000 was a leap year
      expect(getDaysInMonth(new Date(1900, 1, 1))).toBe(28) // 1900 was not
    })
  })

  describe('getFirstDayOfMonth', () => {
    it('returns 0-6 for Sunday-Saturday', () => {
      const march2026 = new Date(2026, 2, 1) // March 1, 2026 is Sunday (0)
      expect(getFirstDayOfMonth(march2026)).toBe(0)

      const april2026 = new Date(2026, 3, 1) // April 1, 2026 is Wednesday (3)
      expect(getFirstDayOfMonth(april2026)).toBe(3)
    })

    it('works for different years', () => {
      const jan2025 = new Date(2025, 0, 1) // January 1, 2025 is Wednesday (3)
      expect(getFirstDayOfMonth(jan2025)).toBe(3)
    })
  })

  describe('isDateOverdue', () => {
    it('returns true for dates before today', () => {
      expect(isDateOverdue('2026-03-04')).toBe(true)
      expect(isDateOverdue('2026-03-01')).toBe(true)
      expect(isDateOverdue('2025-12-31')).toBe(true)
    })

    it('returns false for today and future dates', () => {
      expect(isDateOverdue('2026-03-05')).toBe(false)
      expect(isDateOverdue('2026-03-06')).toBe(false)
      expect(isDateOverdue('2027-01-01')).toBe(false)
    })
  })

  describe('getTodayString', () => {
    it('returns today as YYYY-MM-DD string', () => {
      expect(getTodayString()).toBe('2026-03-05')
    })

    it('updates when system time changes', () => {
      vi.setSystemTime(new Date('2025-12-25T00:00:00Z'))
      expect(getTodayString()).toBe('2025-12-25')

      vi.setSystemTime(new Date('2027-01-01T00:00:00Z'))
      expect(getTodayString()).toBe('2027-01-01')
    })
  })

  describe('generateCalendarGrid', () => {
    it('generates grid with correct number of empty cells', () => {
      const march2026 = new Date(2026, 2, 1) // March 1 is Sunday (0)
      const grid = generateCalendarGrid(march2026)

      expect(grid[0]).toBe(1) // No empty cells before first day
      expect(grid.length).toBe(31) // 31 days in March
    })

    it('fills empty cells for first week', () => {
      const april2026 = new Date(2026, 3, 1) // April 1 is Wednesday (3)
      const grid = generateCalendarGrid(april2026)

      expect(grid[0]).toBe(null)
      expect(grid[1]).toBe(null)
      expect(grid[2]).toBe(null)
      expect(grid[3]).toBe(1) // April 1st starts at index 3
      expect(grid.length).toBe(33) // 3 empty + 30 days
    })

    it('works for months with different lengths', () => {
      const feb2024 = new Date(2024, 1, 1) // Leap year February
      const grid = generateCalendarGrid(feb2024)
      const daysInGrid = grid.filter((day) => day !== null).length
      expect(daysInGrid).toBe(29)

      const feb2025 = new Date(2025, 1, 1) // Non-leap year February
      const grid2 = generateCalendarGrid(feb2025)
      const daysInGrid2 = grid2.filter((day) => day !== null).length
      expect(daysInGrid2).toBe(28)
    })
  })

  describe('getMonthName', () => {
    it('returns correct month names', () => {
      expect(getMonthName(new Date(2026, 0, 1))).toBe('January')
      expect(getMonthName(new Date(2026, 2, 1))).toBe('March')
      expect(getMonthName(new Date(2026, 11, 1))).toBe('December')
    })

    it('uses locale-appropriate names', () => {
      const marchDate = new Date(2026, 2, 1)
      const monthName = getMonthName(marchDate)
      expect(monthName).toMatch(/March|mars|März|marzo/i) // Works in various locales
    })
  })

  describe('formatDateToString', () => {
    it('formats Date object to YYYY-MM-DD', () => {
      const date = new Date(2026, 2, 15) // March 15, 2026
      expect(formatDateToString(date)).toBe('2026-03-15')
    })

    it('pads single-digit values', () => {
      const date = new Date(2026, 0, 5) // January 5, 2026
      expect(formatDateToString(date)).toBe('2026-01-05')
    })

    it('handles edge cases', () => {
      const leapDay = new Date(2024, 1, 29)
      expect(formatDateToString(leapDay)).toBe('2024-02-29')

      const endOfYear = new Date(2025, 11, 31)
      expect(formatDateToString(endOfYear)).toBe('2025-12-31')
    })
  })

  describe('integration: parseDate + formatDateToString', () => {
    it('round-trips correctly', () => {
      const original = '2026-03-15'
      const parsed = parseDate(original)
      const formatted = formatDateToString(parsed)
      expect(formatted).toBe(original)
    })
  })

  describe('integration: getDateString consistency', () => {
    it('matches formatDateToString output', () => {
      const date = new Date(2026, 2, 15)
      const fromGetDateString = getDateString(2026, 2, 15)
      const fromFormatDateToString = formatDateToString(date)
      expect(fromGetDateString).toBe(fromFormatDateToString)
    })
  })
})
