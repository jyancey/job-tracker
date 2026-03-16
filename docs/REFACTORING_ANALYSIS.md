# Job Tracker - Comprehensive Refactoring Analysis
**Date:** March 5, 2026  
**Scope:** Complete codebase review for refactoring opportunities

---

## Executive Summary

The job-tracker codebase has undergone significant refactoring through Phases 1-4, achieving strong separation of concerns with custom hooks and component extraction. This analysis identifies **31 specific refactoring opportunities** across 8 categories, prioritized by impact.

**Quick Stats:**
- Total LOC: ~3,242 (excluding tests)
- Largest files: App.tsx (475), exportImport.ts (239), TableView.tsx (208), storage.ts (195)
- Test files: 8 (domain, storage, exportImport, jobService, 3 utils, App)
- Components without tests: 10
- Hooks without tests: 11

---

## 1. REMAINING COMPONENT COMPLEXITY

### 1.1 App.tsx - Still Very Large (475 lines) ⚠️ HIGH IMPACT
**Location:** [src/App.tsx](src/App.tsx)  
**Current State:** 475 lines, orchestrates entire application  
**Issues:**
- Mixed responsibilities: state management, business logic, event handlers, rendering
- 11 useState/useRef calls (8 useState + 3 useRef)
- 5 useEffect hooks with complex logic
- 30+ handler functions defined inline
- Import/export logic embedded directly in component
- Storage hydration/persistence logic in component

**Proposed Refactoring:**

**A. Extract useAppState hook (HIGH)**
```typescript
// New: src/hooks/useAppState.ts
export function useAppState() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isStorageHydrated, setIsStorageHydrated] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending'>('idle')
  
  // Hydration logic
  useEffect(() => { /* storage hydration */ }, [])
  
  // Auto-save logic
  useEffect(() => { /* persist jobs */ }, [jobs, isStorageHydrated])
  
  return { jobs, setJobs, isStorageHydrated, saveStatus }
}
```

**B. Extract useSortAndPagination hook (MEDIUM)**
```typescript
// New: src/hooks/useSortAndPagination.ts
export function useSortAndPagination(totalPages: number) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('applicationDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const handleSort = useCallback((column: SortColumn) => { /* ... */ }, [sortColumn])
  
  // Auto-reset page when totalPages changes
  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages))
  }, [totalPages])
  
  return { sortColumn, sortDirection, currentPage, pageSize, 
           setSortColumn, setSortDirection, setCurrentPage, setPageSize, handleSort }
}
```

**C. Extract useImportExport hook (MEDIUM)**
```typescript
// Enhance existing: src/hooks/useImportExportState.ts
export function useImportExport(
  jobs: Job[], 
  setJobs: (updater: (jobs: Job[]) => Job[]) => void,
  undo: { pushState: (jobs: Job[]) => void },
  selection: { clear: () => void },
  setCurrentPage: (page: number) => void,
  addNotification: (msg: string, type: NotificationType) => void
) {
  const [importMode, setImportMode] = useState<ImportMode>('append')
  const importFileRef = useRef<HTMLInputElement>(null)
  
  const handleImportClick = useCallback(() => { /* ... */ }, [])
  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => { 
    /* full import logic from App.tsx */
  }, [jobs, importMode, undo, selection, setCurrentPage, addNotification])
  
  const handleExport = useCallback((format: 'json' | 'csv') => {
    /* full export logic from App.tsx */
  }, [jobs, addNotification])
  
  return { importMode, setImportMode, importFileRef, handleImportClick, handleImportFile, handleExport }
}
```

**D. Extract useJobOperations hook (HIGH)**
```typescript
// New: src/hooks/useJobOperations.ts
export function useJobOperations(
  jobs: Job[],
  setJobs: (updater: (jobs: Job[]) => Job[]) => void,
  editingId: string | null,
  resetForm: () => void,
  viewingJob: Job | null,
  closeViewOnly: () => void
) {
  const handleEditJob = useCallback((job: Job) => {
    // Existing logic
  }, [startEdit])
  
  const handleRemoveJob = useCallback((id: string) => {
    setJobs((current) => jobService.deleteJob(current, id))
    if (editingId === id) resetForm()
    if (viewingJob?.id === id) closeViewOnly()
  }, [setJobs, editingId, resetForm, viewingJob, closeViewOnly])
  
  const handleQuickMove = useCallback((id: string, nextStatus: JobStatus) => {
    setJobs((current) => jobService.updateJobStatus(current, id, nextStatus))
  }, [setJobs])
  
  return { handleEditJob, handleRemoveJob, handleQuickMove }
}
```

**Impact:** Would reduce App.tsx from 475 → ~250 lines, improve testability, clearer separation of concerns  
**Dependencies:** None  
**Estimated Effort:** 6-8 hours

---

### 1.2 exportImport.ts - Large Utility Module (239 lines) ⚠️ MEDIUM IMPACT
**Location:** [src/exportImport.ts](src/exportImport.ts)  
**Current State:** 239 lines, mixed responsibilities  
**Issues:**
- CSV parsing, JSON parsing, export formatting, merging logic all in one file
- Large parseCsv function (40+ lines) with complex state machine
- Export and import logic not symmetrically organized

