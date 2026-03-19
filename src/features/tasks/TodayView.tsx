// View of jobs with next actions due today or overdue, sorted by priority with badge count.
import type { Job, JobPriority } from '../../domain'
import { TaskCard } from './TaskCard'

/**
 * TodayView component displays a list of tasks (jobs with next actions) that are due today or overdue.
 * It sorts tasks by priority and shows a badge count of overdue tasks. The component allows users to
 * manage their tasks directly from this view, including marking tasks as complete, snoozing them,
 * updating their priority, and quickly changing the next action and due date. If there are no tasks
 * due today, it displays a message encouraging the user.
 *
 * Props:
 * - jobs: An array of Job objects that are due today or overdue.
 * - today: A string representing today's date in 'YYYY-MM-DD' format for overdue calculation.
 * - overdueCount: The number of tasks that are overdue.
 * - onComplete: Callback function to mark a task as complete.
 * - onSnooze: Callback function to snooze a task's due date by a specified number of days.
 * - onPriorityChange: Callback function to update a task's priority level.
 * - onQuickAddAction: Callback function to quickly update a task's next action and due date.
 * - onOpenJob: Callback function to open the full job details view.
 */
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

/**
 * TodayView component displays a list of tasks (jobs with next actions) that are due today or overdue.
 * It sorts tasks by priority and shows a badge count of overdue tasks. The component allows users to
 * manage their tasks directly from this view, including marking tasks as complete, snoozing them,
 * updating their priority, and quickly changing the next action and due date. If there are no tasks
 * due today, it displays a message encouraging the user.
 *
 * @param param0 - The props for the TodayView component.
 * @returns A JSX element representing the tasks view for today.
 */
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
