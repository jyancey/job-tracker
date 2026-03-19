// View of jobs with next actions due in the next 7 days, grouped by date and sorted by priority.
import type { Job, JobPriority } from '../../domain'
import { TaskCard } from './TaskCard'

/**
 * ThisWeekView component displays a list of tasks (jobs with next actions) that are due in the next 7 days.
 * It groups tasks by their due date and renders a TaskCard for each job, allowing users to manage their tasks
 * directly from this view. The component also handles the case when there are no tasks due in the next week.
 *
 * Props:
 * - groupedJobs: An array of tuples where each tuple contains a due date string and an array of Job objects due on that date.
 * - today: A string representing today's date in 'YYYY-MM-DD' format for overdue calculation.
 * - onComplete: Callback function to mark a task as complete.
 * - onSnooze: Callback function to snooze a task's due date by a specified number of days.
 * - onPriorityChange: Callback function to update a task's priority level.
 * - onQuickAddAction: Callback function to quickly update a task's next action and due date.
 * - onOpenJob: Callback function to open the full job details view.
 */
interface ThisWeekViewProps {
  groupedJobs: Array<[string, Job[]]>
  today: string
  onComplete: (jobId: string) => void
  onSnooze: (jobId: string, days: number) => void
  onPriorityChange: (jobId: string, priority: JobPriority) => void
  onQuickAddAction: (jobId: string, action: string, dueDate: string) => void
  onOpenJob: (job: Job) => void
}

/**
 * ThisWeekView component displays a list of tasks (jobs with next actions) that are due in the next 7 days.
 * It groups tasks by their due date and renders a TaskCard for each job, allowing users to manage their tasks
 * directly from this view. The component also handles the case when there are no tasks due in the next week.
 *
 * @param param0 - The props for the ThisWeekView component.
 * @returns A JSX element representing the tasks view for the week.
 */
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