**Proposed Refactoring:**

Split into focused modules:
```
src/services/
  ├── csvParser.ts       (parseCsv, exportToCsv, importFromCsv)
  ├── jsonExport.ts      (exportToJson, importFromJson)
  └── jobMerger.ts       (mergeImportedJobs, ImportMode type)
```

**Impact:** Easier testing, clearer module boundaries, reusable CSV parser  
**Dependencies:** None  
**Estimated Effort:** 3-4 hours

---

### 1.3 storage.ts - Large Storage Module (195 lines) ⚠️ MEDIUM IMPACT
**Location:** [src/storage.ts](src/storage.ts)  
**Current State:** 195 lines, mixed concerns  
**Issues:**
- Logging, storage, API communication all mixed
- Debug flag management embedded
- Fallback localStorage logic intertwined with API logic

**Proposed Refactoring:**

Split into:
```
src/services/
  ├── storageLogger.ts    (logging functions, log management)
  ├── jobsApi.ts          (API communication, already exists as separate file!)
  └── fallbackStorage.ts  (localStorage fallback logic)

src/storage.ts            (orchestrates the above, main interface)
```

**Note:** `jobsApi.ts` already exists! Opportunity to migrate to TypeScript and integrate properly.

**Impact:** Better testability, clearer separation  
**Dependencies:** None  
**Estimated Effort:** 4-5 hours

---

### 1.4 TableView.tsx - 22 Props Prop Drilling (208 lines) ⚠️ HIGH IMPACT
**Location:** [src/views/TableView.tsx](src/views/TableView.tsx)  
**Current State:** 208 lines, 22 props  
**Issues:**
- Prop drilling: receives too much state and callbacks from App
- No internal logic extraction
- Mixed rendering and interaction handling

**Proposed Refactoring:**

**Option A: Use compound components pattern**
```typescript
export function TableView({ children }: { children: React.ReactNode }) {
  return <div className="table-wrap">{children}</div>
}

TableView.BulkActions = function BulkActions({ 
  selectedIds, selectedVisibleCount, onBulkDelete 
}: BulkActionsProps) { /* ... */ }

TableView.Table = function Table({ 
  paginatedJobs, onView, onEdit, onRemove, /* ... */ 
}: TableProps) { /* ... */ }

TableView.Pagination = Pagination // Re-export

// Usage in App.tsx:
<TableView>
  <TableView.BulkActions {...bulkProps} />
  <TableView.Table {...tableProps} />
  <TableView.Pagination {...paginationProps} />
</TableView>
```

**Option B: Use Context for shared state (RECOMMENDED)**
```typescript
// New: src/contexts/TableContext.tsx
const TableContext = createContext<TableContextValue | null>(null)

export function TableProvider({ 
  children, 
  jobs, 
  selection, 
  onEdit, 
  onRemove, 
  onView 
}: TableProviderProps) {
  return (
    <TableContext.Provider value={{ jobs, selection, onEdit, onRemove, onView }}>
      {children}
    </TableContext.Provider>
  )
}

export function useTableContext() {
  const context = useContext(TableContext)
  if (!context) throw new Error('useTableContext must be used within TableProvider')
  return context
}

// Refactored TableView would only need:
// - sortColumn, sortDirection, onSort
// - currentPage, totalPages, pageSize, onPageChange, onPageSizeChange
// - selectAllCheckboxRef (local concern)
```

**Impact:** Reduces props from 22 → ~10, improves maintainability  
**Dependencies:** None  
**Estimated Effort:** 5-6 hours  

---

### 1.5 CalendarView.tsx - State Management in View (135 lines) ⚠️ MEDIUM IMPACT
**Location:** [src/views/CalendarView.tsx](src/views/CalendarView.tsx)  
**Current State:** 135 lines, manages its own calendar state  
**Issues:**
- Calendar navigation state (currentMonth) managed in view component
- Calendar data transformation logic in component
- No hook extraction for calendar logic

**Proposed Refactoring:**

```typescript
// New: src/hooks/useCalendarNavigation.ts
export function useCalendarNavigation(initialDate: Date) {
  const [currentMonth, setCurrentMonth] = useState(initialDate)
  
  const goToPrevious = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }, [])
  
  const goToNext = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }, [])
  
  return { currentMonth, goToPrevious, goToNext }
}

// New: src/hooks/useCalendarData.ts
export function useCalendarData(dueByDate: [string, Job[]][], currentMonth: Date) {
  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>()
    for (const [date, jobs] of dueByDate) {
      map.set(date, jobs)
    }
    return map
  }, [dueByDate])
  
  const calendarDays = useMemo(() => 
    generateCalendarGrid(currentMonth), 
    [currentMonth]
  )
  
  return { jobsByDate, calendarDays }
}

// CalendarView.tsx becomes much simpler
```

**Impact:** Better testability, reusable calendar logic  
**Dependencies:** None  
**Estimated Effort:** 2-3 hours

