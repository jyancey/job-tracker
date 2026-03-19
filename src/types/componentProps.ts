// Centralized prop interface definitions for all major view and component types.
import type { Job, JobStatus } from '../domain'
import type { SortColumn, SortDirection } from './filters'
import type { FilterAction, FilterState } from '../components/FilterToolbar'

/**
 * Component prop interfaces - centralized for consistency and reusability
 */

export interface FilterToolbarProps {
  state: FilterState
  onDispatch: (action: FilterAction) => void
  onToggleAdvanced: () => void
  onClearAdvanced: () => void
}

export interface TableViewProps {
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

export interface JobModalProps {
  job: Job | null
  onClose: () => void
  onEdit: (job: Job) => void
  onRemove: (job: Job) => void
}

export interface JobFormProps {
  draft: Job
  editingId: string | null
  onUpdateDraft: (updates: Partial<Job>) => void
  onSubmit: () => void
  onCancel: () => void
}
