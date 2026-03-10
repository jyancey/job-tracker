import { describe, it, expect } from 'vitest'
import {
  calculateConversionMetrics,
  calculateWeeklyTrends,
  calculateStatusDistribution,
} from './pipelineMetrics'
import { Job, JobStatus } from '../../domain'

// Helper to create test jobs
function createJob(overrides: Partial<Job>): Job {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    company: 'Test Corp',
    roleTitle: 'Engineer',
    applicationDate: now,
    status: 'Applied' as JobStatus,
    jobUrl: '',
    atsUrl: '',
    salaryRange: '',
    notes: '',
    contactPerson: '',
    nextAction: '',
    nextActionDueDate: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('calculateConversionMetrics', () => {
  it('handles empty job list', () => {
    const metrics = calculateConversionMetrics([])

    expect(metrics.appliedToPhoneScreen).toEqual({ total: 0, converted: 0, rate: 0 })
    expect(metrics.phoneScreenToInterview).toEqual({ total: 0, converted: 0, rate: 0 })
    expect(metrics.interviewToOffer).toEqual({ total: 0, converted: 0, rate: 0 })
  })

  it('calculates basic conversion funnel', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied' }),
      createJob({ status: 'Applied' }),
      createJob({ status: 'Phone Screen' }),
      createJob({ status: 'Interview' }),
      createJob({ status: 'Offer' }),
    ]

    const metrics = calculateConversionMetrics(jobs)

    // 5 reached Applied, 3 reached Phone Screen or beyond
    expect(metrics.appliedToPhoneScreen.total).toBe(5)
    expect(metrics.appliedToPhoneScreen.converted).toBe(3)
    expect(metrics.appliedToPhoneScreen.rate).toBe(60) // 3/5 = 60%

    // 3 reached Phone Screen, 2 reached Interview or beyond
    expect(metrics.phoneScreenToInterview.total).toBe(3)
    expect(metrics.phoneScreenToInterview.converted).toBe(2)
    expect(metrics.phoneScreenToInterview.rate).toBe(67) // 2/3 = 67%

    // 2 reached Interview, 1 reached Offer
    expect(metrics.interviewToOffer.total).toBe(2)
    expect(metrics.interviewToOffer.converted).toBe(1)
    expect(metrics.interviewToOffer.rate).toBe(50) // 1/2 = 50%
  })

  it('excludes rejected and withdrawn jobs from conversion calculations', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied' }),
      createJob({ status: 'Phone Screen' }),
      createJob({ status: 'Rejected' }),
      createJob({ status: 'Rejected' }),
      createJob({ status: 'Withdrawn' }),
    ]

    const metrics = calculateConversionMetrics(jobs)

    // Only 2 non-rejected/withdrawn jobs progressed
    expect(metrics.appliedToPhoneScreen.converted).toBe(1)
  })

  it('handles all jobs at same status', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied' }),
      createJob({ status: 'Applied' }),
      createJob({ status: 'Applied' }),
    ]

    const metrics = calculateConversionMetrics(jobs)

    expect(metrics.appliedToPhoneScreen.total).toBe(3)
    expect(metrics.appliedToPhoneScreen.converted).toBe(0)
    expect(metrics.appliedToPhoneScreen.rate).toBe(0)
  })

  it('calculates 100% conversion when all progress through funnel', () => {
    const jobs: Job[] = [
      createJob({ status: 'Offer' }),
      createJob({ status: 'Offer' }),
    ]

    const metrics = calculateConversionMetrics(jobs)

    expect(metrics.appliedToPhoneScreen.rate).toBe(100)
    expect(metrics.phoneScreenToInterview.rate).toBe(100)
    expect(metrics.interviewToOffer.rate).toBe(100)
  })
})

