import { formatDate, isOverdueFollowUp, getTodayString } from '../utils/dateUtils'
import { Pagination } from '../components/Pagination'
import { SortableHeader } from '../components/SortableHeader'
import { StatusCell } from '../components/StatusCell'
import { useTableViewContext } from './table/TableViewContext'

export function TableView() {
  const {
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
  } = useTableViewContext()
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
            <SortableHeader
              label="Company"
              column="company"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="Role"
              column="roleTitle"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="Status"
              column="status"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="Applied"
              column="applicationDate"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHeader
              label="Next Action"
              column="nextActionDueDate"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
            />
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
              <StatusCell
                value={job.status}
                onChange={onQuickMove}
                jobId={job.id}
                className="quick-status"
              />
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={sortedJobs.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        hideWhenEmpty={false}
      />
      {!paginatedJobs.length && sortedJobs.length === 0 && (
        <p className="empty">No jobs match current filters.</p>
      )}
    </div>
  )
}
