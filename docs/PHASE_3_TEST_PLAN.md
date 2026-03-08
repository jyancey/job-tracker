# Phase 3 Test Plan - Comprehensive Coverage

**Status:** Draft  
**Created:** March 8, 2026  
**Previous Phase:** Phase 2 Extension (317 tests passing)

---

## Overview

Phase 3 extends test coverage to remaining high-value components, hooks, services, utilities, and views. This phase targets critical business logic that impacts multiple features and user workflows.

**Current Coverage Baseline:**
- Phase 1+2 Total: 317 tests
- Untested files identified: 16 (hooks, services, utilities, views)
- Coverage gaps: Services, hooks, utilities, view components

---

## Phase 3 Scope & Priorities

### Tier 1: Critical Business Logic (High Priority)
These files have complex logic with significant user impact. Missing tests create regression risk.

#### Hooks (9 files, ~70 test cases)
**Critical path for state management and business operations:**

1. **useJobPersistence.ts** (8-10 tests)
   - Purpose: Handles job data persistence to storage
   - Key Tests:
     - Auto-save job changes to storage
     - Hydration from storage on app load
     - Handles storage errors gracefully
     - Debounces/throttles saves appropriately
   - Dependencies: storage.ts, Job domain

2. **useJobOperations.ts** (8-10 tests)
   - Purpose: Core CRUD operations for jobs
   - Key Tests:
     - Create new job with validation
     - Update job fields (single and multiple)
     - Delete job by ID
     - Status transitions
     - Handles duplicate IDs
     - All operations clear selection state
   - Dependencies: jobService, Job domain

3. **useTableData.ts** (6-8 tests)
   - Purpose: Prepares data for table view (filtering, sorting, pagination)
   - Key Tests:
     - Applies filters to job list
     - Sorts by column and direction
     - Paginates correctly with page/pageSize
     - Calculates totalPages correctly
     - Handles edge cases (empty list, single page)
   - Dependencies: useJobFiltering, useSortAndPagination, useJobGrouping

4. **useNotifications.ts** (6-8 tests)
   - Purpose: Manages toast/notification queue
   - Key Tests:
     - Adds notification with type and message
     - Auto-removes notifications after timeout
     - Notification ID generation
     - Clears all notifications on demand
     - Handles rapid adds without duplicates
   - Dependencies: None (state management only)

5. **useSortAndPagination.ts** (6-8 tests)
   - Purpose: Manages table sort and pagination state
   - Key Tests:
     - Initializes with defaults (sort, page, pageSize)
     - Updates sort column and direction
     - Toggles sort direction on same column
     - Advances/goes back pages within bounds
     - Resets page to 1 when totalPages changes
     - Changes page size (resets to page 1)
   - Dependencies: Job domain

6. **useJobGrouping.ts** (4-6 tests)
   - Purpose: Groups jobs by status or other criteria
   - Key Tests:
     - Groups jobs by JobStatus correctly
     - Returns Map with all 7 statuses
     - Shows empty arrays for statuses with no jobs
     - Preserves job order within groups
   - Dependencies: Job domain, JOB_STATUSES

7. **useImportExport.ts** (6-8 tests)
   - Purpose: Handles import/export file operations
   - Key Tests:
     - Import mode switching (append/upsert/replace)
     - File selection triggers import
     - Export to JSON format
     - Export to CSV format
     - Handles file read errors
     - Clears file input after import
   - Dependencies: exportImport.ts, useJobPersistence

8. **useDragDropZone.ts** (4-6 tests)
   - Purpose: Coordinates drag-drop interactions
   - Key Tests:
     - Detects entry/over/leave zones
     - Validates drop data (job ID, target status)
     - Calls onDrop with correct parameters
     - Prevents default browser behavior
   - Dependencies: dragDataUtils

9. **useViewState.ts** (4-6 tests)
   - Purpose: Manages current view and edit/view mode
   - Key Tests:
     - Toggles between views (all/calendar/compare/dashboard)
     - Opens job for editing (sets editingId)
     - Closes editing mode
     - Opens job view-only (sets viewingId)
     - Closes view-only mode
   - Dependencies: ViewType domain

**Subtotal Tier 1 Hooks: ~58 tests**

#### Services (2 files, ~15 test cases)

1. **jobScrapingService.ts** (8-10 tests)
   - Purpose: Extracts job data from web pages
   - Key Tests:
     - Parses valid HTML job postings
     - Extracts company name, role, salary
     - Handles missing fields (sets to empty string)
     - Preserves formatting (whitespace, line breaks)
     - Returns error for invalid HTML
     - Handles malformed DOM selectors
   - Note: May need to mock actual scraping logic
   - Dependencies: None

