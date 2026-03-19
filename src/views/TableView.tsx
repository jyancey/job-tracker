// Main paginated table view of all jobs with filters, sorting, bulk selection, and row actions.
import { getTodayString } from '../utils/dateUtils'
import { Pagination } from '../components/Pagination'
import { useTableViewContext } from './table/TableViewContext'
import { TableBulkActions } from './table/TableBulkActions'
import { TableHeader } from './table/TableHeader'
import { TableBody } from './table/TableBody'

export function TableView() {
  const {
    paginatedJobs,
    sortedJobs,
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
  } = useTableViewContext()
  const today = getTodayString()

  return (
    <div className="table-wrap">
      <TableBulkActions />
      <table>
        <TableHeader />
        <TableBody today={today} />
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
