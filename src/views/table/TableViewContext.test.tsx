import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TableViewProvider, useTableViewContext, type TableViewContextValue } from './TableViewContext'

const mockContextValue: TableViewContextValue = {
  paginatedJobs: [],
  sortedJobs: [],
  selectedIds: new Set(),
  selectedVisibleCount: 0,
  allVisibleSelected: false,
  sortColumn: 'applicationDate',
  sortDirection: 'desc',
  currentPage: 1,
  totalPages: 1,
  pageSize: 10,
  searchQuery: '',
  selectAllCheckboxRef: { current: null },
  onSort: vi.fn(),
  onToggleSelection: vi.fn(),
  onToggleSelectAll: vi.fn(),
  onBulkDelete: vi.fn(),
  onCompare: vi.fn(),
  onQuickMove: vi.fn(),
  onEdit: vi.fn(),
  onRemove: vi.fn(),
  onView: vi.fn(),
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
}

function Consumer() {
  const ctx = useTableViewContext()
  return <div>Page {ctx.currentPage}</div>
}

describe('TableViewContext', () => {
  it('provides context values to descendants', () => {
    render(
      <TableViewProvider value={mockContextValue}>
        <Consumer />
      </TableViewProvider>,
    )

    expect(screen.getByText('Page 1')).toBeInTheDocument()
  })

  it('throws when hook is used outside provider', () => {
    expect(() => render(<Consumer />)).toThrow('useTableViewContext must be used within TableViewProvider')
  })
})
