import type { Job } from '../domain'
import type { StatusFilter } from '../types/filters'
import {
  calculateConversionMetrics,
  calculateWeeklyTrends,
  calculateTimeInStage,
  findStuckJobs,
  calculateStatusDistribution,
  type StuckJob,
} from '../features/analytics'
import './AnalyticsView.css'

interface AnalyticsViewProps {
  jobs: Job[]
  onFilterByStatus?: (status: StatusFilter) => void
}

export function AnalyticsView({ jobs, onFilterByStatus }: AnalyticsViewProps) {
  const conversionMetrics = calculateConversionMetrics(jobs)
  const weeklyTrends = calculateWeeklyTrends(jobs)
  const timeInStage = calculateTimeInStage(jobs)
  const stuckJobs = findStuckJobs(jobs)
  const statusDistribution = calculateStatusDistribution(jobs)

  const formatTrend = (change: number): string => {
    if (change > 0) return `+${change}`
    return change.toString()
  }

  const getTrendClass = (change: number): string => {
    if (change > 0) return 'trend-up'
    if (change < 0) return 'trend-down'
    return 'trend-neutral'
  }

  const drillDown = (status: StatusFilter) => {
    onFilterByStatus?.(status)
  }

  return (
    <div className="analytics-view">
      <h2 className="analytics-header">Pipeline Analytics</h2>
      {onFilterByStatus && <p className="analytics-drilldown-hint">Click cards to open a filtered table view.</p>}

      {/* Overview Stats */}
      <section className="analytics-section">
        <h3>Overview</h3>
        <div className="stats-grid">
          <div className="stat-card interactive-card" onClick={() => drillDown('All')} role="button" tabIndex={0}>
            <div className="stat-value">{jobs.length}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
          <div className="stat-card interactive-card" onClick={() => drillDown('Wishlist')} role="button" tabIndex={0}>
            <div className="stat-value">{statusDistribution['Wishlist']}</div>
            <div className="stat-label">Wishlist</div>
          </div>
          <div className="stat-card interactive-card" onClick={() => drillDown('Applied')} role="button" tabIndex={0}>
            <div className="stat-value">{statusDistribution['Applied']}</div>
            <div className="stat-label">Applied</div>
          </div>
          <div className="stat-card interactive-card" onClick={() => drillDown('Phone Screen')} role="button" tabIndex={0}>
            <div className="stat-value">{statusDistribution['Phone Screen']}</div>
            <div className="stat-label">Phone Screens</div>
          </div>
          <div className="stat-card interactive-card" onClick={() => drillDown('Interview')} role="button" tabIndex={0}>
            <div className="stat-value">{statusDistribution['Interview']}</div>
            <div className="stat-label">Interviews</div>
          </div>
          <div className="stat-card interactive-card" onClick={() => drillDown('Offer')} role="button" tabIndex={0}>
            <div className="stat-value">{statusDistribution['Offer']}</div>
            <div className="stat-label">Offers</div>
          </div>
        </div>
      </section>

      {/* Conversion Funnel */}
      <section className="analytics-section">
        <h3>Conversion Rates</h3>
        <div className="conversion-grid">
          <div className="conversion-card interactive-card" onClick={() => drillDown('Applied')} role="button" tabIndex={0}>
            <div className="conversion-label">Wishlist → Applied</div>
            <div className="conversion-rate">{conversionMetrics.wishlistToApplied.rate}%</div>
            <div className="conversion-detail">
              {conversionMetrics.wishlistToApplied.converted} of {conversionMetrics.wishlistToApplied.total}
            </div>
          </div>
          <div className="conversion-card interactive-card" onClick={() => drillDown('Phone Screen')} role="button" tabIndex={0}>
            <div className="conversion-label">Applied → Phone Screen</div>
            <div className="conversion-rate">{conversionMetrics.appliedToPhoneScreen.rate}%</div>
            <div className="conversion-detail">
              {conversionMetrics.appliedToPhoneScreen.converted} of {conversionMetrics.appliedToPhoneScreen.total}
            </div>
          </div>
          <div className="conversion-card interactive-card" onClick={() => drillDown('Interview')} role="button" tabIndex={0}>
            <div className="conversion-label">Phone Screen → Interview</div>
            <div className="conversion-rate">{conversionMetrics.phoneScreenToInterview.rate}%</div>
            <div className="conversion-detail">
              {conversionMetrics.phoneScreenToInterview.converted} of{' '}
              {conversionMetrics.phoneScreenToInterview.total}
            </div>
          </div>
          <div className="conversion-card interactive-card" onClick={() => drillDown('Offer')} role="button" tabIndex={0}>
            <div className="conversion-label">Interview → Offer</div>
            <div className="conversion-rate">{conversionMetrics.interviewToOffer.rate}%</div>
            <div className="conversion-detail">
              {conversionMetrics.interviewToOffer.converted} of {conversionMetrics.interviewToOffer.total}
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Trends */}
      <section className="analytics-section">
        <h3>Weekly Momentum</h3>
        <div className="trends-grid">
          <div className="trend-card">
            <div className="trend-value">{weeklyTrends.currentWeek.newApplications}</div>
            <div className="trend-label">Applications This Week</div>
            <div className={`trend-change ${getTrendClass(weeklyTrends.changes.newApplications)}`}>
              {formatTrend(weeklyTrends.changes.newApplications)} from last week
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-value">{weeklyTrends.currentWeek.phoneScreens}</div>
            <div className="trend-label">Phone Screens</div>
            <div className={`trend-change ${getTrendClass(weeklyTrends.changes.phoneScreens)}`}>
              {formatTrend(weeklyTrends.changes.phoneScreens)} from last week
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-value">{weeklyTrends.currentWeek.interviews}</div>
            <div className="trend-label">Interviews</div>
            <div className={`trend-change ${getTrendClass(weeklyTrends.changes.interviews)}`}>
              {formatTrend(weeklyTrends.changes.interviews)} from last week
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-value">{weeklyTrends.currentWeek.offers}</div>
            <div className="trend-label">Offers</div>
            <div className={`trend-change ${getTrendClass(weeklyTrends.changes.offers)}`}>
              {formatTrend(weeklyTrends.changes.offers)} from last week
            </div>
          </div>
        </div>
      </section>

      {/* Time in Stage */}
      <section className="analytics-section">
        <h3>Median Time in Stage</h3>
        <div className="time-grid">
          <div className="time-card interactive-card" onClick={() => drillDown('Wishlist')} role="button" tabIndex={0}>
            <div className="time-status">Wishlist</div>
            <div className="time-value">{timeInStage.Wishlist.median} days</div>
            <div className="time-count">{timeInStage.Wishlist.jobs} jobs</div>
          </div>
          <div className="time-card interactive-card" onClick={() => drillDown('Applied')} role="button" tabIndex={0}>
            <div className="time-status">Applied</div>
            <div className="time-value">{timeInStage.Applied.median} days</div>
            <div className="time-count">{timeInStage.Applied.jobs} jobs</div>
          </div>
          <div className="time-card interactive-card" onClick={() => drillDown('Phone Screen')} role="button" tabIndex={0}>
            <div className="time-status">Phone Screen</div>
            <div className="time-value">{timeInStage['Phone Screen'].median} days</div>
            <div className="time-count">{timeInStage['Phone Screen'].jobs} jobs</div>
          </div>
          <div className="time-card interactive-card" onClick={() => drillDown('Interview')} role="button" tabIndex={0}>
            <div className="time-status">Interview</div>
            <div className="time-value">{timeInStage.Interview.median} days</div>
            <div className="time-count">{timeInStage.Interview.jobs} jobs</div>
          </div>
        </div>
      </section>

      {/* Stuck Jobs Alert */}
      {stuckJobs.length > 0 && (
        <section className="analytics-section stuck-jobs-section">
          <h3>⚠️ Stuck Jobs ({stuckJobs.length})</h3>
          <p className="stuck-jobs-description">
            These jobs have been in their current status longer than expected:
          </p>
          <div className="stuck-jobs-list">
            {stuckJobs.slice(0, 10).map((stuck: StuckJob) => (
              <div key={stuck.job.id} className="stuck-job-item">
                <div className="stuck-job-header">
                  <strong>{stuck.job.roleTitle}</strong> at {stuck.job.company}
                </div>
                <div className="stuck-job-details">
                  <span className="stuck-job-status">{stuck.job.status}</span>
                  <span className="stuck-job-duration">
                    {stuck.daysInStatus} days (threshold: {stuck.threshold})
                  </span>
                </div>
              </div>
            ))}
          </div>
          {stuckJobs.length > 10 && (
            <div className="stuck-jobs-more">
              + {stuckJobs.length - 10} more stuck jobs
            </div>
          )}
        </section>
      )}
    </div>
  )
}
