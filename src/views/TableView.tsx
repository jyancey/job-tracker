import type { Job, JobStatus } from '../domain'
import { formatDate, isOverdueFollowUp, getTodayString } from '../utils/dateUtils'
import type { SortColumn, SortDirection } from '../hooks/useJobFiltering'
import { StatusSelect } from '../components/StatusSelect'
import { stopPropagation } from '../utils/a11yUtils'

interface TableViewProps {
  paginatedJobs: Job[]
  sortedJobs: Job[]
  selectedIds: Set<string>
  selectedVisibleCount: number
  allVisibleSelected: boolean
  someVisibleSelected: boolean
  sortColumn: SortColumn
  sortDirection: SortDirection
  currentPage: number
  totalPages: number
  pageSize: number
  onSort: (column: SortColumn) => void
  onToggleSelection: (id: string) => void
  onToggleSelectAll: () => void
  onBulkDelete: () => void
  onQuickMove: (id: string, status: JobStatus) => void
  onEdit: (job: Job) => void
  onRemove: (id: string) => void
  onView: (job: Job) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  selectAllCheckboxRef: React.RefObject<HTMLInputElement | null>
}

export function TableView({
  paginatedJobs,
  sortedJobs,
  selectedIds,
  selectedVisibleCount,
  allVisibleSelected,
  sortColumn,
  sortDirection,
  currentPage,
  totalPages,
  pageSize,
  onSort,
  onToggleSelection,
  onToggleSelectAll,
  onBulkDelete,
  onQuickMove,
  onEdit,
  onRemove,
  onView,
  onPageChange,
  onPageSizeChange,
  selectAllCheckboxRef,
}: TableViewProps) {
  function sortMarker(column: SortColumn): string {
    if (column !== sortColumn) {
      return ''
    }
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const today = getTodayString()

  return (
    <div className="table-wrap">
      {selectedIds.size > 0 && (
        <div className="bulk-actions">
          <span>
            {selectedVisibleCount} selected on page
            {selectedIds.size > selectedVisibleCount
              ? ` (${selectedIds.size - selectedVisibleCount} selected on other pages/filters)`
              : ''}
          </span>
          <button
            type="button"
            className="danger"
            onClick={onBulkDelete}
            disabled={selectedVisibleCount === 0}
          >
            Delete Selected on Page
          </button>
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input
                ref={selectAllCheckboxRef}
                type="checkbox"
                checked={allVisibleSelected}
                onChange={onToggleSelectAll}
                aria-label="Select all visible jobs"
              />
            </th>
            <th className="sortable-header">
              <button type="button" onClick={() => onSort('company')}>
                Company {sortMarker('company')}
              </button>
            </th>
            <th className="sortable-header">
              <button type="button" onClick={() => onSort('roleTitle')}>
                Role {sortMarker('roleTitle')}
              </button>
            </th>
            <th className="sortable-header">
              <button type="button" onClick={() => onSort('status')}>
                Status {sortMarker('status')}
              </button>
            </th>
            <th className="sortable-header">
              <button type="button" onClick={() => onSort('applicationDate')}>
                Applied {sortMarker('applicationDate')}
              </button>
            </th>
            <th className="sortable-header">
              <button type="button" onClick={() => onSort('nextActionDueDate')}>
                Next Action {sortMarker('nextActionDueDate')}
              </button>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedJobs.map((job) => (
            <tr
              key={job.id}
              className={isOverdueFollowUp(job, today) ? 'row-overdue' : ''}
              onClick={() => onView(job)}
            >
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
              <td>
                <StatusSelect
                  className="quick-status"
                  value={job.status}
                  onChange={(value) => onQuickMove(job.id, value as JobStatus)}
                  placeholder={false}
                  onClick={stopPropagation}
                />
              </td>
              <td>{formatDate(job.applicationDate)}</td>
              <td>
                {job.nextAction || '-'}
                {job.nextActionDueDate ? ` (${formatDate(job.nextActionDueDate)})` : ''}
                {isOverdueFollowUp(job, today) && (
                  <span className="overdue-flag">Overdue</span>
                )}
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
          ))}
        </tbody>
      </table>
      {sortedJobs.length > 0 && (
        <div className="pagination">
          <span>
            Page {currentPage} of {totalPages} ({sortedJobs.length} results)
          </span>
          <div className="pagination-actions">
            <button
              type="button"
              className="small ghost"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="small ghost"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <label className="page-size-control">
              Rows
              <select
                value={pageSize}
                onChange={(event) => {
                  onPageSizeChange(Number(event.target.value))
                  onPageChange(1)
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>
          </div>
        </div>
      )}
      {!paginatedJobs.length && sortedJobs.length === 0 && (
        <p className="empty">No jobs match current filters.</p>
      )}
    </div>
  )
}
