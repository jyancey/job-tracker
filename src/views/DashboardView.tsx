// Simple grid dashboard displaying job counts grouped by status.
import { JOB_STATUSES, type Job, type JobStatus } from '../domain'

interface DashboardViewProps {
  byStatus: Map<JobStatus, Job[]>
}

export function DashboardView({ byStatus }: DashboardViewProps) {
  return (
    <div className="dashboard-grid">
      {JOB_STATUSES.map((status) => (
        <article key={status}>
          <h3>{status}</h3>
          <strong>{byStatus.get(status)?.length ?? 0}</strong>
        </article>
      ))}
    </div>
  )
}
