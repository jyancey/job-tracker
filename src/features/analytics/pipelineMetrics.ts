import { JOB_STATUSES } from '../../domain'
import type { Job, JobStatus } from '../../domain'

/**
 * Conversion metrics between pipeline stages
 */
export interface ConversionMetrics {
  // Applied -> Phone Screen
  appliedToPhoneScreen: {
    total: number
    converted: number
    rate: number
  }
  // Phone Screen -> Interview
  phoneScreenToInterview: {
    total: number
    converted: number
    rate: number
  }
  // Interview -> Offer
  interviewToOffer: {
    total: number
    converted: number
    rate: number
  }
}

/**
 * Weekly trend metrics
 */
export interface WeeklyTrends {
  currentWeek: {
    newApplications: number
    phoneScreens: number
    interviews: number
    offers: number
  }
  previousWeek: {
    newApplications: number
    phoneScreens: number
    interviews: number
    offers: number
  }
  changes: {
    newApplications: number // positive = increase, negative = decrease
    phoneScreens: number
    interviews: number
    offers: number
  }
}

/**
 * Status distribution counts
 */
export interface StatusDistribution {
  [key: string]: number
  Applied: number
  'Phone Screen': number
  Interview: number
  Offer: number
  Rejected: number
  Withdrawn: number
}

/**
 * Calculate conversion rates between pipeline stages
 */
export function calculateConversionMetrics(jobs: Job[]): ConversionMetrics {
  // Helper to count jobs that reached at least a certain status
  const countAtOrPast = (status: JobStatus): number => {
    const statusIndex = JOB_STATUSES.indexOf(status)
    return jobs.filter((job) => {
      const jobStatusIndex = JOB_STATUSES.indexOf(job.status)
      return jobStatusIndex >= statusIndex && job.status !== 'Rejected' && job.status !== 'Withdrawn'
    }).length
  }

  const appliedCount = countAtOrPast('Applied')
  const phoneScreenCount = countAtOrPast('Phone Screen')
  const interviewCount = countAtOrPast('Interview')
  const offerCount = countAtOrPast('Offer')

  const calculateRate = (converted: number, total: number): number => {
    return total > 0 ? Math.round((converted / total) * 100) : 0
  }

  return {
    appliedToPhoneScreen: {
      total: appliedCount,
      converted: phoneScreenCount,
      rate: calculateRate(phoneScreenCount, appliedCount),
    },
    phoneScreenToInterview: {
      total: phoneScreenCount,
      converted: interviewCount,
      rate: calculateRate(interviewCount, phoneScreenCount),
    },
    interviewToOffer: {
      total: interviewCount,
      converted: offerCount,
      rate: calculateRate(offerCount, interviewCount),
    },
  }
}

/**
 * Calculate weekly trends for key metrics
 */
export function calculateWeeklyTrends(jobs: Job[]): WeeklyTrends {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const currentWeek = {
    newApplications: jobs.filter((j) => {
      const appDate = new Date(j.applicationDate)
      return appDate >= oneWeekAgo && j.status !== 'Wishlist'
    }).length,
    phoneScreens: jobs.filter((j) => {
      const updated = new Date(j.updatedAt)
      return updated >= oneWeekAgo && j.status === 'Phone Screen'
    }).length,
    interviews: jobs.filter((j) => {
      const updated = new Date(j.updatedAt)
      return updated >= oneWeekAgo && j.status === 'Interview'
    }).length,
    offers: jobs.filter((j) => {
      const updated = new Date(j.updatedAt)
      return updated >= oneWeekAgo && j.status === 'Offer'
    }).length,
  }

  const previousWeek = {
    newApplications: jobs.filter((j) => {
      const appDate = new Date(j.applicationDate)
      return appDate >= twoWeeksAgo && appDate < oneWeekAgo && j.status !== 'Wishlist'
    }).length,
    phoneScreens: jobs.filter((j) => {
      const updated = new Date(j.updatedAt)
      return updated >= twoWeeksAgo && updated < oneWeekAgo && j.status === 'Phone Screen'
    }).length,
    interviews: jobs.filter((j) => {
      const updated = new Date(j.updatedAt)
      return updated >= twoWeeksAgo && updated < oneWeekAgo && j.status === 'Interview'
    }).length,
    offers: jobs.filter((j) => {
      const updated = new Date(j.updatedAt)
      return updated >= twoWeeksAgo && updated < oneWeekAgo && j.status === 'Offer'
    }).length,
  }

  return {
    currentWeek,
    previousWeek,
    changes: {
      newApplications: currentWeek.newApplications - previousWeek.newApplications,
      phoneScreens: currentWeek.phoneScreens - previousWeek.phoneScreens,
      interviews: currentWeek.interviews - previousWeek.interviews,
      offers: currentWeek.offers - previousWeek.offers,
    },
  }
}

/**
 * Calculate count of jobs by status
 */
export function calculateStatusDistribution(jobs: Job[]): StatusDistribution {
  const distribution: StatusDistribution = {
    Wishlist: 0,
    Applied: 0,
    'Phone Screen': 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0,
    Withdrawn: 0,
  }

  jobs.forEach((job) => {
    distribution[job.status]++
  })

  return distribution
}
