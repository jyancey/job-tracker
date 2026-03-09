# Job Tracker - Next Steps
**Updated:** March 8, 2026  
**Current Version:** v2.6.0 (released)  
**Test Suite Status:** ✅ 646 tests passing across 72 test files

---

## Current State Summary

### Testing (✅ Complete)
- **Phase 1:** Engineering Foundation - Component and utility tests
- **Phase 2:** Workflow Components - Forms, drag-drop, tables, Kanban (117 tests)
- **Phase 3:** Hooks, Services, Views, Utilities - All batches complete (121 tests)
- **Phase 4:** Additional Coverage - Import/Export, Dashboard, Component tests (48 new tests)
- **Total Coverage:** 646 passing tests, 72 test files, ~87% statement coverage
- **Status:** All Phase 1-4 testing objectives met. Test infrastructure is solid.

### E2E Coverage (✅ Baseline Complete)
- Playwright configured and stable in local/CI-friendly mode
- 5 end-to-end tests currently passing:
  - analytics drill-down to filtered table
  - smoke: homepage load
  - smoke: settings open/close
  - CRUD workflow (create/edit/delete)
  - filter + sort workflow
  - cross-view navigation (dashboard/analytics/calendar/kanban/table)

### Architecture (🟡 Partially Complete)
- **Completed Refactoring:**
  - Extracted multiple custom hooks from App.tsx (including actions/compare/table context composition)
  - Separated domain logic (domain.ts)
  - Isolated storage layer (storage.ts, sqliteStore.js)
  - Split frontend storage concerns into focused modules (`jobsApi`, `storageLogger`, `fallbackStorage`)
  - Created service modules (jobService, aiScoringService, resumeParsingService)
  - Split export/import responsibilities into focused modules (`csvParser`, `jsonTransfer`, `jobMerger`)
  - Component extraction (views, inputs, tables, workflows)
  - Extracted `AppShellView` to separate render/routing from orchestration

- **Remaining Issues (from REFACTORING_ANALYSIS.md):**
  - App.tsx is now 233 lines (target reached; monitor for future creep)
  - storage.ts now orchestrates dedicated modules (logging/API/fallback split complete)
  - TableView now uses context-driven subcomponents (`TableBulkActions`, `TableHeader`, `TableBody`, `TableRow`)
  - 10 components without tests (low priority UI components)
  - E2E coverage is baseline-complete; bulk ops/import-export/drag-drop paths remain to add

### Features (🟢 Strong Foundation, 🟡 Growth Opportunities)
**Current Capabilities:**
- ✅ Full CRUD for job applications
- ✅ 7-stage status workflow with drag-drop
- ✅ Rich filtering (status, salary, date ranges, search)
- ✅ Sorting and pagination
- ✅ Import/export (JSON, CSV)
- ✅ AI-powered job scoring
- ✅ Resume parsing and profile management
- ✅ Calendar and dashboard views
- ✅ Comparison view for shortlisted jobs
- ✅ Next action tracking per job
- ✅ Local storage with SQLite backend option

**Missing from Original Roadmap (NEXT_STEPS_PLAN.md):**
- ✅ Pipeline intelligence metrics (conversion rates, time-in-stage)
- ✅ "Today" and "This Week" action-focused views
- ✅ Action priority levels and snooze functionality
- ✅ Saved filter presets ("Saved Views")
- ✅ Full-text search across all job fields
- ✅ Backup snapshots with restore points
- ✅ Import preview with diff before destructive operations

---

## Prioritized Roadmap

### Track A: Feature Development (User-Facing Value)
**Goal:** Evolve from passive tracker to active decision-support and execution tool

#### A1. Pipeline Intelligence Dashboard (HIGH VALUE) 🎯
**Priority:** P0 - Highest ROI  
**Effort:** 2-3 weeks  
**User Impact:** Visibility into application effectiveness and bottlenecks

**Features:**
- Conversion metrics widget:
  - Wishlist → Applied conversion rate
  - Applied → Phone Screen rate
  - Phone Screen → Interview rate
  - Interview → Offer rate
- Time-in-stage analysis:
  - Median days in each status
  - "Stuck" job alerts (configurable thresholds: 7, 14, 30 days)
  - Historical trend graphs (sparklines or mini charts)
- Weekly momentum cards:
  - New applications this week
  - Interviews scheduled
  - Offers received
  - Follow-ups completed

**Implementation Approach:**
1. Create `src/features/analytics/` module:
   - `pipelineMetrics.ts` - Calculation logic
   - `timeInStage.ts` - Duration analysis
   - `PipelineWidget.tsx` - Dashboard component
