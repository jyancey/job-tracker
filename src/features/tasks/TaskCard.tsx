import { useState } from 'react'
import type { Job, JobPriority } from '../../domain'

interface TaskCardProps {
  job: Job
  today: string
  onComplete: (jobId: string) => void
  onSnooze: (jobId: string, days: number) => void
  onPriorityChange: (jobId: string, priority: JobPriority) => void
  onQuickAddAction: (jobId: string, action: string, dueDate: string) => void
  onOpenJob: (job: Job) => void
}

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
