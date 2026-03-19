// Table cell wrapper around StatusSelect that prevents event propagation for inline status changes.
import type { JobStatus } from '../domain'
import { StatusSelect } from './StatusSelect'
import { stopPropagation } from '../utils/a11yUtils'

interface StatusCellProps {
  value: JobStatus
  onChange: (jobId: string, status: JobStatus) => void
  jobId: string
  className?: string
}

/**
 * Table cell component for displaying and editing job status
 * Prevents event propagation to allow row selection while changing status
 */
export function StatusCell({ value, onChange, jobId, className }: StatusCellProps) {
  return (
    <td>
      <StatusSelect
        className={className}
        value={value}
        onChange={(newStatus) => onChange(jobId, newStatus as JobStatus)}
        placeholder={false}
        onClick={stopPropagation}
      />
    </td>
  )
}