2. Add analytics view to navigation
3. Comprehensive test coverage (calculation accuracy is critical)
4. Optional: Export metrics to CSV for external tracking

**Success Criteria:**
- Metrics update in real-time as jobs change
- Visual indicators for trends (up/down/stable)
- Clicking metric cards filters main table view ✅
- All calculations tested with edge cases (empty data, single job, etc.)

**Latest A1 Enhancement (March 8, 2026):**
- Analytics cards now support drill-down navigation to the table with status filters applied.
- Stuck job items are now clickable and open the job modal directly (quick win feature).
- Added test coverage for drill-down callback behavior, stuck job click interaction, and E2E paths.
- Test totals: **556 unit tests (+4), 8 E2E tests (+2)**

**Estimated Tests:** 25-30 new tests  
**Dependencies:** None (uses existing Job domain)

---

#### A2. Today/This Week Action Views (HIGH VALUE) 🎯
**Priority:** P0 - Drives daily execution  
**Effort:** 1-2 weeks  
**User Impact:** Transforms app from record keeper to daily driver

**Features:**
- "Today" view:
  - Jobs with due date = today
  - Overdue actions (due < today, incomplete)
  - Priority sorting (High → Medium → Low)
- "This Week" view:
  - Jobs due within next 7 days
  - Grouped by due date
  - Priority indicators
- Task management:
  - Mark action complete (clears nextAction, updates status if needed)
  - Snooze action (push due date forward 1/3/7 days)
  - Set priority level (Low/Med/High)
  - Quick add new action from task view

**Implementation Approach:**
1. Create `src/features/tasks/` module:
   - `taskFilters.ts` - Due date and priority logic
   - `TodayView.tsx`, `ThisWeekView.tsx`
   - `TaskCard.tsx` - Action display with snooze/complete
2. Add priority field to Job type (optional, defaults to Medium)
3. Update domain validation for priority enum
4. Add task views to main navigation
5. Optional: Browser notifications for overdue tasks (Notification API)

**Success Criteria:**
- Task views load instantly (<100ms even for 1000+ jobs)
- Completing action updates job state correctly
- Snooze preserves action text, updates due date
- Overdue count badge shows in navigation

**Estimated Tests:** 20-25 new tests  
**Dependencies:** Minor Job type extension (priority field)

---

#### A3. Saved Filter Presets (MEDIUM VALUE)
**Priority:** P1 - Quality of life improvement  
**Effort:** 1 week  
**User Impact:** Reduces repetitive filtering friction

**Features:**
- Save current filter state as named preset
  - Includes: status filters, salary range, date filters, sort, search
  - Name required, optional description
- Saved view manager:
  - List all saved views
  - Apply view (restores all filter state)
  - Edit/rename view
  - Delete view
- Quick access:
  - Dropdown in toolbar for saved views
  - Show current view name when active
  - "Clear all filters" quick action

**Implementation Approach:**
1. Create `SavedView` type (name, description, filters, created date)
2. Add saved views to storage/persistence layer
3. Create `SavedViewManager.tsx` modal
4. Add `useSavedViews` hook for CRUD operations
5. Integrate saved view dropdown into toolbar

**Success Criteria:**
- Saved views persist across sessions
- Applying view atomically updates all filter state
- Can create/edit/delete without data loss
- Export includes saved views (optional)

**Estimated Tests:** 15-18 tests  
**Dependencies:** None

---

#### A4. Full-Text Search Enhancement (MEDIUM VALUE)
**Priority:** P1 - Findability  
**Effort:** 3-5 days  
**User Impact:** Fast job lookup without manual filtering

**Features:**
- Search across multiple fields:
  - Company name
  - Role/position title
  - Notes
  - Contact person
  - Location
  - Skills/tags
- Search UX:
  - Live results as user types (debounced)
  - Highlight matching text in results
  - Clear search button
  - Search matches count indicator
- Advanced (optional):
  - Search operators (AND, OR, NOT)
  - Field-specific search (company:Google)

**Implementation Approach:**
1. Add `searchJobs(jobs: Job[], query: string): Job[]` to domain
2. Implement case-insensitive multi-field matching
3. Debounce search input (300ms)
4. Integrate with existing filter pipeline
5. Optional: Add search history/recent searches

**Success Criteria:**
- Search returns results instantly on datasets up to 5000 jobs
- Clearing search restores previous filter state
- Search query persists in URL (optional, for shareability)

