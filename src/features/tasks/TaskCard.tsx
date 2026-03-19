/* #(@)TaskCard.tsx - Task card component for job tracking app
 * 
 * This component represents a single task related to a job application, such
 * as a follow-up action or interview preparation. It displays the next action,
 * due date, and priority level, and provides controls for marking the task as
 * complete, snoozing it, or quickly updating the next action and due date. The
 * card also visually indicates if the task is overdue based on today's date.
 */
import { useState } from 'react'
import type { Job, JobPriority } from '../../domain'

/**
 * TaskCard component represents a single task with its details and controls
 * for updating its status, priority, and next action. It allows users to
 * quickly complete, snooze, or update the task's next action and due date
 * directly from the card interface.
 * 
 * Props:
 * - job: The job object containing all relevant information about the task.
 * - today: A string representing today's date in 'YYYY-MM-DD' format for overdue calculation.
 * - onComplete: Callback function to mark the task as complete.
 * - onSnooze: Callback function to snooze the task's due date by a specified number of days.
 * - onPriorityChange: Callback function to update the task's priority level.
 * - onQuickAddAction: Callback function to quickly update the task's next action and due date.
 * - onOpenJob: Callback function to open the full job details view.
 */
interface TaskCardProps {
  job: Job
  today: string
  onComplete: (jobId: string) => void
  onSnooze: (jobId: string, days: number) => void
  onPriorityChange: (jobId: string, priority: JobPriority) => void
  onQuickAddAction: (jobId: string, action: string, dueDate: string) => void
  onOpenJob: (job: Job) => void
}

/**
 * TaskCard component represents a single task with its details and controls
 * for updating its status, priority, and next action. It allows users to
 * quickly complete, snooze, or update the task's next action and due date
 * directly from the card interface.
 *
 * @param param0 - The props for the TaskCard component.
 * @returns A JSX element representing the task card.
 */
export function TaskCard({
  job,
  today,
  onComplete,
  onSnooze,
  onPriorityChange,
  onQuickAddAction,
  onOpenJob,
}: TaskCardProps) {
  const [newAction, setNewAction] = useState(job.nextAction)
  const [newDueDate, setNewDueDate] = useState(job.nextActionDueDate)
  const priority = job.priority ?? 'Medium'
  const isOverdue = Boolean(job.nextActionDueDate && job.nextActionDueDate < today)

  return (
    <article className={`task-card priority-${priority.toLowerCase()} ${isOverdue ? 'is-overdue' : ''}`}>
      <header className="task-card-header">
        <button type="button" className="task-open-link" onClick={() => onOpenJob(job)}>
          {job.company} - {job.roleTitle}
        </button>
        <span className={`task-priority priority-${priority.toLowerCase()}`}>{priority}</span>
      </header>

      <p className="task-meta">
        Due: {job.nextActionDueDate || 'Not set'} {isOverdue ? '(Overdue)' : ''}
      </p>
      <p className="task-action-text">{job.nextAction || 'No action set'}</p>

      <div className="task-controls-row">
        <label>
          Priority
          <select
            value={priority}
            onChange={(event) => onPriorityChange(job.id, event.target.value as JobPriority)}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
      </div>

      <div className="task-controls-row">
        <button type="button" className="small" onClick={() => onComplete(job.id)}>
          Complete
        </button>
        <button type="button" className="small ghost" onClick={() => onSnooze(job.id, 1)}>
          Snooze 1d
        </button>
        <button type="button" className="small ghost" onClick={() => onSnooze(job.id, 3)}>
          Snooze 3d
        </button>
        <button type="button" className="small ghost" onClick={() => onSnooze(job.id, 7)}>
          Snooze 7d
        </button>
      </div>

      <div className="task-quick-add">
        <input
          value={newAction}
          onChange={(event) => setNewAction(event.target.value)}
          placeholder="Quick update action"
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(event) => setNewDueDate(event.target.value)}
          aria-label="Quick action due date"
        />
        <button
          type="button"
          className="small ghost"
          onClick={() => onQuickAddAction(job.id, newAction.trim(), newDueDate)}
          disabled={!newAction.trim() || !newDueDate}
        >
          Save Task
        </button>
      </div>
    </article>
  )
}