2. **Storage-related services** (5-7 tests)
   - Consider: resumeParsingService.ts functionality
   - Tests for reliability of data transformations
   - Dependencies: Job domain

**Subtotal Tier 1 Services: ~15 tests**

### Tier 2: View Components (Medium Priority)
These render user interfaces and coordinate subcomponents. Missing tests leave interaction paths uncovered.

#### Views (5 files, ~65 test cases)

1. **CalendarView.test.tsx** (12-15 tests)
   - Purpose: Calendar interface for viewing jobs by due date
   - Key Tests:
     - Renders calendar grid for current month
     - Displays correct month/year header
     - Navigation to previous/next month works
     - Shows job count badges on relevant dates
     - Clicking date shows jobs due that day
     - Handles months with different day counts (28-31)
     - Style for today's date
   - Props: dueByDate (grouped jobs), onEdit, onView, onDelete
   - Dependencies: CalendarView components, useCalendarNavigation hook

2. **DashboardView.test.tsx** (12-15 tests)
   - Purpose: High-level summary cards and metrics
   - Key Tests:
     - Renders metric cards (total jobs, by status, overdue, etc.)
     - Updates metrics when jobs change
     - Shows conversion rates (Wishlist→Applied, etc.)
     - Displays trend indicators (up/down/stable)
     - Links to underlying views (click card → filtered view)
     - Handles empty state (no jobs)
     - Responsive to changes in job data
   - Props: jobs (all), viewState, onViewChange
   - Dependencies: Metrics calculations, Job domain

3. **CompareView.test.tsx** (10-12 tests)
   - Purpose: Side-by-side comparison of selected jobs
   - Key Tests:
     - Renders table with selected jobs
     - Shows all relevant job fields
     - Highlights differences (score, status, etc.)
     - Sorting by column works
     - Export selected comparison
     - Shows "no selection" message when empty
   - Props: selectedJobIds, jobs, onRemove
   - Dependencies: Comparison utilities

4. **ProfileView.test.tsx** (8-10 tests)
   - Purpose: User profile and preferences panel
   - Key Tests:
     - Renders current user profile data
     - Updates profile fields
     - Saves preferences (theme, notifications, etc.)
     - Shows saved views list
     - Allows management of saved views
     - Handles profile save errors
   - Props: user, onUpdate
   - Dependencies: settingsService

5. **TableView.tsx enhancement** (12-15 tests)
   - Purpose: Comprehensive table view tests (building on existing)
   - Key Tests:
     - Renders table with all visible jobs
     - Bulk select/deselect all visible
     - Individual row selection
     - Bulk delete selected rows
     - Bulk status change
     - Pagination controls
     - Sort column header
     - Status cell editing
   - Props: jobs, selection, pagination, sorting callbacks
   - Dependencies: All table subcomponents

**Subtotal Tier 2 Views: ~65 tests**

### Tier 3: Utilities (Low Priority)
Small, focused utility functions. Quick wins for full coverage.

#### Utilities (1 file, ~8 test cases)

1. **downloadUtils.test.ts** (8 tests)
   - Purpose: Browser download triggers
   - Key Tests:
     - Downloads JSON file
     - Downloads CSV file
     - Filename includes timestamp
     - Sets correct MIME type
     - Triggers download link click
     - Cleans up blob URL after download
   - Dependencies: None (DOM APIs)

**Subtotal Tier 3 Utilities: ~8 tests**

---

## Phase 3 Test Implementation Strategy

### Batch 1: Core Hooks (Priority 1)
- **Files:** useJobPersistence.test.ts, useJobOperations.test.ts, useTableData.test.ts, useNotifications.test.ts
- **Tests:** ~30 tests
- **Effort:** 2-3 days
- **Rationale:** These hooks are fundamental to app state management and persistence

### Batch 2: State Hooks (Priority 2)
- **Files:** useSortAndPagination.test.ts, useJobGrouping.test.ts, useImportExport.test.ts, useViewState.test.ts
- **Tests:** ~24 tests
- **Effort:** 2 days
- **Rationale:** Support table interactions, data organization, navigation

### Batch 3: Drag-Drop & Services (Priority 3)
- **Files:** useDragDropZone.test.ts, jobScrapingService.test.ts
- **Tests:** ~14 tests
- **Effort:** 1-2 days
- **Rationale:** Nice-to-have but less critical for core workflows

### Batch 4: View Components (Priority 4)
- **Files:** CalendarView.test.tsx, DashboardView.test.tsx, CompareView.test.tsx, ProfileView.test.tsx
- **Tests:** ~55 tests
- **Effort:** 4-5 days
- **Rationale:** Component integration tests; medium coverage impact