**Estimated Tests:** 12-15 tests  
**Dependencies:** None

---

#### A5. Backup & Restore System (HIGH VALUE) 🔒 (✅ Completed)
**Priority:** P1 - Data safety  
**Effort:** 1-2 weeks  
**User Impact:** Peace of mind, recovery from mistakes

**Delivered (March 8, 2026):**
- Manual backup snapshot download
- Restore modes with impact summary (append/upsert/replace)
- Automatic backup scheduling (daily/weekly/monthly/disabled)
- Backup retention policy (keep last N, prune old snapshots)
- Import/restore diff preview with field-level change details
- Backup-specific test coverage: 46 tests

**Features:**
- Manual backup:
  - Create timestamped backup snapshot (JSON)
  - Optional: Backup includes saved views, profile, AI config
  - Store locally or download
- Automatic backups:
  - Daily backup (configurable interval)
  - Keep last N backups (default 7)
  - Prune old backups automatically
- Restore workflow:
  - List available backups with metadata (date, job count)
  - Preview backup contents before restore
  - Restore options: Replace All, Merge (upsert), Append
  - Confirmation with impact summary (X jobs will be deleted, Y added)
- Import preview:
  - Show diff before destructive import operations
  - Color-coded: green (new), yellow (updated), red (deleted)
  - Approve/cancel before applying

**Implementation Approach:**
1. Create `src/features/backup/` module:
   - `backupService.ts` - Create/list/restore logic
   - `BackupManager.tsx` - UI for backup operations
   - `ImportPreview.tsx` - Diff view before import
2. Add backup metadata type (timestamp, version, job count)
3. Integrate auto-backup with storage save cycle
4. Add restore to settings/profile view
5. Comprehensive edge case testing (corrupted backups, version mismatches)

**Success Criteria:**
- Backup creation takes <1 second even for 5000+ jobs
- Restore accurately replaces/merges data
- Import preview diff is accurate (no false positives)
- Auto-backup doesn't impact app performance
- Backup files are human-readable JSON

**Estimated Tests:** 25-30 tests (critical data safety)  
**Dependencies:** Enhanced import/export logic

---

### Track B: Code Quality & Architecture (Developer Velocity) (✅ Completed)
**Goal:** Make future feature development faster and safer

#### B1. App.tsx Final Refactoring (MEDIUM EFFORT) (✅ Completed)
**Priority:** P2 - Maintainability  
**Effort:** 4-6 hours  
**Current State:** 233 lines, orchestration-focused

**Outcome:** Target achieved by extracting orchestration helpers and presentation shell.

**Extraction 1: useAppState hook**
```typescript
// New: src/hooks/useAppState.ts
// Encapsulates: jobs, editingJob state, hydration status, save status
// Lines saved: ~80
```

**Extraction 2: useJobCRUD hook**
```typescript
// New: src/hooks/useJobCRUD.ts
// Encapsulates: handleSubmit, handleEditJob, handleRemoveJob
// Lines saved: ~60
```

**Extraction 3: useUndo hook**
```typescript
// New: src/hooks/useUndo.ts
// Encapsulates: undo/redo stack management
// Lines saved: ~40
```

**Impact:**
- App.tsx becomes pure composition/routing
- Each extracted hook is independently testable
- Easier to reason about state flow
- Reduces cognitive load for new features

**Estimated Tests:** Completed with existing + new hook/regression coverage  
**Risk:** Low (existing tests serve as regression suite)

---

#### B2. TableView Prop Drilling Fix (LOW EFFORT, HIGH IMPACT) (✅ Completed)
**Priority:** P2 - Component clarity  
**Effort:** 2-3 hours  
**Current State:** Context-first table composition is in place

**Delivered (March 8, 2026):**
- `TableView` reduced to composition-focused layout
- Added context-driven subcomponents:
  - `src/views/table/TableBulkActions.tsx`
  - `src/views/table/TableHeader.tsx`
  - `src/views/table/TableBody.tsx`
  - `src/views/table/TableRow.tsx`
- Table interactions and state are consumed directly from `TableViewContext`, removing intermediate prop chains

**Solution Applied:** React Context pattern
```typescript
// New: src/contexts/TableContext.tsx
export const TableContext = createContext<TableContextValue>(...)

// TableView.tsx becomes:
<TableContext.Provider value={{ jobs, onEdit, onDelete, ... }}>
  <TableView />
</TableContext.Provider>

// Child components use:
const { onEdit, onDelete } = useTableContext()
```

