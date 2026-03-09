import { createContext, useContext, type ReactNode, type RefObject } from 'react'
import type { Job, JobStatus } from '../../domain'
import type { SortColumn, SortDirection } from '../../hooks/useJobFiltering'

export interface TableViewContextValue {
  paginatedJobs: Job[]
  sortedJobs: Job[]
  selectedIds: Set<string>
  selectedVisibleCount: number
  allVisibleSelected: boolean
  sortColumn: SortColumn
  sortDirection: SortDirection
  currentPage: number
  totalPages: number
  pageSize: number
  searchQuery: string
  selectAllCheckboxRef: RefObject<HTMLInputElement | null>
  onSort: (column: SortColumn) => void
  onToggleSelection: (id: string) => void
  onToggleSelectAll: () => void
  onBulkDelete: () => void
  onCompare: () => void
  onQuickMove: (id: string, status: JobStatus) => void
  onEdit: (job: Job) => void
  onRemove: (id: string) => void
  onView: (job: Job) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const TableViewContext = createContext<TableViewContextValue | null>(null)

export function TableViewProvider({
  value,
  children,
}: {
  value: TableViewContextValue
  children: ReactNode
}) {
  return <TableViewContext.Provider value={value}>{children}</TableViewContext.Provider>
}

export function useTableViewContext(): TableViewContextValue {
  const context = useContext(TableViewContext)
  if (!context) {
    throw new Error('useTableViewContext must be used within TableViewProvider')
  }

  return context
}
