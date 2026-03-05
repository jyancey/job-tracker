import { describe, it, expect } from 'vitest'
import { parseSalaryRange } from './salaryUtils'

describe('salaryUtils', (): void => {
  describe('parseSalaryRange', (): void => {
    it('returns true if no min or max specified', (): void => {
      expect(parseSalaryRange('$100k', '', '')).toBe(true)
      expect(parseSalaryRange('$50k', '', '')).toBe(true)
    })

    it('returns true if salary is within range', (): void => {
      expect(parseSalaryRange('$100k', '80', '120')).toBe(true)
      expect(parseSalaryRange('$100000', '80000', '120000')).toBe(true)
    })

    it('returns false if salary is below minimum', (): void => {
      expect(parseSalaryRange('$50k', '80', '120')).toBe(false)
      expect(parseSalaryRange('$40000', '80000', '120000')).toBe(false)
    })

    it('returns false if salary is above maximum', (): void => {
      expect(parseSalaryRange('$150k', '80', '120')).toBe(false)
      expect(parseSalaryRange('$150000', '80000', '120000')).toBe(false)
    })

    it('returns true if only minimum specified', (): void => {
      expect(parseSalaryRange('$100k', '80', '')).toBe(true)
      expect(parseSalaryRange('$50k', '80', '')).toBe(false)
    })

    it('returns true if only maximum specified', (): void => {
      expect(parseSalaryRange('$100k', '', '120')).toBe(true)
      expect(parseSalaryRange('$150k', '', '120')).toBe(false)
    })

    it('returns false if no numbers in salary', (): void => {
      expect(parseSalaryRange('invalid', '80', '120')).toBe(false)
      expect(parseSalaryRange('', '80', '120')).toBe(false)
    })

    it('handles comma-separated numbers', (): void => {
      expect(parseSalaryRange('$100,000', '80', '120')).toBe(true)
    })
  })
})