**Impact:**
- Reduces TableView props from 22 → 3-4
- Eliminates intermediate prop passing through TableRow, TableCell
- Easier to add new table features

**Validation:** App tests, TableViewContext tests, E2E suite, and build all passing  
**Risk:** Very low (pure refactoring, no behavior change)

---

#### B3. Split exportImport.ts Module (LOW EFFORT) (✅ Completed)
**Priority:** P3 - Organization  
**Effort:** 3-4 hours  
**Current State:** 239 lines, mixed CSV/JSON/merge

**Split into:**
```
src/services/
├── csvParser.ts       (~80 lines: parseCsv, exportToCsv)
├── jsonExporter.ts    (~60 lines: exportToJson, importFromJson)
└── jobMerger.ts       (~50 lines: mergeImportedJobs, ImportMode logic)

src/exportImport.ts    (~50 lines: orchestrates the above)
```

**Impact:**
- Each module is single-responsibility
- CSV parser is reusable for other features
- Easier to test in isolation

**Estimated Tests:** 10 new tests for isolated modules  
**Risk:** Low (existing integration tests catch regressions)

---

#### B4. Add Playwright E2E Smoke Tests (MEDIUM EFFORT) (✅ Baseline Completed)
**Priority:** P2 - Regression safety  
**Effort:** 1 week  
**Current State:** 5 E2E tests passing (smoke + CRUD + filter/sort + navigation)

**Test Coverage (5-7 critical paths):**
1. **Happy path CRUD:**
   - Create job → edit → delete
   - Verify persistence across page reload
2. **Filtering workflow:**
   - Apply multiple filters → verify results → clear filters
3. **Bulk operations:**
   - Select multiple jobs → bulk status change → verify updates
   - Bulk delete → verify removal
4. **Import/Export:**
   - Export to JSON → import into clean state → verify data
5. **Drag-drop workflow:**
   - Drag job between status columns → verify status update
6. **Calendar navigation:**
   - Navigate months → click date → verify job list
7. **Search and sort:**
   - Search for job → sort results → verify order

**Implementation:**
1. Add Playwright to dev dependencies
2. Create `e2e/` directory with tests
3. Add npm scripts: `test:e2e`, `test:e2e:ui`
4. Configure CI to run E2E tests on PR
5. Add visual regression testing (optional)

**Success Criteria:**
- E2E suite runs in <2 minutes
- Tests are deterministic (no flakiness)
- CI fails on E2E test failures
- Easy to add new E2E tests (template/helper functions)

**Estimated Tests:** 7 E2E test files, 20-25 test cases  
**Risk:** Medium (E2E can be flaky, needs careful setup)

---

#### B5. Storage Layer Cleanup (LOW PRIORITY) (✅ Completed)
**Priority:** P3 - Organization  
**Effort:** 3-4 hours  
**Current State:** `storage.ts` is an orchestrator over focused storage modules

**Delivered (March 8, 2026):**
1. Added typed API wrapper in `src/storage/jobsApi.ts`
2. Extracted logging into `src/storage/storageLogger.ts`
3. Extracted local fallback persistence into `src/storage/fallbackStorage.ts`
4. Refactored `src/storage.ts` to orchestrate these modules and re-export log utilities
5. Added focused tests for extracted modules:
  - `src/storage/jobsApi.test.ts`
  - `src/storage/fallbackStorage.test.ts`

**Refactoring Applied:**
1. Introduced `jobsApi.ts` (frontend API client layer)
2. Extracted storage logging lifecycle to `storageLogger.ts`
3. Isolated local fallback read/write in `fallbackStorage.ts`
4. Kept `storage.ts` as orchestration entrypoint used by app hooks

**Impact:**
- Clearer separation of concerns
- Each module independently testable
- Easier to swap storage backends (e.g., IndexedDB)

**Validation:** storage tests + build all passing after module split  
**Risk:** Low

---

## Recommended Execution Plan

### Sprint 1 (2-3 weeks): High-Value Features
**Goal:** Deliver measurable user value