describe('calculateWeeklyTrends', () => {
  it('handles empty job list', () => {
    const trends = calculateWeeklyTrends([])

    expect(trends.currentWeek).toEqual({
      newApplications: 0,
      phoneScreens: 0,
      interviews: 0,
      offers: 0,
    })
    expect(trends.previousWeek).toEqual({
      newApplications: 0,
      phoneScreens: 0,
      interviews: 0,
      offers: 0,
    })
    expect(trends.changes).toEqual({
      newApplications: 0,
      phoneScreens: 0,
      interviews: 0,
      offers: 0,
    })
  })

  it('counts applications from current week', () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()

    const jobs: Job[] = [
      createJob({ status: 'Applied', applicationDate: yesterday }),
      createJob({ status: 'Applied', applicationDate: threeDaysAgo }),
    ]

    const trends = calculateWeeklyTrends(jobs)

    expect(trends.currentWeek.newApplications).toBe(2)
  })

  it('separates current week from previous week', () => {
    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()

    const jobs: Job[] = [
      createJob({ status: 'Applied', applicationDate: twoDaysAgo }),
      createJob({ status: 'Applied', applicationDate: tenDaysAgo }),
    ]

    const trends = calculateWeeklyTrends(jobs)

    expect(trends.currentWeek.newApplications).toBe(1)
    expect(trends.previousWeek.newApplications).toBe(1)
  })

  it('calculates changes correctly', () => {
    const now = new Date()
    const recentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()

    const jobs: Job[] = [
      // Current week: 3 applications
      createJob({ status: 'Applied', applicationDate: recentDate }),
      createJob({ status: 'Applied', applicationDate: recentDate }),
      createJob({ status: 'Applied', applicationDate: recentDate }),
      // Previous week: 1 application
      createJob({ status: 'Applied', applicationDate: oldDate }),
    ]

    const trends = calculateWeeklyTrends(jobs)

    expect(trends.changes.newApplications).toBe(2) // 3 - 1 = +2
  })

  it('tracks negative changes (decline)', () => {
    const now = new Date()
    const recentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()

    const jobs: Job[] = [
      // Current week: 1 application
      createJob({ status: 'Applied', applicationDate: recentDate }),
      // Previous week: 5 applications
      createJob({ status: 'Applied', applicationDate: oldDate }),
      createJob({ status: 'Applied', applicationDate: oldDate }),
      createJob({ status: 'Applied', applicationDate: oldDate }),
      createJob({ status: 'Applied', applicationDate: oldDate }),
      createJob({ status: 'Applied', applicationDate: oldDate }),
    ]

    const trends = calculateWeeklyTrends(jobs)

    expect(trends.changes.newApplications).toBe(-4) // 1 - 5 = -4
  })

  it('counts status transitions based on updatedAt', () => {
    const now = new Date()
    const recentUpdate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()

    const jobs: Job[] = [
      createJob({ status: 'Phone Screen', updatedAt: recentUpdate }),
      createJob({ status: 'Interview', updatedAt: recentUpdate }),
      createJob({ status: 'Offer', updatedAt: recentUpdate }),
    ]

    const trends = calculateWeeklyTrends(jobs)

    expect(trends.currentWeek.phoneScreens).toBe(1)
    expect(trends.currentWeek.interviews).toBe(1)
    expect(trends.currentWeek.offers).toBe(1)
  })
})

describe('calculateStatusDistribution', () => {
  it('handles empty job list', () => {
    const distribution = calculateStatusDistribution([])

    expect(distribution).toEqual({
      Wishlist: 0,
      Applied: 0,
      'Phone Screen': 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
      Withdrawn: 0,
    })
  })

  it('counts jobs by status', () => {
    const jobs: Job[] = [
      createJob({ status: 'Wishlist' }),
      createJob({ status: 'Applied' }),
      createJob({ status: 'Applied' }),
      createJob({ status: 'Phone Screen' }),
      createJob({ status: 'Interview' }),
      createJob({ status: 'Offer' }),
      createJob({ status: 'Rejected' }),
      createJob({ status: 'Rejected' }),
      createJob({ status: 'Withdrawn' }),
    ]

    const distribution = calculateStatusDistribution(jobs)

    expect(distribution.Wishlist).toBe(1)
    expect(distribution.Applied).toBe(2)
    expect(distribution['Phone Screen']).toBe(1)
    expect(distribution.Interview).toBe(1)
    expect(distribution.Offer).toBe(1)
    expect(distribution.Rejected).toBe(2)
    expect(distribution.Withdrawn).toBe(1)
  })

  it('handles all jobs at same status', () => {
    const jobs: Job[] = [
      createJob({ status: 'Applied' }),
      createJob({ status: 'Applied' }),
      createJob({ status: 'Applied' }),
    ]

    const distribution = calculateStatusDistribution(jobs)

    expect(distribution.Applied).toBe(3)
    expect(distribution.Wishlist).toBe(0)
    expect(distribution['Phone Screen']).toBe(0)
  })
})
