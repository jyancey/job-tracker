import { useState } from 'react'
import { type Job, type JobStatus } from './domain'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  status: JobStatus
  jobs: Job[]
  onStatusChange: (jobId: string, newStatus: JobStatus) => void
  onEdit: (job: Job) => void
  onDelete: (jobId: string) => void
}

export function KanbanColumn({
  status,
  jobs,
  onStatusChange,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    // Only set to false if we're leaving the column itself, not a child
    if (event.currentTarget === event.target) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    try {
      const data = event.dataTransfer.getData('application/json')
      const job = JSON.parse(data) as Job

      if (job.status !== status) {
        onStatusChange(job.id, status)
      }
    } catch (error) {
      console.error('Failed to parse dropped data:', error)
    }
  }

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
        />
      ))}
      {!jobs.length && <p className="empty">No items</p>}
    </article>
  )
}
