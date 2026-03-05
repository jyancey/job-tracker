/**
 * Reusable pagination component for tabular data
 * Handles page navigation, page size selection, and display of pagination info
 */

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalResults: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
  hideWhenEmpty?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  hideWhenEmpty = true,
}: PaginationProps) {
  // Hide pagination when no results or single page
  if (hideWhenEmpty && totalResults === 0) {
    return null
  }

  return (
    <div className="pagination">
      <span>
        Page {currentPage} of {totalPages} ({totalResults} results)
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
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
