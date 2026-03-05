import { JOB_STATUSES, type JobStatus } from '../domain'

interface StatusSelectProps {
  value: JobStatus | string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string | false
  showAllStatus?: boolean
  showOverdueFilter?: boolean
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

/**
 * Reusable status select component supporting multiple use cases:
 * - Job status selection (KanbanCard, JobForm, TableView)
 * - Status filtering (FilterToolbar with "All statuses" and "Overdue Follow-ups")
 */
export function StatusSelect({
  value,
  onChange,
  disabled = false,
  placeholder,
  showAllStatus = false,
  showOverdueFilter = false,
  className,
  onClick,
}: StatusSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
      onClick={onClick}
    >
      {placeholder !== false && (
        <option disabled value="">
          {placeholder || 'Select status'}
        </option>
      )}
      {showAllStatus && <option value="All">All statuses</option>}
      {showOverdueFilter && <option value="Overdue Follow-ups">Overdue Follow-ups</option>}
      {JOB_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  )
}
