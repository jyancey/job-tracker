import type { Job, JobPriority } from '../../domain'
import { TaskCard } from './TaskCard'

interface TodayViewProps {
  jobs: Job[]
  today: string
  overdueCount: number
  onComplete: (jobId: string) => void
  onSnooze: (jobId: string, days: number) => void
  onPriorityChange: (jobId: string, priority: JobPriority) => void
  onQuickAddAction: (jobId: string, action: string, dueDate: string) => void
  onOpenJob: (job: Job) => void
}

export function TodayView({
  jobs,
  today,
  overdueCount,
  onComplete,
  onSnooze,
  onPriorityChange,
  onQuickAddAction,
  onOpenJob,
}: TodayViewProps) {
  return (
    <div className="tasks-view">
      <div className="tasks-view-header">
        <h3>Today Actions</h3>
        <span className="tasks-overdue-badge">Overdue: {overdueCount}</span>
      </div>

      {!jobs.length && <p className="empty">No tasks due today. Great momentum.</p>}

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
    </div>
  )
}