---

## 2. HOOK OPPORTUNITIES

### 2.1 Extract useSelectionState from App.tsx ⚠️ MEDIUM IMPACT
**Location:** [src/App.tsx](src/App.tsx) lines 155-174  
**Current State:** Selection-related computed state and effects in App  
**Issues:**
- `visibleTableIds`, `selectedVisibleIds`, `selectedVisibleCount` computed in App
- `allVisibleSelected`, `someVisibleSelected` computed in App
- Effect for checkbox indeterminate state in App
- Effect for page reset on filter change in App

**Proposed Refactoring:**

```typescript
// New: src/hooks/useSelectionState.ts
export function useSelectionState(
  paginatedJobs: Job[],
  selectedIds: Set<string>,
  selectAllCheckboxRef: React.RefObject<HTMLInputElement>,
  filters: FilterState
) {
  const visibleTableIds = useMemo(() => 
    paginatedJobs.map((job) => job.id), 
    [paginatedJobs]
  )
  
  const selectedVisibleIds = useMemo(() => 
    visibleTableIds.filter((id) => selectedIds.has(id)), 
    [visibleTableIds, selectedIds]
  )
  
  const selectedVisibleCount = selectedVisibleIds.length
  const allVisibleSelected = visibleTableIds.length > 0 && 
                             selectedVisibleCount === visibleTableIds.length
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected
  
  // Handle checkbox indeterminate state
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someVisibleSelected
    }
  }, [someVisibleSelected, selectAllCheckboxRef])
  
  return {
    visibleTableIds,
    selectedVisibleIds,
    selectedVisibleCount,
    allVisibleSelected,
    someVisibleSelected
  }
}
```

**Impact:** Removes 20 lines from App.tsx, better organization  
**Dependencies:** None  
**Estimated Effort:** 1-2 hours

---

### 2.2 Extract usePageReset Hook ⚠️ LOW IMPACT
**Location:** [src/App.tsx](src/App.tsx) line 173  
**Current State:** useEffect with 7 dependencies for page reset  
**Proposed:**

```typescript
// New: src/hooks/usePageReset.ts
export function usePageReset(
  setCurrentPage: (page: number) => void,
  dependencies: unknown[]
) {
  useEffect(() => {
    setCurrentPage(1)
  }, dependencies)
}

// Usage:
usePageReset(setCurrentPage, [
  filters.state.query,
  filters.state.statusFilter,
  filters.state.dateRangeStart,
  filters.state.dateRangeEnd,
  filters.state.salaryRangeMin,
  filters.state.salaryRangeMax,
  filters.state.contactPersonFilter
])
```

**Impact:** Cleaner App.tsx, explicit intent  
**Dependencies:** None  
**Estimated Effort:** 30 minutes

---

### 2.3 Enhance useImportExportState (Currently Incomplete) ⚠️ MEDIUM IMPACT
**Location:** [src/hooks/useImportExportState.ts](src/hooks/useImportExportState.ts)  
**Current State:** 36 lines, incomplete implementation  
**Issues:**
- Returns null for file ref (not actually usable)
- Doesn't handle import/export operations
- Only manages importMode state

**See Section 1.1.C above for complete implementation**

**Impact:** Actually usable import/export state management  
**Dependencies:** App.tsx refactoring  
**Estimated Effort:** 2-3 hours (part of App.tsx refactoring)

---

## 3. TYPE SAFETY & TYPE DEFINITIONS

### 3.1 Missing Type Exports in componentProps.ts ⚠️ LOW IMPACT
**Location:** [src/types/componentProps.ts](src/types/componentProps.ts)  
**Issues:**
- TableViewProps defined in componentProps.ts but also locally in TableView.tsx  
- JobModalProps mismatch: componentProps has onEdit/onRemove, actual component doesn't
- Duplication between centralized types and component-local types

**Proposed:**
1. Make componentProps.ts the single source of truth
2. Export and import from there in all components
3. Update JobModalProps to match actual usage
4. Add missing prop interfaces: KanbanBoardProps, KanbanColumnProps, KanbanCardProps

**Impact:** Consistency, single source of truth  
**Dependencies:** None  
**Estimated Effort:** 1 hour

---

### 3.2 Implicit 'unknown' Types in storage.ts ⚠️ LOW IMPACT
**Location:** [src/storage.ts](src/storage.ts)  
**Current State:** Uses `unknown` appropriately for error handling and parsing  
**Note:** This is actually GOOD practice! The use of `unknown` for error types and JSON parsing is type-safe.

**No action needed** - false positive in analysis criteria.

---

### 3.3 Type Safety for FilterAction Could Use Validation ⚠️ LOW IMPACT
**Location:** [src/components/FilterToolbar.tsx](src/components/FilterToolbar.tsx)  
**Current State:**
```typescript
export type FilterAction =
  | { type: 'query'; value: string }
  | { type: 'status'; value: StatusFilter }
  | { type: 'dateStart'; value: string }
  // etc.
```

