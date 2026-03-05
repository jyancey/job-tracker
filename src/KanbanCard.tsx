import { type Job, type JobStatus } from './domain'

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
      onClick={() => onView?.(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onView?.(job)
        }
      }}
      title="Click to view details"
    >
      <strong>{job.company}</strong>
      <p>{job.roleTitle}</p>
      <select
        value={job.status}
        onChange={(event) => onStatusChange(job.id, event.target.value as JobStatus)}
        onClick={(e) => e.stopPropagation()}
      >
        <option disabled>Move to...</option>
        <option value="Wishlist">Wishlist</option>
        <option value="Applied">Applied</option>
        <option value="Phone Screen">Phone Screen</option>
        <option value="Interview">Interview</option>
        <option value="Offer">Offer</option>
        <option value="Rejected">Rejected</option>
        <option value="Withdrawn">Withdrawn</option>
      </select>
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
