import type { Job, JobStatus } from '../domain'
import type { StatusFilter, SortColumn, SortDirection } from './filters'

/**
 * Component prop interfaces - centralized for consistency and reusability
 */

export interface FilterToolbarProps {
  statusFilter: StatusFilter
  showAdvancedFilters: boolean
  query: string
  dateRangeStart: string
  dateRangeEnd: string
  salaryRangeMin: string
  salaryRangeMax: string
  contactPersonFilter: string
  onStatusFilterChange: (filter: StatusFilter) => void
  onToggleAdvancedFilters: () => void
  onQueryChange: (query: string) => void
  onDateRangeStartChange: (date: string) => void
  onDateRangeEndChange: (date: string) => void
  onSalaryRangeMinChange: (min: string) => void
  onSalaryRangeMaxChange: (max: string) => void
  onContactPersonFilterChange: (contact: string) => void
  onClearAdvancedFilters: () => void
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
