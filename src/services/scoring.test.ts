import { describe, it, expect } from 'vitest'
import type { Job } from '../domain'
import {
  calculateJobScore,
  hasScoring,
  normalizeWeights,
  isValidScore,
  createScoringService,
  DEFAULT_SCORE_WEIGHTS,
  type ScoreWeights,
} from './scoring'

const createMockJob = (scores: Partial<Job> = {}): Job => ({
  id: '1',
  company: 'Test Co',
  roleTitle: 'Engineer',
  applicationDate: '2026-03-01',
  status: 'Applied',
  jobUrl: '',
  atsUrl: '',
  salaryRange: '',
  notes: '',
  contactPerson: '',
  nextAction: '',
  nextActionDueDate: '',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  ...scores,
})

describe('calculateJobScore', () => {
  it('returns null when no scores are present', () => {
    const job = createMockJob()
    expect(calculateJobScore(job)).toBeNull()
  })

  it('calculates average with equal weights when all scores present', () => {
    const job = createMockJob({
      scoreFit: 5,
      scoreCompensation: 4,
      scoreLocation: 3,
      scoreGrowth: 2,
      scoreConfidence: 1,
    })
    // Average: (5 + 4 + 3 + 2 + 1) / 5 = 3
    expect(calculateJobScore(job)).toBe(3)
  })

  it('calculates average with partial scores', () => {
    const job = createMockJob({
      scoreFit: 5,
      scoreCompensation: 3,
    })
    // Average: (5 + 3) / 2 = 4
    expect(calculateJobScore(job)).toBe(4)
  })

  it('applies custom weights correctly', () => {
    const job = createMockJob({
      scoreFit: 5,
      scoreCompensation: 3,
    })
    const weights: ScoreWeights = {
      fit: 2.0,
      compensation: 1.0,
      location: 1.0,
      growth: 1.0,
      confidence: 1.0,
    }
    // Weighted: (5 * 2 + 3 * 1) / (2 + 1) = 13 / 3 ≈ 4.33
    expect(calculateJobScore(job, weights)).toBeCloseTo(4.333, 2)
  })

  it('ignores zero values when calculating', () => {
    const job = createMockJob({
      scoreFit: 0,
      scoreCompensation: 4,
    })
    // Both should be included: (0 + 4) / 2 = 2
    expect(calculateJobScore(job)).toBe(2)
  })

  it('handles all zeros', () => {
    const job = createMockJob({
      scoreFit: 0,
      scoreCompensation: 0,
      scoreLocation: 0,
      scoreGrowth: 0,
      scoreConfidence: 0,
    })
    expect(calculateJobScore(job)).toBe(0)
  })

  it('handles single score', () => {
    const job = createMockJob({
      scoreFit: 4.5,
    })
    expect(calculateJobScore(job)).toBe(4.5)
  })
})

describe('hasScoring', () => {
  it('returns false when no scores present', () => {
    const job = createMockJob()
    expect(hasScoring(job)).toBe(false)
  })

  it('returns true when at least one score present', () => {
    const job = createMockJob({ scoreFit: 3 })
    expect(hasScoring(job)).toBe(true)
  })

  it('returns true for zero scores', () => {
    const job = createMockJob({ scoreFit: 0 })
    expect(hasScoring(job)).toBe(true)
  })

  it('returns true when multiple scores present', () => {
    const job = createMockJob({
      scoreFit: 5,
      scoreCompensation: 4,
    })
    expect(hasScoring(job)).toBe(true)
  })
})

describe('normalizeWeights', () => {
  it('normalizes weights to sum to 1', () => {
    const weights: ScoreWeights = {
      fit: 2,
      compensation: 3,
      location: 1,
      growth: 1,
      confidence: 3,
    }
    // Sum = 10, so each should be divided by 10
    const normalized = normalizeWeights(weights)
    expect(normalized.fit).toBe(0.2)
    expect(normalized.compensation).toBe(0.3)
    expect(normalized.location).toBe(0.1)
    expect(normalized.growth).toBe(0.1)
    expect(normalized.confidence).toBe(0.3)

    // Sum should be 1
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 10)
  })

  it('returns default weights when sum is zero', () => {
    const weights: ScoreWeights = {
      fit: 0,
      compensation: 0,
      location: 0,
      growth: 0,
      confidence: 0,
    }
    const normalized = normalizeWeights(weights)
    expect(normalized).toEqual(DEFAULT_SCORE_WEIGHTS)
  })

  it('preserves equal weights', () => {
    const weights: ScoreWeights = {
      fit: 1,
      compensation: 1,
      location: 1,
      growth: 1,
      confidence: 1,
    }
    const normalized = normalizeWeights(weights)
    expect(normalized.fit).toBe(0.2)
    expect(normalized.compensation).toBe(0.2)
    expect(normalized.location).toBe(0.2)
    expect(normalized.growth).toBe(0.2)
    expect(normalized.confidence).toBe(0.2)
  })
})

