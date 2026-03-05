import { type Job, type JobStatus } from './domain'
import { StatusSelect } from './components/StatusSelect'
import { createButtonKbdProps, stopPropagation } from './utils/a11yUtils'

interface KanbanCardProps {
  job: Job
  onStatusChange: (jobId: string, newStatus: JobStatus) => void
  onEdit: (job: Job) => void
  onDelete: (jobId: string) => void
  onView?: (job: Job) => void
}

export function KanbanCard({ job, onStatusChange, onEdit, onDelete, onView }: KanbanCardProps) {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify(job))
  }

  const handleDragEnd = (event: React.DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove('dragging')
  }

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      {...createButtonKbdProps(() => onView?.(job))}
    >
      <strong>{job.company}</strong>
      <p>{job.roleTitle}</p>
      <StatusSelect
        value={job.status}
        onChange={(value) => onStatusChange(job.id, value as JobStatus)}
        placeholder="Move to..."
        onClick={stopPropagation}
      />
      <div className="kanban-actions">
        <button type="button" className="small" onClick={() => onEdit(job)}>
          Edit
        </button>
        <button type="button" className="small ghost" onClick={() => onDelete(job.id)}>
          Delete
        </button>
      </div>
    </div>
  )
}