**Opportunity:** Add runtime validation helpers
```typescript
// New: src/types/validation.ts
export function isValidFilterAction(action: unknown): action is FilterAction {
  if (!action || typeof action !== 'object') return false
  const a = action as { type: string; value: unknown }
  return ['query', 'status', 'dateStart', 'dateEnd', 'salaryMin', 'salaryMax', 'contact']
    .includes(a.type)
}
```

**Impact:** Runtime safety for external data  
**Dependencies:** None  
**Estimated Effort:** 1 hour

---

### 3.4 Opportunity for Branded Types ⚠️ LOW IMPACT
**Location:** [src/domain.ts](src/domain.ts)  
**Opportunity:** Use branded types for IDs to prevent mixing different ID types

```typescript
// Enhanced domain.ts
export type JobId = string & { readonly __brand: 'JobId' }

export function createJobId(id: string): JobId {
  return id as JobId
}

export interface Job {
  id: JobId  // Instead of string
  // ... rest
}
```

**Impact:** Prevents accidentally passing wrong ID types  
**Dependencies:** Widespread changes  
**Estimated Effort:** 4-5 hours (risky, low value)  
**Recommendation:** Skip unless type confusion becomes a real issue

---

## 4. CODE DUPLICATION

### 4.1 Event Handler Patterns - stopPropagation ⚠️ LOW IMPACT
**Location:** Multiple files  
**Duplication:**
```typescript
// Appears in TableView.tsx (4 times)
onClick={(event) => {
  event.stopPropagation()
  onEdit(job)
}}

// Appears in KanbanCard.tsx
onClick={stopPropagation}  // Already using a11yUtils!
```

**Proposed:**
```typescript
// Add to src/utils/a11yUtils.ts
export function createClickHandler<T extends unknown[]>(
  handler: (...args: T) => void,
  stopProp = false
): (event: React.MouseEvent, ...args: T) => void {
  return (event, ...args) => {
    if (stopProp) event.stopPropagation()
    handler(...args)
  }
}

// Usage:
onClick={createClickHandler(() => onEdit(job), true)}
```

**Impact:** DRY, consistent event handling  
**Dependencies:** None  
**Estimated Effort:** 1 hour

---

### 4.2 Duplicate formatDate Calls with Optional Chaining ⚠️ LOW IMPACT
**Location:** TableView, JobModal, CalendarView  
**Pattern:**
```typescript
{formatDate(job.nextActionDueDate)}  // Returns '-' for empty string
{job.nextActionDueDate ? `(${formatDate(job.nextActionDueDate)})` : ''}
```

**Note:** formatDate already handles empty strings! This is inconsistent usage, not duplication.

**Proposed:** Document formatDate behavior clearly and use consistently
```typescript
// In dateUtils.ts - add JSDoc
/**
 * Format a date string as MM/DD/YYYY
 * @param dateString - ISO date string (YYYY-MM-DD) or empty string
 * @returns Formatted date or '-' if empty
 */
export function formatDate(dateString: string): string {
  return dateString ? /* format */ : '-'
}
```

**Impact:** Clarity, remove unnecessary conditionals  
**Dependencies:** None  
**Estimated Effort:** 30 minutes

---

### 4.3 View Button Pattern Duplication ⚠️ LOW IMPACT
**Location:** TableView.tsx, KanbanCard.tsx  
**Pattern:**
```typescript
// TableView - regular button
<button type="button" className="ghost" onClick={(e) => { 
  e.stopPropagation(); onView(job) 
}}>
  View
</button>

// KanbanCard - div with keyboard props
<div {...createButtonKbdProps(() => onView?.(job))}>
```

**Proposed:** Standardize on KanbanCard approach (more accessible)
```typescript
// New: src/components/ViewButton.tsx
export function ViewButton({ 
  job, 
  onView, 
  variant = 'button' 
}: ViewButtonProps) {
  if (variant === 'card') {
    return <div {...createButtonKbdProps(() => onView(job))} />
  }
  
  return (
    <button 
      type="button" 
      className="ghost"
      onClick={(e) => { e.stopPropagation(); onView(job) }}
    >
      View
    </button>
  )
}
```

**Impact:** Consistent interaction pattern  
**Dependencies:** None  
**Estimated Effort:** 1 hour

---

## 5. ARCHITECTURAL PATTERNS

### 5.1 TableView Prop Drilling - Use Context ⚠️ HIGH IMPACT
**See Section 1.4 above** - TableView receives 22 props from App.tsx

**Proposed Solution:** TableContext provider
- Reduces coupling
- Makes TableView more composable
- Easier to test individual parts

---

### 5.2 Service Layer Completeness ⚠️ MEDIUM IMPACT
**Location:** [src/services/](src/services/)  
**Current State:** Only jobService.ts exists  
**Missing:**
- Storage service (partial - storage.ts exists but not in services/)
- Import/export service (logic in exportImport.ts)
- No API client abstraction