describe('isValidScore', () => {
  it('returns true for null and undefined', () => {
    expect(isValidScore(null)).toBe(true)
    expect(isValidScore(undefined)).toBe(true)
  })

  it('returns true for valid scores (0-5)', () => {
    expect(isValidScore(0)).toBe(true)
    expect(isValidScore(2.5)).toBe(true)
    expect(isValidScore(5)).toBe(true)
  })

  it('returns false for scores outside range', () => {
    expect(isValidScore(-1)).toBe(false)
    expect(isValidScore(5.1)).toBe(false)
    expect(isValidScore(10)).toBe(false)
  })

  it('returns false for non-finite values', () => {
    expect(isValidScore(NaN)).toBe(false)
    expect(isValidScore(Infinity)).toBe(false)
    expect(isValidScore(-Infinity)).toBe(false)
  })
})

describe('ScoringService', () => {
  it('initializes with default weights', () => {
    const service = createScoringService()
    const normalized = normalizeWeights(DEFAULT_SCORE_WEIGHTS)
    expect(service.getWeights()).toEqual(normalized)
  })

  it('initializes with custom weights', () => {
    const weights: ScoreWeights = {
      fit: 2,
      compensation: 2,
      location: 1,
      growth: 1,
      confidence: 1,
    }
    const service = createScoringService(weights)
    const normalized = normalizeWeights(weights)
    expect(service.getWeights()).toEqual(normalized)
  })

  it('updates weights', () => {
    const service = createScoringService()
    const newWeights: ScoreWeights = {
      fit: 3,
      compensation: 2,
      location: 1,
      growth: 1,
      confidence: 1,
    }
    service.setWeights(newWeights)
    const normalized = normalizeWeights(newWeights)
    expect(service.getWeights()).toEqual(normalized)
  })

  it('calculates score using service weights', () => {
    const weights: ScoreWeights = {
      fit: 2,
      compensation: 1,
      location: 1,
      growth: 1,
      confidence: 1,
    }
    const service = createScoringService(weights)
    const job = createMockJob({
      scoreFit: 5,
      scoreCompensation: 3,
    })
    const score = service.calculateScore(job)
    expect(score).toBeCloseTo(4.333, 2)
  })

  describe('sortByScore', () => {
    it('sorts jobs by score descending', () => {
      const service = createScoringService()
      const jobs = [
        createMockJob({ id: '1', scoreFit: 3 }),
        createMockJob({ id: '2', scoreFit: 5 }),
        createMockJob({ id: '3', scoreFit: 1 }),
      ]
      const sorted = service.sortByScore(jobs)
      expect(sorted[0].id).toBe('2') // score 5
      expect(sorted[1].id).toBe('1') // score 3
      expect(sorted[2].id).toBe('3') // score 1
    })

    it('places unscored jobs at the end', () => {
      const service = createScoringService()
      const jobs = [
        createMockJob({ id: '1', scoreFit: 3 }),
        createMockJob({ id: '2' }), // no score
        createMockJob({ id: '3', scoreFit: 5 }),
        createMockJob({ id: '4' }), // no score
      ]
      const sorted = service.sortByScore(jobs)
      expect(sorted[0].id).toBe('3') // score 5
      expect(sorted[1].id).toBe('1') // score 3
      expect(sorted[2].id).toBe('2') // no score
      expect(sorted[3].id).toBe('4') // no score
    })

    it('does not mutate original array', () => {
      const service = createScoringService()
      const jobs = [
        createMockJob({ id: '1', scoreFit: 3 }),
        createMockJob({ id: '2', scoreFit: 5 }),
      ]
      const original = [...jobs]
      service.sortByScore(jobs)
      expect(jobs).toEqual(original)
    })

    it('handles empty array', () => {
      const service = createScoringService()
      const sorted = service.sortByScore([])
      expect(sorted).toEqual([])
    })

    it('applies custom weights when sorting', () => {
      const weights: ScoreWeights = {
        fit: 0,
        compensation: 1,
        location: 0,
        growth: 0,
        confidence: 0,
      }
      const service = createScoringService(weights)
      const jobs = [
        createMockJob({ id: '1', scoreFit: 5, scoreCompensation: 2 }), // score = 2
        createMockJob({ id: '2', scoreFit: 1, scoreCompensation: 4 }), // score = 4
      ]
      const sorted = service.sortByScore(jobs)
      expect(sorted[0].id).toBe('2') // compensation weighted higher
      expect(sorted[1].id).toBe('1')
    })
  })
})
