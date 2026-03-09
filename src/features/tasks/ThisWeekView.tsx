import type { Job, JobPriority } from '../../domain'
import { TaskCard } from './TaskCard'

interface ThisWeekViewProps {
  groupedJobs: Array<[string, Job[]]>
  today: string
  onComplete: (jobId: string) => void
  onSnooze: (jobId: string, days: number) => void
  onPriorityChange: (jobId: string, priority: JobPriority) => void
  onQuickAddAction: (jobId: string, action: string, dueDate: string) => void
  onOpenJob: (job: Job) => void
}

export function ThisWeekView({
  groupedJobs,
  today,
  onComplete,
  onSnooze,
  onPriorityChange,
  onQuickAddAction,
  onOpenJob,
}: ThisWeekViewProps) {
  return (
    <div className="tasks-view">
      <div className="tasks-view-header">
        <h3>This Week Actions</h3>
      </div>

      {!groupedJobs.length && <p className="empty">No tasks due in the next 7 days.</p>}

      {groupedJobs.map(([dueDate, jobs]) => (
        <section key={dueDate} className="tasks-group">
          <h4>{dueDate}</h4>
          <div className="tasks-list">
            {jobs.map((job) => (
              <TaskCard
                key={job.id}
                job={job}
                today={today}
                onComplete={onComplete}
                onSnooze={onSnooze}
                onPriorityChange={onPriorityChange}
                onQuickAddAction={onQuickAddAction}
                onOpenJob={onOpenJob}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
