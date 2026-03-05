import { useState, useMemo } from 'react'
import type { Job } from '../domain'
import { formatDate } from '../utils/dateUtils'

interface CalendarViewProps {
  dueByDate: [string, Job[]][]
}

export function CalendarView({ dueByDate }: CalendarViewProps) {
  // Create a map for faster lookup
  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>()
    for (const [date, jobs] of dueByDate) {
      map.set(date, jobs)
    }
    return map
  }, [dueByDate])

  // Get min and max dates to determine year/month range
  const [minDate, maxDate] = useMemo(() => {
    if (dueByDate.length === 0) {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      return [dateStr, dateStr]
    }
    return [dueByDate[0][0], dueByDate[dueByDate.length - 1][0]]
  }, [dueByDate])

  // Parse date strings (YYYY-MM-DD format)
  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const maxDateObj = parseDate(maxDate)
  const [currentMonth, setCurrentMonth] = useState(new Date(maxDateObj.getFullYear(), maxDateObj.getMonth()))

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const monthName = currentMonth.toLocaleString('default', { month: 'long' })

  // Navigate months
  const goToPrevious = () => {
    setCurrentMonth(new Date(year, month - 1))
  }

  const goToNext = () => {
    setCurrentMonth(new Date(year, month + 1))
  }

  // Generate calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  // Format a YYYY-MM-DD string for a specific day
  const getDateString = (day: number) => {
    const dateObj = new Date(year, month, day)
    const y = dateObj.getFullYear()
    const m = String(dateObj.getMonth() + 1).padStart(2, '0')
    const d = String(dateObj.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Get jobs for a specific day
  const getJobsForDay = (day: number) => {
    const dateStr = getDateString(day)
    return jobsByDate.get(dateStr) || []
  }

  // Check if a date is overdue
  const isDateOverdue = (day: number) => {
    const dateStr = getDateString(day)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    return dateStr < todayStr
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
          const overdue = day ? isDateOverdue(day) : false

          return (
            <div
              key={index}
              className={`calendar-cell ${!day ? 'empty' : ''} ${hasJobs ? 'has-jobs' : ''} ${overdue ? 'overdue' : ''}`}
            >
              {day && (
                <>
                  <div className="calendar-day-number">
                    {day}
                    {overdue && <span className="overdue-badge">⚠</span>}
                  </div>
                  <div className="calendar-day-jobs">
                    {jobsForDay.slice(0, 2).map((job) => (
                      <div key={job.id} className="calendar-job-entry" title={`${job.company} - ${job.roleTitle}`}>
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
