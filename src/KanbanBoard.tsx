import { JOB_STATUSES, type Job, type JobStatus } from './domain'
import { KanbanColumn } from './KanbanColumn'

interface KanbanBoardProps {
  jobs: Map<JobStatus, Job[]>
  onStatusChange: (jobId: string, newStatus: JobStatus) => void
  onEdit: (job: Job) => void
  onDelete: (jobId: string) => void
}

export function KanbanBoard({ jobs, onStatusChange, onEdit, onDelete }: KanbanBoardProps) {
  return (
    <div className="kanban-grid">
      {JOB_STATUSES.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          jobs={jobs.get(status) ?? []}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
