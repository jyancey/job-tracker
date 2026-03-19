// Kanban column that renders jobs grouped by status with drag-drop zone support for status changes.
import { type Job, type JobStatus } from '../domain'
import { KanbanCard } from './KanbanCard'
import { useDragDropZone } from '../hooks/useDragDropZone'

interface KanbanColumnProps {
  status: JobStatus
  jobs: Job[]
  onStatusChange: (jobId: string, newStatus: JobStatus) => void
  onEdit: (job: Job) => void
  onDelete: (jobId: string) => void
  onView?: (job: Job) => void
}

export function KanbanColumn({
  status,
  jobs,
  onStatusChange,
  onEdit,
  onDelete,
  onView,
}: KanbanColumnProps) {
  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useDragDropZone(
    status,
    onStatusChange
  )

  return (
    <article
      className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header>
        <h3>{status}</h3>
        <span>{jobs.length}</span>
      </header>
      {jobs.map((job) => (
        <KanbanCard
          key={job.id}
          job={job}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
      {!jobs.length && <p className="empty">No items</p>}
    </article>
  )
}