**Proposed:**
```
src/services/
  ├── jobService.ts          (exists - CRUD operations)
  ├── storageService.ts      (move/refactor from storage.ts)
  ├── importExportService.ts (orchestrates CSV/JSON parsers)
  ├── csvParser.ts           (pure CSV logic)
  └── apiClient.ts           (fetch wrapper, error handling)
```

**Impact:** Clear service boundaries, better testability  
**Dependencies:** Refactoring of storage.ts and exportImport.ts  
**Estimated Effort:** 6-8 hours

---

### 5.3 No Error Boundary Components ⚠️ MEDIUM IMPACT
**Location:** None exist  
**Risk:** Unhandled errors crash entire app  

**Proposed:**
```typescript
// New: src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo)
    // Could send to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }
    return this.props.children
  }
}

// Usage in App.tsx or main.tsx:
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

**Impact:** Better error handling, improved UX  
**Dependencies:** None  
**Estimated Effort:** 2 hours

---

### 5.4 Opportunity for Compound Components ⚠️ LOW IMPACT
**Location:** KanbanBoard, TableView  
**Current Pattern:** Props drilling

**Example:** KanbanBoard could use compound components
```typescript
export function KanbanBoard({ children }: { children: React.ReactNode }) {
  return <div className="kanban-grid">{children}</div>
}

KanbanBoard.Column = KanbanColumn

// Usage remains flexible:
<KanbanBoard>
  {JOB_STATUSES.map(status => (
    <KanbanBoard.Column 
      key={status} 
      status={status} 
      jobs={jobs.get(status) ?? []}
      {...handlers}
    />
  ))}
</KanbanBoard>
```

**Impact:** More composable, clearer API  
**Dependencies:** None  
**Estimated Effort:** 2 hours

---

## 6. TESTING GAPS

### 6.1 Components Without Tests (10 components) ⚠️ HIGH IMPACT

**Missing Tests:**
1. ✗ [src/KanbanBoard.tsx](src/KanbanBoard.tsx) (28 lines)
2. ✗ [src/KanbanCard.tsx](src/KanbanCard.tsx) (49 lines)
3. ✗ [src/KanbanColumn.tsx](src/KanbanColumn.tsx) (51 lines)
4. ✗ [src/Toast.tsx](src/Toast.tsx) (39 lines)
5. ✗ [src/components/FilterToolbar.tsx](src/components/FilterToolbar.tsx) (114 lines)
6. ✗ [src/components/JobForm.tsx](src/components/JobForm.tsx) (117 lines)
7. ✗ [src/components/JobModal.tsx](src/components/JobModal.tsx) (74 lines)
8. ✗ [src/components/Pagination.tsx](src/components/Pagination.tsx) (73 lines)
9. ✗ [src/components/SortableHeader.tsx](src/components/SortableHeader.tsx) (32 lines)
10. ✗ [src/components/StatusCell.tsx](src/components/StatusCell.tsx) (28 lines)
11. ✗ [src/components/StatusSelect.tsx](src/components/StatusSelect.tsx) (51 lines)

**Views Missing Tests:**
- ✗ [src/views/TableView.tsx](src/views/TableView.tsx) (208 lines) **CRITICAL**
- ✗ [src/views/CalendarView.tsx](src/views/CalendarView.tsx) (135 lines)
- ✗ [src/views/DashboardView.tsx](src/views/DashboardView.tsx) (18 lines)

**Priority Order:**
1. **TableView.tsx** (most complex, highest risk)
2. **JobForm.tsx** (user input, validation)
3. **FilterToolbar.tsx** (complex state management)
4. **CalendarView.tsx** (date logic)
5. **Kanban components** (drag/drop functionality)

**Estimated Effort:** 20-25 hours for full component test coverage

---

### 6.2 Hooks Without Tests (11 hooks) ⚠️ HIGH IMPACT

**Missing Tests:**
1. ✗ [src/hooks/useFilterState.ts](src/hooks/useFilterState.ts) (117 lines) **CRITICAL**
2. ✗ [src/hooks/useJobFiltering.ts](src/hooks/useJobFiltering.ts) (93 lines) **CRITICAL**
3. ✗ [src/hooks/useJobForm.ts](src/hooks/useJobForm.ts) (88 lines)
4. ✗ [src/hooks/useJobSelection.ts](src/hooks/useJobSelection.ts) (83 lines)
5. ✗ [src/hooks/useTableData.ts](src/hooks/useTableData.ts) (52 lines)
6. ✗ [src/hooks/useViewState.ts](src/hooks/useViewState.ts) (41 lines)
7. ✗ [src/hooks/useUndoStack.ts](src/hooks/useUndoStack.ts) (42 lines)
8. ✗ [src/hooks/useJobGrouping.ts](src/hooks/useJobGrouping.ts) (37 lines)
9. ✗ [src/hooks/useImportExportState.ts](src/hooks/useImportExportState.ts) (36 lines)
10. ✗ [src/hooks/useNotifications.ts](src/hooks/useNotifications.ts) (34 lines)
11. ✗ [src/hooks/useDragDropZone.ts](src/hooks/useDragDropZone.ts) (57 lines)

**Priority Order:**
1. **useFilterState** (complex reducer logic)
2. **useJobFiltering** (filtering/sorting/pagination logic)
3. **useJobForm** (validation, form state)
4. **useJobSelection** (selection state management)
5. **useUndoStack** (undo/redo logic)

**Estimated Effort:** 15-20 hours for full hook test coverage

---

### 6.3 Utils Partially Tested ⚠️ MEDIUM IMPACT

**Tested:**
- ✓ dateUtils.test.ts
- ✓ salaryUtils.test.ts
- ✓ stringUtils.test.ts

**Missing Tests:**
- ✗ [src/utils/a11yUtils.ts](src/utils/a11yUtils.ts) (80 lines)
- ✗ [src/utils/dateCalendarUtils.ts](src/utils/dateCalendarUtils.ts) (110 lines) **CRITICAL - Date logic**
- ✗ [src/utils/dragDataUtils.ts](src/utils/dragDataUtils.ts) (55 lines)
- ✗ [src/utils/downloadUtils.ts](src/utils/downloadUtils.ts) (50 lines)

**Priority:** dateCalendarUtils (complex date math, calendar generation)

**Estimated Effort:** 8-10 hours

---

### 6.4 Integration Test Coverage ⚠️ HIGH IMPACT

**Current State:** Only App.test.tsx exists (likely shallow)  
**Missing:**
- No end-to-end user flows tested
- No tests for import/export workflows
- No tests for drag-and-drop in Kanban
- No tests for filter combinations

**Proposed:**
```typescript
// New: src/tests/integration/
describe('Job Management Flow', () => {
  it('should create, edit, and delete a job', () => { /* ... */ })
  it('should filter jobs by status and date range', () => { /* ... */ })
  it('should import CSV and merge correctly', () => { /* ... */ })
  it('should drag job between Kanban columns', () => { /* ... */ })
  it('should handle undo/redo operations', () => { /* ... */ })
})
```

**Estimated Effort:** 12-15 hours

---

## 7. PERFORMANCE OPPORTUNITIES

### 7.1 Missing Memoization in App.tsx ⚠️ MEDIUM IMPACT
**Location:** [src/App.tsx](src/App.tsx)  
**Issues:**

**A. Handler functions recreated on every render**
```typescript
// Currently:
function handleSubmitJob(event: React.FormEvent<HTMLFormElement>): void { /* ... */ }
function handleEditJob(job: Job): void { /* ... */ }
function handleRemoveJob(id: string): void { /* ... */ }
function handleQuickMove(id: string, nextStatus: JobStatus): void { /* ... */ }
// ... 10+ more handlers

