import type { Job } from '../../domain'
import { ScoreCell } from '../../components/ScoreCell'
import { StatusCell } from '../../components/StatusCell'
import { formatDate, isOverdueFollowUp } from '../../utils/dateUtils'
import { useTableViewContext } from './TableViewContext'

interface TableRowProps {
  job: Job
  today: string
}

export function TableRow({ job, today }: TableRowProps) {
  const { selectedIds, onToggleSelection, onQuickMove, onEdit, onRemove, onView } = useTableViewContext()

  return (
    <tr key={job.id} className={isOverdueFollowUp(job, today) ? 'row-overdue' : ''} onClick={() => onView(job)}>
      <td>
        <input
          type="checkbox"
          checked={selectedIds.has(job.id)}
          onClick={(event) => event.stopPropagation()}
          onChange={() => onToggleSelection(job.id)}
        />
      </td>
      <td>{job.company}</td>
      <td>{job.roleTitle}</td>
      <StatusCell value={job.status} onChange={onQuickMove} jobId={job.id} className="quick-status" />
      <td style={{ textAlign: 'center' }}>
        <ScoreCell job={job} />
      </td>
      <td>{formatDate(job.applicationDate)}</td>
      <td>
        {job.nextAction || '-'}
        {job.nextActionDueDate ? ` (${formatDate(job.nextActionDueDate)})` : ''}
        {isOverdueFollowUp(job, today) && <span className="overdue-flag">Overdue</span>}
      </td>
      <td className="action-row">
        <button
          type="button"
          className="ghost"
          onClick={(event) => {
            event.stopPropagation()
            onView(job)
          }}
        >
          View
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit(job)
          }}
        >
          Edit
        </button>
        <button
          type="button"
          className="ghost"
          onClick={(event) => {
            event.stopPropagation()
            onRemove(job.id)
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  )
}
