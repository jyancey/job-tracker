// Calculates weighted composite job scores from five dimensions (fit, compensation, location, growth, confidence).
import type { Job } from '../domain'

/**
 * Scoring weights configuration
 * Each weight represents the relative importance of a scoring dimension
 */
export interface ScoreWeights {
  fit: number
  compensation: number
  location: number
  growth: number
  confidence: number
}

/**
 * Default scoring weights (all equal importance)
 */
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  fit: 1.0,
  compensation: 1.0,
  location: 1.0,
  growth: 1.0,
  confidence: 1.0,
}

/**
 * Calculate the total weighted score for a job
 * Returns null if no scoring data is present
 */
export function calculateJobScore(job: Job, weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS): number | null {
  const scores: number[] = []
  const activeWeights: number[] = []

  if (job.scoreFit != null && job.scoreFit >= 0) {
    scores.push(job.scoreFit)
    activeWeights.push(weights.fit)
  }
  if (job.scoreCompensation != null && job.scoreCompensation >= 0) {
    scores.push(job.scoreCompensation)
    activeWeights.push(weights.compensation)
  }
  if (job.scoreLocation != null && job.scoreLocation >= 0) {
    scores.push(job.scoreLocation)
    activeWeights.push(weights.location)
  }
  if (job.scoreGrowth != null && job.scoreGrowth >= 0) {
    scores.push(job.scoreGrowth)
    activeWeights.push(weights.growth)
  }
  if (job.scoreConfidence != null && job.scoreConfidence >= 0) {
    scores.push(job.scoreConfidence)
    activeWeights.push(weights.confidence)
  }

  // Return null if no scores are present
  if (scores.length === 0) {
    return null
  }

  // Calculate weighted average
  const weightSum = activeWeights.reduce((sum, w) => sum + w, 0)
  const weightedSum = scores.reduce((sum, score, i) => sum + score * activeWeights[i], 0)

  return weightSum > 0 ? weightedSum / weightSum : 0
}

/**
 * Check if a job has any scoring data
 */
export function hasScoring(job: Job): boolean {
  return (
    job.scoreFit != null ||
    job.scoreCompensation != null ||
    job.scoreLocation != null ||
    job.scoreGrowth != null ||
    job.scoreConfidence != null
  )
}

/**
 * Normalize weights so they sum to 1.0 while maintaining ratios
 */
export function normalizeWeights(weights: ScoreWeights): ScoreWeights {
  const sum = weights.fit + weights.compensation + weights.location + weights.growth + weights.confidence

  if (sum === 0) {
    return DEFAULT_SCORE_WEIGHTS
  }

  return {
    fit: weights.fit / sum,
    compensation: weights.compensation / sum,
    location: weights.location / sum,
    growth: weights.growth / sum,
    confidence: weights.confidence / sum,
  }
}

/**
 * Validate that a score value is within the valid range (0-5)
 */
export function isValidScore(score: number | undefined | null): boolean {
  if (score == null) {
    return true // null/undefined is valid (no score)
  }
  return Number.isFinite(score) && score >= 0 && score <= 5
}

/**
 * Scoring service for managing score weights and calculations
 */
export class ScoringService {
  private weights: ScoreWeights

  constructor(weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS) {
    this.weights = normalizeWeights(weights)
  }

  getWeights(): ScoreWeights {
    return { ...this.weights }
  }

  setWeights(weights: ScoreWeights): void {
    this.weights = normalizeWeights(weights)
  }

  calculateScore(job: Job): number | null {
    return calculateJobScore(job, this.weights)
  }

  /**
   * Sort jobs by score (descending, with unscored jobs at the end)
   */
  sortByScore(jobs: Job[]): Job[] {
    return [...jobs].sort((a, b) => {
      const scoreA = this.calculateScore(a)
      const scoreB = this.calculateScore(b)

      // Unscored jobs go to the end
      if (scoreA === null && scoreB === null) return 0
      if (scoreA === null) return 1
      if (scoreB === null) return -1

      // Higher scores first
      return scoreB - scoreA
    })
  }
}

/**
 * Create a scoring service instance
 */
export function createScoringService(weights?: ScoreWeights): ScoringService {
  return new ScoringService(weights)
}