// Should be:
const handleSubmitJob = useCallback((event: React.FormEvent<HTMLFormElement>) => {
  /* ... */
}, [editingId, submitForm, setJobs, resetForm])

const handleEditJob = useCallback((job: Job) => {
  /* ... */
}, [startEdit])

// etc.
```

**Impact:** Prevents unnecessary re-renders of child components  
**Caveat:** Only valuable if child components are memoized (they aren't currently)

**B. Child components not memoized**
```typescript
// Should wrap:
export const TableView = memo(function TableView({ ... }: TableViewProps) {
  // ...
})

export const FilterToolbar = memo(function FilterToolbar({ ... }: FilterToolbarProps) {
  // ...
})

// etc.
```

**Combined Impact:** Reduces renders, improves responsiveness with large job lists  
**Dependencies:** None (but only valuable when both A and B are done)  
**Estimated Effort:** 4-5 hours

---

### 7.2 Unnecessary Re-computation in useJobFiltering ⚠️ LOW IMPACT
**Location:** [src/hooks/useJobFiltering.ts](src/hooks/useJobFiltering.ts)  
**Current State:** Two separate useMemo calls for filtering and overdue count

**Optimization:**
```typescript
// Could be combined:
const { filteredJobs, overdueCount } = useMemo(() => {
  const today = getTodayString()
  let overdue = 0
  
  const filtered = jobs.filter((job) => {
    if (job.nextActionDueDate && job.nextActionDueDate < today) {
      overdue++
    }
    
    // ... rest of filtering
  })
  
  return { filteredJobs: filtered, overdueCount: overdue }
}, [jobs, filterOptions])
```

**Impact:** Very minor - one less traversal of jobs array  
**Value:** Low - premature optimization  
**Recommendation:** Skip unless profiling shows issue

---

### 7.3 Large Component Re-renders ⚠️ LOW IMPACT
**Location:** App.tsx, TableView.tsx  
**Issue:** App renders entire view tree on any state change

**Observation:** React 18 with auto-batching handles this well. Not a real issue unless:
- Job list exceeds 1000+ items
- Profiling shows render bottlenecks

**Recommendation:** Monitor with React DevTools Profiler, optimize only if needed

---

### 7.4 Consider Code Splitting for Views ⚠️ LOW IMPACT
**Opportunity:** Lazy load view components
```typescript
// In App.tsx
const TableView = lazy(() => import('./views/TableView'))
const CalendarView = lazy(() => import('./views/CalendarView'))
const DashboardView = lazy(() => import('./views/DashboardView'))