**Week 1:**
- [x] A1: Pipeline Intelligence Dashboard (✅ COMPLETED)
  - [x] Implement conversion metrics calculations
  - [x] Create dashboard widgets
  - [x] Add comprehensive tests
  - [x] Integration with main app
  - [x] Analytics drill-down to filtered table (bonus)
  - [x] Stuck job modal click-through (bonus quick win)
  - [x] CSV export of analytics metrics (Quick Win #1)
  - [x] Sparkline mini-charts for trend visualization (Quick Win #2)
  - [x] Stuck job badge and threshold details in modal (Quick Win #3)

**Week 2:**
- [x] A2: Today/This Week Action Views (✅ COMPLETED)
  - [x] Add priority field to Job type
  - [x] Build task views and filters
  - [x] Implement snooze and complete actions
  - [x] Add tests

**Week 3:**
- [x] A3: Saved Filter Presets (✅ COMPLETED)
  - [x] Implement saved view CRUD
  - [x] Build manager UI
  - [x] Integrate with toolbar
- [x] A4: Full-Text Search Enhancement (✅ COMPLETED)
  - [x] Implement search function
  - [x] Integrate with filters
  - [x] Add debounce (300ms), clear search, and match count
  - [x] Highlight matching text in table results

**Deliverable:** v2.6.0 release with:
- Analytics Dashboard (✅ complete with drill-down, stuck job modals, CSV export, trend sparklines)
- Task management views (✅ Today + This Week + priority + snooze/complete)
- Saved filter presets (✅ persisted presets with apply/save/rename/delete + sort restore)
- Full-text search (✅ multi-field + debounce + clear + match highlighting)

---

### Sprint 2 (1-2 weeks): Data Safety & Search
**Goal:** Improve confidence and findability

**Week 1:**
- [x] A5: Backup & Restore System
  - [x] Manual backup/restore
  - [x] Automatic backup scheduling
  - [x] Import preview with diff

**Week 2:**
- [x] Polish and bug fixes
- [x] Documentation updates
- [ ] User testing feedback integration

**Deliverable:** v2.7.0 release with backup system complete

---

### Sprint 3 (1-2 weeks): Architecture Hardening
**Goal:** Improve developer velocity for future work

**Week 1:**
- [x] B1: App.tsx Final Refactoring
  - [x] Extracted orchestration hooks + moved render/routing to `AppShellView`
  - [x] Updated tests and validated regression suite
- [x] B2: TableView Prop Drilling Fix
  - [x] Implemented `TableViewContext`
  - [x] Updated child components (`TableBulkActions`, `TableHeader`, `TableBody`, `TableRow`)

**Week 2:**
- [x] B3: Split exportImport.ts
  - [x] Created focused modules
  - [x] Updated imports
- [x] B4: Playwright E2E Tests
  - [x] Setup and configure
  - [x] Implement baseline critical-path tests
  - Future enhancement: expand to bulk ops/import-export/drag-drop scenarios
- [x] B5: Storage Layer Cleanup
  - [x] Added `jobsApi`, `storageLogger`, `fallbackStorage` modules
  - [x] Converted `storage.ts` to orchestrator pattern
  - [x] Added focused storage module tests

**Deliverable:** v2.7.1 maintenance release with improved architecture

---

## v2.7.0 Week 2 Release: Polish & Documentation

### Polish & Bug Fixes (Completed)
**Documentation:**
- Fixed README.md markdown linting issues:
  - Added proper blank lines before headings and lists  
  - Fixed code block language specification
  - Corrected markdown table formatting (pipe spacing)
  - Updated version references to v2.6.0

**Code Quality:**
- Language server diagnostics reviewed (all false positives, actual build + tests passing)
- Full test suite passes: 598/598 tests ✅
- Production build successful with no warnings ✅

### Documentation Improvements (Completed)
**Updated:**
- [README.md](../README.md) — Version tag, CI/CD details, usage examples
- [NEXT_STEPS.md](./NEXT_STEPS.md) — Current progress, v2.6.0 completion, v2.7.0 status
- Markdown formatting across all documentation files

**Coverage:**
- Feature descriptions for A1–A5 complete
- Architecture decisions documented in REFACTORING_ANALYSIS.md
- Test strategy documented in PHASE_3_TEST_PLAN.md
- Historical releases tracked in ROADMAP_HISTORICAL_v2.3.md

### User Testing Feedback Integration (Pending)
- Ready to incorporate user feedback post-v2.6.0 release
- Prioritize feature requests based on adoption metrics

---

## Success Metrics

### Feature Track (User-Facing)
- **Adoption:** % of users who use pipeline analytics weekly
- **Engagement:** Daily active task view usage
- **Efficiency:** Time saved with saved filter presets
- **Confidence:** User-reported data safety sentiment
- **Retention:** User retention rate post-v2.6.0

### Code Quality Track (Developer)
- **Velocity:** Time to implement new features (compare pre/post refactoring)
- **Stability:** Bug count per release (target: <5 per minor release)
- **Coverage:** Maintain 85%+ test coverage
- **Performance:** E2E test suite runtime (target: <2 min)
- **Maintainability:** Developer onboarding time (subjective)

---

## Risk Assessment

### High Risk Items
1. **E2E Test Flakiness (B4):** Playwright tests can be flaky
   - **Mitigation:** Use stable selectors, add explicit waits, retry logic
   
2. **Data Migration for New Fields (A2):** Adding priority field to Job type
   - **Mitigation:** Default values, backward compatibility, migration tests

3. **Performance with Large Datasets (A1, A4):** Analytics and search on 5000+ jobs
   - **Mitigation:** Performance testing, memoization, web workers if needed

### Medium Risk Items
1. **Backup File Compatibility (A5):** Schema changes break old backups
   - **Mitigation:** Version backups, migration logic

2. **Refactoring Introduces Regressions (B1, B2, B3):** Hook extraction changes behavior
   - **Mitigation:** Comprehensive existing test suite serves as safety net

### Low Risk Items
1. **Saved Views Feature Creep (A3):** Users request complex filtering
   - **Mitigation:** Start with MVP, iterate based on feedback

---

## Deferred / Out of Scope

The following items from the original NEXT_STEPS_PLAN.md are **deferred** for now:

1. **Local Notifications for Due Tasks:**
   - Reason: Browser notification API is complex, low adoption
   - Alternative: Visual indicators in app are sufficient for now

2. **Application Quality Scoring:**
   - Reason: Already implemented in current version (AI scoring feature exists)
   - Status: ✅ Complete

3. **Compare View:**
   - Reason: Already implemented in current version
   - Status: ✅ Complete

4. **Error Boundaries:**
   - Reason: App is stable, error boundaries are defensive
   - Status: Can add incrementally as needed (low priority)

5. **Storage Backend Swap (IndexedDB, SQLite):**
   - Reason: Current localStorage + optional SQLite works well
   - Status: Not a priority unless performance issues arise

---

## Appendix: Testing Status

### Current Test Coverage (552 tests, 61 files)

**Phase 1 (Engineering Foundation):**
- Domain logic, utilities, storage layer
- ~250 tests

**Phase 2 (Workflow Components):**
- Forms, tables, Kanban, drag-drop
- 117 tests

**Phase 3 (Hooks, Services, Views):**
- All custom hooks, services, view components
- 121 tests

**Coverage Breakdown:**
- Services: ~100%
- Hooks: ~90%
- Components: ~85%
- Utilities: ~100%
- Views: ~85%
- **Overall:** ~87% statement coverage

**Playwright E2E Coverage:**
- 6 passing tests in `e2e/`
- Smoke + CRUD + analytics drill-down + filter/sort + cross-view navigation

**Files Still Untested (Low Priority):**
- Minor UI components (badges, icons, tooltips)
- CSS modules
- Configuration files

---

## Next Actions

**Immediate (This Week):**
1. Start A2: priority field + Today/This Week task views
2. Start A3: saved filter presets (MVP CRUD + apply)
3. Start A4: full-text search enhancements and UX polish

**This Month:**
1. Complete A2, A3, and A4 feature set
2. Expand E2E suite for bulk operations/import-export/drag-drop
3. Plan v2.6.x feature release

**This Quarter:**
1. Ship remaining roadmap features (A2/A3/A4)
2. Expand E2E coverage for bulk ops/import-export/drag-drop
3. Gather user feedback on task-centric workflows
4. Plan next phase based on usage data

---

---

## v2.7.0 Roadmap - Architecture Hardening & Scalability

**Focus:** Improve maintainability and prepare for rapid feature development

### C1. App State Management Hooks (In Progress)
**Priority:** P1 - Foundation for all views  
**Effort:** 1 week  
**Complexity:** Medium

**Deliverables:**
- Extract app state into focused hooks:
  - `useAppState()` - Jobs, hydration status, save status
  - `useSelectionState()` - Selection tracking for bulk operations
  - `usePageReset()` - Pagination reset on filter changes
- Move orchestration helper functions into composed hooks
- Eliminate state prop drilling in App.tsx

**Benefits:**
- App.tsx becomes pure composition/routing (~150 lines)
- Testable, reusable state logic
- Easier mental model for new developers

**Tests:** 12-15 new hook tests  
**Status:** Planned for v2.7.0-beta

---

### C2. React Context for Table State
**Priority:** P1 - Reduce prop drilling  
**Effort:** 2-3 days  
**Complexity:** Medium

**Deliverables:**
- Create `TableContext` for table-specific state:
  - Currently passed through: selectedIds, sortColumn, sortDirection, filters, etc.
  - 22 props → 3-4 props after refactoring
- Refactor TableView and related components to use context

**Benefits:**
- Cleaner component APIs
- Easier to add new table features (columns, actions)
- Better performance (contextual rendering)

**Tests:** 8-10 context tests + updated component tests  
**Status:** Planned for v2.7.0-beta

---

### C3. Service Layer Refactoring (In Progress)
**Priority:** P2 - Code organization  
**Effort:** 3-4 days  
**Complexity:** Low-Medium

**Deliverables:**
- Extract focused service modules:
  - `storageService.ts` - Orchestrates storage I/O
  - `csvParser.ts` - CSV parsing and export
  - `jsonExport.ts` - JSON export logic
  - `jobMerger.ts` - Job merge strategies (append/upsert/replace)
- Update imports across app
- Add service layer tests

**Benefits:**
- Clear separation of concerns
- Easier to test storage strategies
- Reusable service modules

**Tests:** 8-12 new service tests  
**Status:** Planned for v2.7.0-beta

---

### C4. Error Boundary Implementation
**Priority:** P2 - Error handling  
**Effort:** 1-2 days  
**Complexity:** Low

**Deliverables:**
- Create `ErrorBoundary` component with:
  - Error fallback UI
  - Error logging to console/storage
  - Recovery button ("Try again")
- Wrap major views and feature sections
- Add tests for error scenarios

**Benefits:**
- Graceful degradation on unexpected errors
- Better error diagnostics
- Improved user experience

**Tests:** 4-6 error boundary tests  
**Status:** Planned for v2.7.0

---

### C5. Component Fine-Tuning
**Priority:** P3 - Quality of life  
**Effort:** 2-3 days  
**Complexity:** Low

**Deliverables:**
- Add tests for remaining 10-12 untested components
- Refactor Kanban components into `src/components/kanban/` subdirectory
- Move Toast component to `src/components/feedback/`
- Update imports across app

**Benefits:**
- Improved code organization
- Better test coverage (≥90%)
- Clearer component hierarchy

**Tests:** 10-12 new component tests  
**Status:** Planned for v2.7.0

---

## v2.8.0 Roadmap - Advanced Features & Performance

**Focus:** Next generation of capabilities based on v2.7.0 foundation

### D1. Advanced Filtering & Saved Views (MEDIUM VALUE)
**Priority:** P0 - User demand  
**Effort:** 1 week  
**Features:**
- Complex filter compositions (AND/OR logic)
- Saved filter presets with metadata
- Filter templates by common patterns
- Shareable filter URLs

### D2. Mobile Responsive Design
**Priority:** P1 - Accessibility  
**Effort:** 2 weeks  
**Features:**
- Mobile-optimized layouts
- Touch-friendly controls
- Responsive Kanban board
- Mobile-optimized calendar

### D3. Performance Optimization
**Priority:** P1 - Scalability  
**Effort:** 1 week  
**Features:**
- Memoization for expensive components
- Code splitting by route
- Virtual scrolling for large job lists
- IndexedDB for offline-first support

### D4. Team Collaboration (ADVANCED)
**Priority:** P2 - Expansion  
**Effort:** 3-4 weeks  
**Features:**
- Multi-user support with cloud sync
- Shared job tracking within teams
- Commenting and activity feed
- Role-based access control

### D5. Advanced AI Integration
**Priority:** P2 - Intelligence  
**Effort:** 2 weeks  
**Features:**
- AI-powered job recommendations
- Resume optimization suggestions
- Interview preparation assistance
- Salary negotiation guidance

---

## Test Coverage Summary (v2.6.0 → v2.7.0)

### Current Status
**Total Tests:** 646 passing across 72 test files  
**Test Coverage:** ~87% statement coverage  
**Production Ready:** ✅ Yes

### Test Growth by Phase
| Phase | Feature | Unit Tests | Component Tests | Integration | Total |
|-------|---------|-----------|------------------|-------------|-------|
| Phase 1 | Foundation | 180 | 50 | 20 | 250 |
| Phase 2 | Workflows | 40 | 50 | 27 | 117 |
| Phase 3 | Hooks/Services/Views | 60 | 50 | 11 | 121 |
| Phase 4 | Additional Coverage | 60+ | 50+ | 8+ | 118+ |
| **Total** | **v2.6.0** | **340+** | **200+** | **66+** | **646** |

### Coverage by Component Type

| Component | Coverage | Status | Notes |
|-----------|----------|--------|-------|
| Services | 100% | ✅ Complete | All CRUD and business logic tested |
| Hooks | 90%+ | ✅ Solid | All main hooks tested, minor edge cases only |
| Utilities | 100% | ✅ Complete | All utility functions tested |
| Views | 85%+ | ✅ Good | View composition and routing tested |
| Components | 80%+ | ⚠️ Good | 12-14 UI components untested (low priority) |
| Domain | 100% | ✅ Complete | All types and domain logic tested |
| Storage | 90%+ | ✅ Good | Alternative backends have test stubs |

### v2.7.0 Plan
- Add 20-25 new tests for new hooks (useAppState, useSelectionState, usePageReset)
- Add 8-10 tests for TableContext
- Add 10-12 tests for remaining components
- Target: 680-700 tests, 89%+ coverage

---

## Deferred / Out of Scope

The following items remain deferred for future releases:

1. **Error Boundaries:** Moving to v2.7.0 (C4)
2. **Local Browser Notifications:** Low priority, visual indicators sufficient
3. **IndexedDB Storage:** Planned for v2.8.0 performance optimization
4. **Team Collaboration:** Planned for v2.8.0+ (D4)
5. **Mobile App (Native):** Future consideration for v2.9.0+

---

## Architecture Decision Records (July 2025 - March 2026)

### v2.6.0 ADRs

**ADR-001: Hooks-based State Management**
- Decision: Use React hooks instead of Redux/Zustand
- Status: ACCEPTED (proven effective with 640+ tests)

**ADR-002: Feature Modules (A1-A5)**
- Decision: Organize features into feature directories
- Status: ACCEPTED (scalable, proven pattern)

**ADR-003: Service Layer for Business Logic**
- Decision: Isolate business logic in service modules
- Status: ACCEPTED (improved testability and reusability)

**ADR-004: Context API for Deeply Nested State**
- Decision: Use React Context for table and app-wide state
- Status: APPROVED (to be implemented in v2.7.0 as C2)

---

## Recommended Execution Plan

### v2.7.0 (2-3 weeks) - Alpha/Beta Phase
**Goal:** Refactor architecture for scalability without changing user-facing features

**Week 1:**
- [x] C1: App State Management Hooks
  - [x] useAppState.ts extraction
  - [x] useSelectionState.ts extraction
  - [x] usePageReset.ts extraction
  - [x] Tests for new hooks

- [ ] C3: Service Layer Organization
  - [ ] csvParser.ts creation
  - [ ] jsonExport.ts creation
  - [ ] jobMerger.ts creation
  - [ ] storageService.ts refactoring

**Week 2:**
- [ ] C2: React Context Implementation
  - [ ] TableContext creation
  - [ ] TableView component refactoring
  - [ ] Child component updates
  - [ ] Context tests

- [ ] C5: Component Test Coverage
  - [ ] Add remaining component tests
  - [ ] Kanban component reorganization
  - [ ] Toast/feedback component reorganization

**Week 3:**
- [ ] C4: Error Boundary
  - [ ] ErrorBoundary component creation
  - [ ] Error logging integration
  - [ ] Error boundary tests
  - [ ] Error documentation

- [ ] Documentation
  - [ ] Update ARCHITECTURE.md with new structure
  - [ ] Migration guide for developers
  - [ ] V2.7.0 release notes

**Deliverable:** v2.7.0 with improved architecture, 680+ tests, zero user-facing changes

### v2.7.1-v2.7.x (Ongoing) - Maintenance Phase
- Bug fixes based on user feedback
- Performance optimizations if needed
- Documentation improvements
- E2E test expansion

### v2.8.0 (Quarterly) - Advanced Features
- Performance optimization (D3)
- Mobile responsiveness (D2)
- Advanced filtering (D1)
- Preparation for team collaboration

---

## Success Metrics v2.7.0

### Code Quality
- ✅ 680+ tests, 89%+ coverage
- ✅ No regressions (all existing tests pass)
- ✅ App.tsx reduced to ~150 lines
- ✅ Zero user-facing changes
- ✅ Developer onboarding time improved

### Performance
- ✅ Bundle size unchanged
- ✅ E2E test suite <2 min
- ✅ No memory leaks detected
- ✅ Component re-renders optimized

### Documentation
- ✅ ARCHITECTURE.md comprehensive
- ✅ Migration guide for developers
- ✅ Decision records documented
- ✅ Code comments for complex logic

---

**Document Status:** Pre-release planning for v2.7.0 (architecture hardening)  
**Next Review Date:** After v2.7.0 beta release
