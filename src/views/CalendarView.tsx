import { useState, useMemo } from 'react'
import type { Job } from '../domain'
import {
  parseDate,
  getDateString,
  isDateOverdue,
  generateCalendarGrid,
  getMonthName,
} from '../utils/dateCalendarUtils'
import { createButtonKbdProps } from '../utils/a11yUtils'

interface CalendarViewProps {
  dueByDate: [string, Job[]][]
  onView?: (job: Job) => void
}

export function CalendarView({ dueByDate, onView }: CalendarViewProps) {
  // Create a map for faster lookup
  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>()
    for (const [date, jobs] of dueByDate) {
      map.set(date, jobs)
    }
    return map
  }, [dueByDate])

  // Get min and max dates to determine year/month range
  const [, maxDate] = useMemo(() => {
    if (dueByDate.length === 0) {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      return [dateStr, dateStr]
    }
    return [dueByDate[0][0], dueByDate[dueByDate.length - 1][0]]
  }, [dueByDate])

  const maxDateObj = parseDate(maxDate)
  const [currentMonth, setCurrentMonth] = useState(new Date(maxDateObj.getFullYear(), maxDateObj.getMonth()))

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const monthName = getMonthName(currentMonth)

  // Navigate months
  const goToPrevious = () => {
    setCurrentMonth(new Date(year, month - 1))
  }

  const goToNext = () => {
    setCurrentMonth(new Date(year, month + 1))
  }

  // Generate calendar grid
  const calendarDays = generateCalendarGrid(currentMonth)

  // Get jobs for a specific day
  const getJobsForDay = (day: number) => {
    const dateStr = getDateString(year, month, day)
    return jobsByDate.get(dateStr) || []
  }

  // Check if a date is overdue
  const isDayOverdue = (day: number) => {
    const dateStr = getDateString(year, month, day)
    return isDateOverdue(dateStr)
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button type="button" className="calendar-nav" onClick={goToPrevious}>
          ←
        </button>
        <h2 className="calendar-title">
          {monthName} {year}
        </h2>
        <button type="button" className="calendar-nav" onClick={goToNext}>
          →
        </button>
      </div>

      <div className="calendar-grid">
        {dayNames.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          const jobsForDay = day ? getJobsForDay(day) : []
          const hasJobs = jobsForDay.length > 0
          const overdue = day ? isDayOverdue(day) : false
          const isOverdueWithJobs = hasJobs && overdue

          return (
            <div
              key={index}
              className={`calendar-cell ${!day ? 'empty' : ''} ${hasJobs ? 'has-jobs' : ''} ${isOverdueWithJobs ? 'overdue' : ''}`}
            >
              {day && (
                <>
                  <div className="calendar-day-number">
                    {day}
                    {isOverdueWithJobs && <span className="overdue-badge">⚠</span>}
                  </div>
                  <div className="calendar-day-jobs">
                    {jobsForDay.slice(0, 2).map((job) => (
                      <div
                        key={job.id}
                        className="calendar-job-entry"
                        {...createButtonKbdProps(
                          () => onView?.(job),
                          `Click to view: ${job.company} - ${job.roleTitle}`
                        )}
                      >
                        {job.company}
                      </div>
                    ))}
                    {jobsForDay.length > 2 && (
                      <div className="calendar-job-more">+{jobsForDay.length - 2} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {dueByDate.length === 0 && <p className="empty">No scheduled follow-ups yet.</p>}
    </div>
  )
}
