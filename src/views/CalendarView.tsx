import type { Job } from '../domain'
import { formatDate } from '../utils/dateUtils'

interface CalendarViewProps {
  dueByDate: [string, Job[]][]
}

export function CalendarView({ dueByDate }: CalendarViewProps) {
  return (
    <div className="calendar-list">
      {dueByDate.map(([date, entries]) => (
        <article key={date} className="calendar-row">
          <h3>{formatDate(date)}</h3>
          {entries.map((job) => (
            <div key={job.id} className="calendar-item">
              <strong>{job.company}</strong>
              <span>{job.roleTitle}</span>
              <small>{job.nextAction || 'Follow up'}</small>
            </div>
          ))}
        </article>
      ))}
      {!dueByDate.length && <p className="empty">No scheduled follow-ups yet.</p>}
    </div>
  )
}