// Render with Suspense:
<Suspense fallback={<div>Loading view...</div>}>
  {view.view === 'table' && <TableView {...props} />}
  {view.view === 'calendar' && <CalendarView {...props} />}
  {view.view === 'dashboard' && <DashboardView {...props} />}
</Suspense>
```

**Impact:** Marginally smaller initial bundle  
**Value:** Low for small app  
**Recommendation:** Skip unless bundle size becomes an issue

---

## 8. FILE ORGANIZATION

### 8.1 Components Not in components/ Directory ⚠️ MEDIUM IMPACT
**Issue:** KanbanBoard, KanbanCard, KanbanColumn, Toast are in src/ root

**Should move:**
```
src/KanbanBoard.tsx  →  src/components/KanbanBoard.tsx
src/KanbanCard.tsx   →  src/components/KanbanCard.tsx
src/KanbanColumn.tsx →  src/components/KanbanColumn.tsx
src/Toast.tsx        →  src/components/Toast.tsx
```

**OR** create specialized subdirectories:
```
src/components/
  ├── kanban/
  │   ├── KanbanBoard.tsx
  │   ├── KanbanColumn.tsx
  │   └── KanbanCard.tsx
  ├── feedback/
  │   └── Toast.tsx
  └── ... (existing components)
```

**Impact:** Consistent organization, easier to find components  
**Dependencies:** Update imports across codebase  
**Estimated Effort:** 1 hour

---

### 8.2 Missing Index Files for Cleaner Imports ⚠️ LOW IMPACT
**Current State:** No barrel exports (index.ts files)

**Proposed:**
```typescript
// src/components/index.ts
export { FilterToolbar } from './FilterToolbar'
export { JobForm } from './JobForm'
export { JobModal } from './JobModal'
export { Pagination } from './Pagination'
export { SortableHeader } from './SortableHeader'
export { StatusCell } from './StatusCell'
export { StatusSelect } from './StatusSelect'

// src/hooks/index.ts
export * from './useFilterState'
export * from './useJobFiltering'
export * from './useJobForm'
// etc.

// Usage in App.tsx:
import { FilterToolbar, JobForm, JobModal } from './components'
import { useFilterState, useJobFiltering } from './hooks'
```

**Impact:** Cleaner imports, easier refactoring  
**Caveat:** Can slow down build times, makes tree-shaking harder  
**Recommendation:** Use sparingly or skip

---

### 8.3 Inconsistent File Naming ⚠️ LOW IMPACT
**Observation:**
- Components: PascalCase ✓ (FilterToolbar.tsx, JobForm.tsx)
- Hooks: camelCase ✓ (useFilterState.ts, useJobForm.ts)
- Utils: camelCase ✓ (dateUtils.ts, stringUtils.ts)
- Services: camelCase ✓ (jobService.ts)
- Views: PascalCase ✓ (TableView.tsx, CalendarView.tsx)

**Conclusion:** Naming is actually consistent! No action needed.

---

### 8.4 domain.ts Could Be domain/index.ts ⚠️ LOW IMPACT
**Opportunity:** Split domain types into focused files

```
src/domain/
  ├── index.ts         (re-exports everything)
  ├── job.ts           (Job, JobDraft, JobStatus)
  ├── constants.ts     (JOB_STATUSES)
  └── factories.ts     (createJobFromDraft, EMPTY_JOB_DRAFT)
