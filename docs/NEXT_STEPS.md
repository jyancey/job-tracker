# Job Tracker - Next Steps
**Updated:** March 8, 2026  
**Current Version:** v2.5.6+  
**Test Suite Status:** ✅ 556 tests passing across 61 files (+8 Playwright E2E)

---

## Current State Summary

### Testing (✅ Complete)
- **Phase 1:** Engineering Foundation - Component and utility tests
- **Phase 2:** Workflow Components - Forms, drag-drop, tables, Kanban (117 tests)
- **Phase 3:** Hooks, Services, Views, Utilities - All batches complete (121 tests)
- **Total Coverage:** 552 passing tests, 61 test files, ~87% statement coverage
- **Status:** All Phase 1-3 testing objectives met. Test infrastructure is solid.

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
- ❌ "Today" and "This Week" action-focused views
- ❌ Action priority levels and snooze functionality
- ❌ Saved filter presets ("Saved Views")
- ❌ Full-text search across all job fields
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
- [x] A1: Pipeline Intelligence Dashboard (✅ FULLY COMPLETED with Quick Wins)
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
- [x] A2: Today/This Week Action Views (✅ COMPLETED March 8, 2026)
  - [x] Add priority field to Job type
  - [x] Build task views and filters
  - [x] Implement snooze and complete actions
  - [x] Add tests

**Week 3:**
- [x] A3: Saved Filter Presets (✅ COMPLETED March 8, 2026)
  - [x] Implement saved view CRUD
  - [x] Build manager UI
  - [x] Integrate with toolbar
- [ ] A4: Full-Text Search Enhancement
  - [ ] Implement search function
  - [ ] Integrate with filters

**Deliverable:** v2.6.0 release with:
- Analytics Dashboard (✅ complete with drill-down, stuck job modals, CSV export, trend sparklines)
- Task management views (✅ Today + This Week + priority + snooze/complete)
- Saved filter presets (✅ persisted presets with apply/save/rename/delete + sort restore)
- Full-text search (A4)

---

### Sprint 2 (1-2 weeks): Data Safety & Search
**Goal:** Improve confidence and findability

**Week 1:**
- [x] A5: Backup & Restore System
  - [x] Manual backup/restore
  - [x] Automatic backup scheduling
  - [x] Import preview with diff

**Week 2:**
- [ ] Polish and bug fixes
- [ ] Documentation updates
- [ ] User testing feedback integration

**Deliverable:** v2.7.0 release with backup system

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

**Document Status:** Updated after Sprint 2 and Sprint 3 completion  
**Next Review Date:** After A2/A3 implementation checkpoint (~2 weeks)