### Batch 5: Utilities (Priority 5)
- **Files:** downloadUtils.test.ts
- **Tests:** ~8 tests
- **Effort:** 0.5 days
- **Rationale:** Quick wins, low complexity

---

## Expected Coverage After Phase 3

### Test Count Progression:
- Phase 1+2: 317 tests
- **Phase 3 Target: 400-425 tests** (83-108 new tests)

### Coverage Targets:
- Services: 100% (after Phase 3)
- Hooks: 85%+ (most critical paths covered)
- Utilities: 100%
- Views: 80%+ (main interactions covered)
- Overall: 75%+ statement coverage

---

## Key Testing Patterns for Phase 3

### Hook Testing (RTL + renderHook)
```typescript
// Pattern: Test hook with act() for state updates
const { result } = renderHook(() => useJobOperations(jobs, setJobs))
act(() => {
  result.current.handleRemoveJob('job-1')
})
expect(setJobs).toHaveBeenCalled()
```

### View Testing (RTL render)
```typescript
// Pattern: Test view with mocked props and user interactions
render(
  <CalendarView 
    dueByDate={[['2026-03-15', [job1, job2]]]} 
    onEdit={vi.fn()} 
  />
)
const dateCell = screen.getByText('15')
await user.click(dateCell)
expect(screen.getByText(job1.company)).toBeInTheDocument()
```

### Service Testing
```typescript
// Pattern: Test pure functions with diverse inputs
const result = jobService.updateJob(jobs, '1', { status: 'Interview' })
expect(result).toHaveLength(jobs.length)
expect(result[0].status).toBe('Interview')
```

---

## Risk Mitigation

### Known Challenges:
1. **View component complexity** - May need to extract smaller sub-hooks for testability
2. **Browser APIs** (drag-drop, download) - Will use mocks/test doubles
3. **Timing/async operations** - Leverage `waitFor()` and `vi.useFakeTimers()` for notification timeouts

### Rollback Plan:
- All Phase 3 tests are *additive* to Phase 1+2
- If Phase 3 breaks existing tests, revert and diagnose in isolation
- Maintain green Phase 1+2 while developing Phase 3

---

## Success Criteria

- [ ] All 83-108 Phase 3 tests passing
- [ ] No regressions in Phase 1+2 tests (317 tests still passing)
- [ ] Overall statement coverage reaches 75%+
- [ ] All untested files have at least basic test coverage
- [ ] Test latency remains <10s for full run

---

## Next Steps (Upon Approval)

1. ✅ Create Phase 3 plan document (this file)
2. Implement Batch 1 (core hooks) - 3 files, ~30 tests
3. Implement Batch 2 (state hooks) - 4 files, ~24 tests
4. Implement Batch 3 (drag-drop & services) - 2 files, ~14 tests
5. Implement Batch 4 (views) - 4 files, ~55 tests
6. Implement Batch 5 (utilities) - 1 file, ~8 tests
7. Run full test suite and generate coverage report
8. Commit Phase 3 tests with summary

---

## Appendix: Untested Files Summary

| Category | File | Tests Needed | Rationale |
|----------|------|----------|-----------|
| **Hooks** | useJobPersistence.ts | 8-10 | Data persistence (critical) |
| **Hooks** | useJobOperations.ts | 8-10 | CRUD ops (critical) |
| **Hooks** | useTableData.ts | 6-8 | Table data pipeline |
| **Hooks** | useNotifications.ts | 6-8 | Toast notifications |
| **Hooks** | useSortAndPagination.ts | 6-8 | Table controls |
| **Hooks** | useJobGrouping.ts | 4-6 | Data grouping |
| **Hooks** | useImportExport.ts | 6-8 | File I/O |
| **Hooks** | useDragDropZone.ts | 4-6 | Drag-drop coordination |
| **Hooks** | useViewState.ts | 4-6 | Navigation state |
| **Services** | jobScrapingService.ts | 8-10 | Web scraping |
| **Services** | settingsService.ts | 5-7 | User preferences |
| **Utilities** | downloadUtils.ts | 8 | File downloads |
| **Views** | CalendarView.tsx | 12-15 | Calendar UI |
| **Views** | DashboardView.tsx | 12-15 | Metrics/dashboard |
| **Views** | CompareView.tsx | 10-12 | Job comparison |
| **Views** | ProfileView.tsx | 8-10 | User profile |
| **Views** | TableView.tsx | 12-15 | Table enhancements |

**Total Phase 3:** 133-155 tests (realistic target: 100-120 with pragmatic prioritization)

---

## Review & Feedback

This plan is ready for review. Questions/suggestions:
- Should we prioritize views earlier for user-facing features?
- Do we need integration tests between hooks (e.g., useJobOperations + useJobPersistence)?
- Should Phase 3 include E2E tests with Playwright or focus on unit/integration?
