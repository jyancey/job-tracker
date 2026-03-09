import type { Job } from '../../domain'
import {
  calculateConversionMetrics,
  calculateWeeklyTrends,
  calculateTimeInStage,
  calculateStatusDistribution,
} from './index'

/**
 * Exports analytics metrics to CSV format
 */
export function exportAnalyticsToCSV(jobs: Job[]): string {
  const now = new Date().toISOString().split('T')[0]
  
  const conversionMetrics = calculateConversionMetrics(jobs)
  const weeklyTrends = calculateWeeklyTrends(jobs)
  const timeInStage = calculateTimeInStage(jobs)
  const statusDistribution = calculateStatusDistribution(jobs)

  const rows: string[] = []

  // Header
  rows.push('Job Tracker Analytics Export')
  rows.push(`Generated: ${now}`)
  rows.push(`Total Jobs: ${jobs.length}`)
  rows.push('')

  // Status Distribution
  rows.push('Status Distribution')
  rows.push('Status,Count')
  Object.entries(statusDistribution).forEach(([status, count]) => {
    rows.push(`${status},${count}`)
  })
  rows.push('')

  // Conversion Rates
  rows.push('Conversion Rates')
  rows.push('Stage Transition,Conversion Rate,Converted,Total')
  rows.push(
    `Wishlist → Applied,${conversionMetrics.wishlistToApplied.rate}%,${conversionMetrics.wishlistToApplied.converted},${conversionMetrics.wishlistToApplied.total}`
  )
  rows.push(
    `Applied → Phone Screen,${conversionMetrics.appliedToPhoneScreen.rate}%,${conversionMetrics.appliedToPhoneScreen.converted},${conversionMetrics.appliedToPhoneScreen.total}`
  )
  rows.push(
    `Phone Screen → Interview,${conversionMetrics.phoneScreenToInterview.rate}%,${conversionMetrics.phoneScreenToInterview.converted},${conversionMetrics.phoneScreenToInterview.total}`
  )
  rows.push(
    `Interview → Offer,${conversionMetrics.interviewToOffer.rate}%,${conversionMetrics.interviewToOffer.converted},${conversionMetrics.interviewToOffer.total}`
  )
  rows.push('')

  // Time in Stage
  rows.push('Median Time in Stage (Days)')
  rows.push('Status,Median Days,Job Count')
  Object.entries(timeInStage).forEach(([status, data]) => {
    rows.push(`${status},${data.median},${data.jobs}`)
  })
  rows.push('')

  // Weekly Momentum
  rows.push('Weekly Momentum (This Week)')
  rows.push('Metric,This Week,Last Week,Change')
  rows.push(
    `Applications,${weeklyTrends.currentWeek.newApplications},${weeklyTrends.previousWeek.newApplications},${weeklyTrends.changes.newApplications}`
  )
  rows.push(`Phone Screens,${weeklyTrends.currentWeek.phoneScreens},${weeklyTrends.previousWeek.phoneScreens},${weeklyTrends.changes.phoneScreens}`)
  rows.push(`Interviews,${weeklyTrends.currentWeek.interviews},${weeklyTrends.previousWeek.interviews},${weeklyTrends.changes.interviews}`)
  rows.push(`Offers,${weeklyTrends.currentWeek.offers},${weeklyTrends.previousWeek.offers},${weeklyTrends.changes.offers}`)
  rows.push('')

  return rows.join('\n')
}

/**
 * Downloads analytics metrics as a CSV file
 */
export function downloadAnalyticsCSV(jobs: Job[]): void {
  const csv = exportAnalyticsToCSV(jobs)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  const timestamp = new Date().toISOString().split('T')[0]
  link.setAttribute('href', url)
  link.setAttribute('download', `job-tracker-analytics-${timestamp}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