```

**Impact:** Better organization for growing domain logic  
**Value:** Low for current size  
**Recommendation:** Consider if domain logic grows significantly

---

## PRIORITIZED RECOMMENDATIONS

### 🔴 **Phase 5: Critical Refactors (High Impact)**

1. **App.tsx Decomposition** (Est: 8-10 hours)
   - Extract useAppState hook
   - Extract useSortAndPagination hook
   - Extract useJobOperations hook
   - Extract useImportExport hook (enhance existing)
   - Target: Reduce App.tsx from 475 → ~250 lines
   - Files affected: App.tsx + 4 new hooks

2. **TableView Context** (Est: 5-6 hours)
   - Create TableContext
   - Refactor TableView to use context
   - Reduce props from 22 → ~10
   - Files affected: TableView.tsx, new TableContext.tsx

3. **Critical Test Coverage** (Est: 12-15 hours)
   - TableView.tsx integration tests
   - useFilterState hook tests
   - useJobFiltering hook tests
   - dateCalendarUtils tests
   - Core user flow integration tests

**Phase 5 Total:** ~35 hours, **High-value foundational improvements**

---

### 🟡 **Phase 6: Architectural Improvements (Medium Impact)**

1. **Service Layer Completion** (Est: 8-10 hours)
   - Split exportImport.ts → csvParser, jsonExport, jobMerger
   - Split storage.ts → storageLogger, fallbackStorage, orchestrator
   - Create apiClient abstraction
   - Files affected: exportImport.ts, storage.ts + 5 new service files

2. **Component Organization** (Est: 3-4 hours)
   - Move Kanban components to components/kanban/
   - Move Toast to components/feedback/
   - Update all imports
   - Files affected: 4 files moved, 10+ import updates

3. **CalendarView Hook Extraction** (Est: 2-3 hours)
   - Extract useCalendarNavigation
   - Extract useCalendarData
   - Simplify CalendarView component
   - Files affected: CalendarView.tsx + 2 new hooks

4. **Remaining Component Tests** (Est: 15-18 hours)
   - JobForm, FilterToolbar, CalendarView
   - Kanban components (Board, Column, Card)
   - Pagination, SortableHeader, StatusCell, StatusSelect
   - Files affected: 10 new test files

**Phase 6 Total:** ~40 hours, **Improved architecture and test coverage**

---

### 🟢 **Phase 7: Polish & Performance (Low Impact)**

1. **Type System Improvements** (Est: 2-3 hours)
   - Consolidate componentProps.ts as single source of truth
   - Add FilterAction validation helpers
   - Ensure consistent type exports
   - Files affected: componentProps.ts, 3-4 components

2. **Performance Optimizations** (Est: 4-5 hours)
   - Add useCallback to App.tsx handlers
   - Memo-ize child components (TableView, FilterToolbar, etc.)
   - Profile and optimize only if needed
   - Files affected: App.tsx, 5-7 components

3. **Code Duplication Cleanup** (Est: 3-4 hours)
   - Enhance a11yUtils with createClickHandler
   - Standardize View button pattern
   - Document formatDate usage
   - Files affected: a11yUtils.ts, TableView.tsx, KanbanCard.tsx

4. **Error Boundary** (Est: 2 hours)
   - Create ErrorBoundary component
   - Add to App or main.tsx
   - Files affected: New ErrorBoundary.tsx, App.tsx or main.tsx

5. **Remaining Hook Tests** (Est: 10-12 hours)
   - useJobForm, useJobSelection, useUndoStack
   - useTableData, useViewState, useJobGrouping
   - useNotifications, useDragDropZone
   - Files affected: 8 new test files

**Phase 7 Total:** ~25 hours, **Quality of life improvements**

---

## TOTAL EFFORT ESTIMATE

- **Phase 5 (Critical):** ~35 hours
- **Phase 6 (Architecture):** ~40 hours
- **Phase 7 (Polish):** ~25 hours
- **Grand Total:** ~100 hours (~2.5 weeks full-time)

---

## QUICK WINS (< 2 hours each)

For immediate impact with minimal effort:

1. ✅ **Move Kanban components to components/** (1 hour)
2. ✅ **Add JSDoc to formatDate** (15 mins)
3. ✅ **Create usePageReset hook** (30 mins)
4. ✅ **Add ErrorBoundary component** (2 hours)
5. ✅ **Consolidate componentProps.ts** (1 hour)
6. ✅ **createClickHandler in a11yUtils** (1 hour)

**Quick Wins Total:** ~6 hours

---

## NOTES & OBSERVATIONS

### Existing jobsApi.ts File
- **File:** `jobsApi.ts` (root directory)
- **Status:** JavaScript file, appears to be duplicate API logic
- **Recommendation:** Migrate to TypeScript, integrate with storage.ts refactoring
- **Opportunity:** Could replace fetch calls in storage.ts

### Type Definitions Files
- `jobsApi.d.ts` exists - suggests original TypeScript migration attempt
- `sqliteStore.d.ts`, `sqliteStore.ts` exist - backend storage types
- These suggest a backend migration that wasn't completed
- **Recommendation:** Review if these are still needed, clean up if obsolete

### Test Infrastructure
- Uses Vitest (modern, fast)
- Coverage directory exists (`coverage/`)
- Good foundation for expanding test coverage
- No indication of E2E tests (Playwright, Cypress)

### Overall Code Quality
- ✅ Modern React patterns (hooks, functional components)
- ✅ TypeScript usage is strong
- ✅ Good separation of concerns achieved in Phases 1-4
- ✅ Utilities are well-factored
- ✅ Clear naming conventions
- ⚠️ App.tsx still too large (main remaining issue)
- ⚠️ Test coverage gaps (biggest risk)
- ⚠️ Some prop drilling (TableView)

---

## CONCLUSION

The job-tracker codebase is **well-architected** after Phases 1-4 of refactoring. The primary remaining opportunities are:

1. **App.tsx decomposition** - Break 475-line orchestrator into focused hooks
2. **Test coverage** - Add tests for components and hooks (biggest gap)
3. **TableView prop drilling** - Use Context to reduce from 22 props
4. **Service layer completion** - Finish extracting business logic from large utility files

The codebase is in good shape for maintenance and feature development. Recommended focus: **Phase 5 (Critical Refactors)** to address App.tsx complexity and critical test coverage, then **Phase 6** for architectural improvements.

---

**Report Generated:** March 5, 2026  
**Analyzed Files:** 42 source files (3,242 LOC)  
**Test Files:** 8  
**Opportunities Identified:** 31  
**Estimated Total Effort:** ~100 hours
