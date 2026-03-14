# Job Tracker - Architecture Overview

**Version:** v2.7.0 release prep (main branch) + Safari Plugin v1.0 planning
**Last Updated:** March 14, 2026
**Status:** Production-Ready with 681 Tests; v2.7.0 conditional-go pending final review; Safari Plugin in planning phase

---

## High-Level Architecture

```
┌──────────────────────────────┐                     ┌─────────────────────────────────┐
│   macOS Safari Plugin         │                     │   Frontend Application          │
│   (v1.0 planning)             │                     │   (React + TypeScript)          │
├──────────────────────────────┤                     ├─────────────────────────────────┤
│ Popup / Sidebar / Settings   │                     │ Presentation Layer              │
│ ↓                             │                     │ Views, Components                │
│ Content Script (Pre-fill)    │                     │ ↓                               │
│ ↓                             │                     │ Hooks & State (usePluginQueue) │
│ Service Worker               │                     │ ↓                               │
│ (Queue, Messaging)           │                     │ Service Layer                   │
│ ↓                             │                     │ ↓                               │
│ browser.storage.local        │◄──localStorage──►   │ Storage & Persistence           │
│ (PluginQueueItem[])          │   (sync)            │                                 │
└──────────────────────────────┘                     └─────────────────────────────────┘
         │                                                    ▲
         │ (optional HTTP POST)                              │
         │ /api/jobs/from-plugin                            │
         ▼                                                    │
┌──────────────────────────────┐                    (manual import or auto-sync)
│   Optional Backend API        │
│   - Job creation              │
│   - Rate limiting             │
│   - Workspace scoping         │
└──────────────────────────────┘
```

**Data Flow:** Safari Plugin captures job details → stores in browser.storage.local → job-tracker observes localStorage changes → imports jobs via usePluginQueue hook → displays in app

---

## Project Structure

```
job-tracker/
├── src/
│   ├── App.tsx                          # Root component (orchestrates views)
│   ├── App.test.tsx                     # Integration tests for App
│   ├── main.tsx                         # Entry point
│   ├── index.css                        # Global styles
│   │
│   ├── views/                           # Page-level components
│   │   ├── TableView.tsx                # Jobs table with bulk ops
│   │   ├── CalendarView.tsx             # Calendar view by due date
│   │   ├── AnalyticsView.tsx            # Primary analytics and pipeline metrics
│   │   ├── DashboardView.tsx            # Legacy/compatibility metrics view
│   │   ├── CompareView.tsx              # Side-by-side job comparison
│   │   ├── ProfileView.tsx              # User profile & settings
│   │   └── *.test.tsx                   # View tests (14+ test files)
│   │
│   ├── components/                      # Reusable UI components
│   │   ├── FilterToolbar.tsx            # Filter UI
│   │   ├── JobForm.tsx                  # Job edit/create form
│   │   ├── JobModal.tsx                 # Job detail modal
│   │   ├── Pagination.tsx               # Table pagination
│   │   ├── TaskCard.tsx                 # Task display component
│   │   ├── Sparkline.tsx                # Simple trend sparklines
│   │   ├── ErrorBoundary.tsx            # Error handling (v2.7.0)
│   │   │
│   │   ├── kanban/                      # Kanban view components
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── KanbanCard.tsx
│   │   │   └── *.test.tsx
│   │   │
│   │   └── *.test.tsx                   # Component tests (25+ test files)
│   │
│   ├── features/                        # Feature modules (A1-A5)
│   │   ├── analytics/                   # A1: Pipeline Intelligence
│   │   │   ├── pipelineMetrics.ts
│   │   │   ├── timeInStage.ts
│   │   │   ├── AnalyticsView.tsx
│   │   │   └── *.test.ts
│   │   │
│   │   ├── tasks/                       # A2: Task Management
│   │   │   ├── taskFilters.ts
│   │   │   ├── TodayView.tsx
│   │   │   ├── ThisWeekView.tsx
│   │   │   └── *.test.tsx
│   │   │
│   │   ├── scoring/                     # A3: Quality Scoring
│   │   │   ├── jobScoring.ts
│   │   │   ├── scoring.ts
│   │   │   └── *.test.ts
│   │   │
│   │   ├── search/                      # A4: Search & Saved Views
│   │   │   ├── searchJobs.ts
│   │   │   ├── useSavedViews.ts
│   │   │   ├── HighlightedText.tsx
│   │   │   └── *.test.ts
│   │   │
│   │   └── backup/                      # A5: Backup & Restore
│   │       ├── backupService.ts
│   │       ├── backupScheduler.ts
│   │       ├── restoreDiff.ts
│   │       └── *.test.ts
│   │
│   ├── hooks/                           # Custom React hooks
│   │   ├── State Management:
│   │   │   ├── useAppState.ts           # Jobs, hydration, save status (v2.7.0)
│   │   │   ├── useSelectionState.ts     # Selection tracking (v2.7.0)
│   │   │   ├── useJobFiltering.ts       # Filter application
│   │   │   ├── useSortAndPagination.ts  # Sort & pagination state
│   │   │   ├── useJobGrouping.ts        # Job grouping logic
│   │   │   ├── useViewState.ts          # View navigation
│   │   │   └── useFilterState.ts        # Filter UI state
│   │   │
│   │   ├── Form & Input:
│   │   │   ├── useJobForm.ts            # Job form state
│   │   │   ├── useDebouncedValue.ts     # Search debouncing (A4)
│   │   │   └── useImportExportState.ts  # Import/export state
│   │   │
│   │   ├── Data Operations:
│   │   │   ├── useJobPersistence.ts     # Storage hydration & save
│   │   │   ├── useImportExport.ts       # Import/export operations (v2.7.0)
│   │   │   ├── useTableData.ts          # Composition hook
│   │   │   └── useJobOperations.ts      # CRUD operations
│   │   │
│   │   ├── Interactive Features:
│   │   │   ├── useAutoBackup.ts         # Auto-backup scheduling (A5)
│   │   │   ├── useDragDropZone.ts       # Drag-drop interactions
│   │   │   ├── useNotifications.ts      # Toast queue management
│   │   │   └── useCompareJobs.ts        # Comparison state
│   │   │
│   │   ├── Utilities:
│   │   │   ├── useUndoStack.ts          # Undo/redo operations
│   │   │   ├── usePageReset.ts          # Reset pagination (v2.7.0)
│   │   │   └── useAppActions.ts         # Common app actions
│   │   │
│   │   └── *.test.ts                    # Hook tests (24+ test files)
│   │
│   ├── services/                        # Business logic layer
│   │   ├── jobService.ts                # Job CRUD operations
│   │   ├── storageService.ts            # Storage orchestration (v2.7.0)
│   │   ├── importExportService.ts       # Import/export orchestration (v2.7.0)
│   │   ├── csvParser.ts                 # CSV parsing (v2.7.0)
│   │   ├── jsonExport.ts                # JSON export (v2.7.0)
│   │   ├── jobMerger.ts                 # Job merge logic (v2.7.0)
│   │   ├── apiClient.ts                 # Fetch wrapper (v2.7.0)
│   │   ├── aiScoringService.ts          # AI scoring integration
│   │   ├── resumeParsingService.ts      # Resume parsing
│   │   ├── backupService.ts             # Backup operations
│   │   ├── backupScheduler.ts           # Backup scheduling
│   │   └── *.test.ts                    # Service tests (8+ test files)
│   │
│   ├── contexts/                        # React Context providers
│   │   └── TableContext.tsx             # Table state context (v2.7.0)
│   │
│   ├── utils/                           # Utility functions
│   │   ├── dateUtils.ts                 # Date formatting & calculations
│   │   ├── dateCalendarUtils.ts         # Calendar date math
│   │   ├── stringUtils.ts               # String manipulation
│   │   ├── salaryUtils.ts               # Salary parsing & formatting
│   │   ├── downloadUtils.ts             # File download helpers
│   │   ├── dragDataUtils.ts             # Drag-drop data handling
│   │   ├── a11yUtils.ts                 # Accessibility helpers
│   │   └── *.test.ts                    # Utility tests (7+ test files)
│   │
│   ├── types/                           # TypeScript type definitions
│   │   ├── domain.ts                    # Core domain types (Job, etc.)
│   │   ├── componentProps.ts            # Component prop interfaces
│   │   └── *.test.ts                    # Type tests
│   │
│   ├── storage.ts                       # Storage abstraction (legacy, refactor in v2.7.0)
│   ├── storage.test.ts                  # Storage tests
│   ├── fallbackStorage.ts               # localStorage fallback
│   ├── jobsApi.ts                       # Async data layer (API client wrapper)
│   ├── exportImport.ts                  # Import/export (legacy, refactor in v2.7.0)
│   ├── exportImport.test.ts             # Export/import tests
│   ├── domain.ts                        # Core domain logic
│   ├── domain.test.ts                   # Domain tests
│   ├── notifications.ts                 # Notification service
│   │
│   ├── test/                            # Test utilities & setup
│   │   └── setup.ts                     # Test environment setup
│   │
│   └── __tests__/                       # Integration tests
│       ├── integration/
│       │   └── *.test.ts                # E2E workflow tests
│
├── e2e/                                 # Playwright E2E tests
│   ├── fixtures/
│   ├── pages/
│   └── *.spec.ts                        # 5+ end-to-end tests
│
├── docs/                                # Documentation
│   ├── COMPREHENSIVE_ROADMAP.md         # Feature roadmap v2.3-v2.6
│   ├── REFACTORING_ANALYSIS.md          # Code quality opportunities
│   ├── REFACTORING_STATUS.md            # Gap analysis vs v2.6.0
│   ├── V2_7_0_RELEASE_PLAN.md           # Next release plan
│   ├── NEXT_STEPS.md                    # This document
│   └── DAEMON_SETUP.md                  # Backend setup guide
│
├── public/                              # Static assets
├── sample-data/                         # Import test data
├── scripts/                             # Build & utility scripts
│   ├── generate-version.js              # Version generation
│
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── vite.config.ts                       # Vite build config
├── vitest.config.ts                     # Vitest test config
├── playwright.config.ts                 # Playwright config
└── eslint.config.js                     # ESLint config
```

---

## Key Architectural Patterns

### 1. Custom Hooks for State Management

**Pattern:** Extract reusable state and side effect logic into hooks

```typescript
// Example: useJobFiltering combines logic from multiple concerns
export function useJobFiltering(jobs: Job[], filters: FilterState) {
  const filteredJobs = useMemo(() => {
    // Apply all filters to jobs
  }, [jobs, filters])
  
  const overdueCount = useMemo(() => {
    // Count overdue items
  }, [filteredJobs])
  
  return { filteredJobs, overdueCount }
}
```

**Benefits:**
- Reusable across components
- Testable in isolation
- Clear dependencies via effect arrays
- Composition-friendly

**Files:** 24+ hooks, all tested

---

### 2. Service Layer for Business Logic

**Pattern:** Encapsulate domain logic in focused service modules

```typescript
// jobService handles all Job-related CRUD
export const jobService = {
  createJob: (job: JobDraft) => Job,
  updateJob: (jobs: Job[], id: string, updates: Partial<Job>) => Job[],
  deleteJob: (jobs: Job[], id: string) => Job[],
  updateJobStatus: (jobs: Job[], id: string, status: JobStatus) => Job[]
}
```

**Benefits:**
- Centralized business rules
- Single point of change for logic
- Easy to test
- Type-safe operations

**Files:** src/services/ (7+ services)

---

### 3. Feature Modules (A1-A5)

**Pattern:** Group related features into feature directories with their own hooks, components, and tests

```
src/features/
  ├── analytics/           # A1: Pipeline metrics
  ├── tasks/               # A2: Task management
  ├── scoring/             # A3: Quality scoring
  ├── search/              # A4: Search & saved views
  └── backup/              # A5: Backup & restore
```

**Benefits:**
- Logical grouping of related code
- Easy to disable/enable features
- Clear ownership and responsibility
- Scalable structure for new features

**Current Status:** All 5 features fully implemented and tested

---

### 4. React Context for Shared State

**Pattern:** Use Context API for deeply-nested component state (v2.7.0)

```typescript
// TableContext reduces prop drilling from 22 → 10
<TableProvider jobs={jobs} selectedIds={selectedIds} onEdit={onEdit}>
  <TableView sortColumn="name" />
  {/* TableView uses useTableContext() instead of receiving all props */}
</TableProvider>
```

**Benefits:**
- Eliminates prop drilling
- Cleaner component APIs
- Better performance (contextual rendering)

**Current Adoption:** TableContext (v2.7.0 plan)

---

### 5. Component Organization

**Pattern:** Group related components by feature/concern

```
src/components/
  ├── kanban/              # Kanban-specific components
  ├── feedback/            # User feedback (Toast, etc.)
  └── *.tsx                # General UI components
```

**Benefits:**
- Clear structure
- Easy to find related code
- Scalable for large component libraries

**Current Status:** Kanban components grouped (v2.7.0 refactoring)

---

## State Management

### App-Level State Flow

```
┌─────────────────────────────────────────┐
│         useAppState Hook                │
│  - jobs (Job[])                         │
│  - isStorageHydrated (boolean)          │
│  - saveStatus ('idle' | 'pending')      │
└──────────┬──────────────────────────────┘
           │
           ├─→ useJobFiltering
           │   (filtered, overdueCount)
           │
           ├─→ useSortAndPagination
           │   (sorted, paginated)
           │
           ├─→ useSelectionState
           │   (selectedIds, checkboxState)
           │
           └─→ useTableData
               (composed view)
```

### Persistence Flow

```
User Action
    ↓
State Update (setJobs)
    ↓
useJobPersistence triggers
    ↓
Storage Service (abstract layer)
    ↓
localStorage / API Fallback
```

---

## Testing Architecture

### Test Coverage by Layer

| Layer | Type | Count | Status |
|-------|------|-------|--------|
| **Views** | Component tests | 14+ | ✅ Complete |
| **Components** | UI tests | 25+ | ⚠️ Partial (10 left) |
| **Hooks** | Logic tests | 24+ | ✅ Complete |
| **Services** | Service tests | 8+ | ✅ Complete |
| **Utils** | Utility tests | 7+ | ✅ Complete |
| **Domain** | Type tests | 1 | ✅ Complete |
| **Integration** | E2E workflow tests | 5+ | ⚠️ Baseline |
| **Backend** | API tests | 2 | ✅ Complete |

**Total:** 657 tests across 73 files, 100% passing

### Test Pyramid

```
           ╱╲
          ╱  ╲
         ╱ E2E ╲        5-10 tests
        ╱--------╲       (slow, comprehensive)
      ╱Integration╲   20-30 tests
    ╱--------------╲  (moderate, realistic)
   ╱   Unit Tests   ╲  600+ tests
  ╱------------------╲ (fast, focused)
 ╱--------------------╲
```

---

## Data Flow

### Import/Export Workflow

```
CSV/JSON File
    ↓
UI: File Input
    ↓
useImportExport Hook
    ↓
importExportService (orchestrator)
    ├─→ csvParser / jsonExport
    ├─→ jobMerger (append/upsert/replace)
    └─→ validation
    ↓
setJobs (state update)
    ↓
useJobPersistence
    ↓
Storage (localStorage/API)
```

### Search Workflow (A4)

```
User Types Search Query
    ↓
useDebouncedValue (300ms debounce)
    ↓
searchJobs Function
    ├─→ Multi-field matching
    ├─→ AND-based logic
    └─→ Result highlighting
    ↓
<HighlightedText /> Component
    ├─→ Token extraction
    ├─→ Regex escaping
    └─→ CSS class application
```

### Safari Plugin Capture Workflow (v1.0)

**New in v1.0:** Safari Plugin enables direct job capture from any webpage, eliminating fragile web scraping.

```
User clicks Safari Plugin on job posting
    ↓
Content Script extracts page metadata
    ↓
Popup pre-fills company, title, salary (if detected)
    ↓
User fills form and clicks "Save & Close"
    ↓
Popup sends CAPTURE_JOB message to Service Worker
    ↓
Service Worker creates PluginQueueItem (with UUID, timestamp)
    ↓
Persists to browser.storage.local key: `job-tracker-plugin-queue`
    ↓
[If job-tracker is open] → localStorage change event fires
[If backend API configured] → Service Worker POSTs to /api/jobs/from-plugin
    ↓
job-tracker observes storage change via usePluginQueue hook
    ↓
Converts JobCapture → Job (validates, assigns defaults)
    ↓
jobService.createJob() adds to jobs array
    ↓
useJobPersistence persists to localStorage/API
    ↓
UI updates to show new job
    ↓
Queue cleared from plugin storage
```

**Integration Point:** `src/hooks/usePluginQueue.ts` — monitors `job-tracker-plugin-queue` for changes

---

## Dependency Management

### External Dependencies (Key)

| Package | Purpose | Version |
|---------|---------|---------|
| React | UI library | 18.x |
| TypeScript | Type safety | 5.x |
| Vitest | Test runner | 4.x |
| Vite | Build tool | 5.x |
| Playwright | E2E testing | Latest |

### No External State Management
- ✅ **Why:** React hooks sufficient for current app complexity
- ✅ **Benefits:** Smaller bundle, faster learning curve, fewer dependencies
- ⚠️ **Future:** Consider Redux/Zustand if complexity increases significantly

---

## Performance Considerations

### Current Approach
- **Lazy loading:** Not yet implemented (bundle is small)
- **Code splitting:** Not yet implemented
- **Memoization:** Established patterns but not pervasive

### v2.8.0 Plans
- Establish performance baselines
- Implement memoization where profiling indicates need
- Consider code splitting for large job lists (1000+)
- Optimize re-renders with React DevTools Profiler

---

## Safari Plugin Integration (v1.0 planning)

### Overview

The Safari Plugin (v1.0, Q2 2026) enables users to capture job details directly from web browsers without relying on fragile web scraping. The plugin stores captures in a shared localStorage queue that job-tracker imports automatically.

### Architecture

- **Plugin Repository:** Separate repo or `safari-plugin/` subdirectory
- **Plugin Storage:** `browser.storage.local` (plugin namespace, ~10MB quota)
- **Queue Key:** `job-tracker-plugin-queue` (shared between plugin and app)
- **Optional Backend Sync:** `POST /api/jobs/from-plugin` (if backend API configured)

**Full Details:** See [SAFARI_PLUGIN_ARCHITECTURE.md](./SAFARI_PLUGIN_ARCHITECTURE.md)

### Integration Points

1. **New Hook: `usePluginQueue`** (`src/hooks/usePluginQueue.ts`)
   - Monitors localStorage for `job-tracker-plugin-queue` changes
   - Auto-imports captured jobs on app load
   - Shows toast notification on successful import
   - Clears queue after import

2. **Existing Services** (No changes required)
   - `jobService.createJob()` handles job creation from captures
   - `storageService` persists imported jobs
   - `domain.ts` validates job schema

3. **Optional Backend Endpoint** (`POST /api/jobs/from-plugin`)
   - Stores plugin capture in backend (if API key configured)
   - Rate limiting and workspace scoping
   - Returns created `jobId` or validation error

### Data Model

**JobCapture** (from plugin):
```typescript
{
  company: string           // Required
  title: string             // Required
  url: string               // Required (valid URL)
  notes?: string            // Optional
  salary?: string           // Optional (extracted if available)
  sourcePageTitle?: string  // Page title where captured
  capturedAt: number        // Timestamp (ms)
}
```

**PluginQueueItem** (internal):
```typescript
{
  id: string                      // UUID
  job: JobCapture                 // The captured data
  syncStatus: 'pending' | 'synced' | 'failed'
  syncAttempts: number
  lastSyncError?: string
}
```

### Workflow

1. User captures job in Safari Plugin (quick form or sidebar)
2. Plugin service worker adds `PluginQueueItem` to queue in `browser.storage.local`
3. localStorage change event fires → `usePluginQueue` hook detects change
4. Hook converts `JobCapture` → `Job` and calls `jobService.createJob()`
5. Job appears in app UI
6. Queue is cleared from plugin storage
7. *Optional:* If backend API configured, service worker POSTs to backend separately

### Supported Job Sites (MVP)

- LinkedIn (95%+ pre-fill accuracy)
- Indeed (90%+ pre-fill accuracy)
- Glassdoor (85%+ pre-fill accuracy)
- Generic fallback (manual entry)

See [SAFARI_PLUGIN_RELEASE_PLAN.md](./SAFARI_PLUGIN_RELEASE_PLAN.md) for full scope and timeline.

---

## Migration from v2.6.0 to v2.7.0

v2.7.0 includes significant architectural refactoring with **zero user-facing changes**:

### Breaking Changes (Internal Only)
None. All changes are refactoring/optimization.

### File Moves (v2.7.0 Refactoring)
```
src/KanbanBoard.tsx → src/components/kanban/KanbanBoard.tsx
src/KanbanCard.tsx → src/components/kanban/KanbanCard.tsx
src/KanbanColumn.tsx → src/components/kanban/KanbanColumn.tsx
src/Toast.tsx → src/components/feedback/Toast.tsx
```

### File Creations (v2.7.0 Refactoring)
```
src/hooks/useAppState.ts
src/hooks/useSelectionState.ts
src/hooks/usePageReset.ts
src/contexts/TableContext.tsx
src/services/storageService.ts (refactor from storage.ts)
src/services/csvParser.ts (refactor from exportImport.ts)
src/services/jsonExport.ts (refactor from exportImport.ts)
src/services/jobMerger.ts (refactor from exportImport.ts)
src/components/ErrorBoundary.tsx
```

### Backward Compatibility
- ✅ No data format changes
- ✅ No API changes
- ✅ No import/export format changes
- ✅ All existing exports/imports compatible

---

## Scalability & Extension Points

### Adding a New Feature

1. **Create feature directory:**
   ```
   src/features/myFeature/
     ├── myFeature.ts (business logic)
     ├── MyFeatureView.tsx (component)
     └── *.test.ts (tests)
   ```

2. **Add hooks if needed:**
   ```
   src/hooks/useMyFeatureState.ts
   ```

3. **Integrate into App.tsx:**
   ```typescript
   const myFeatureState = useMyFeatureState()
   if (view === 'myFeature') return <MyFeatureView {...myFeatureState} />
   ```

4. **Test:**
   ```
   npm run test
   ```

### Adding a New View

1. Create in src/views/
2. Add route in App.tsx view switching
3. Add tests matching view complexity
4. Update navigation UI

### Adding a New Utility

1. Create in src/utils/
2. Add corresponding .test.ts
3. Test coverage ≥80%

### Integrating Browser Plugins

To add browser plugin support (Safari, Chrome, Firefox):

1. **Create plugin repository or subdirectory:**
   ```
   safari-plugin/  (or separate repo)
   ├── src/                    # Core TypeScript
   ├── Resources/              # Manifest & UI
   ├── tests/                  # Tests
   ├── docs/                   # Plugin-specific docs
   └── package.json
   ```

2. **Define message protocol:**
   - Create shared types in `src/types/plugin.ts` (or export from plugin repo)
   - Document all message types (CAPTURE_JOB, SYNC, GET_SETTINGS, etc.)

3. **Add plugin integration hook in job-tracker:**
   ```
   src/hooks/usePluginQueue.ts
     - Monitor dedicated localStorage key
     - Convert PluginQueueItem → Job
     - Call jobService.createJob()
   ```

4. **Optional: Add backend endpoint:**
   ```
   POST /api/jobs/from-plugin
     - Accept JobCapture + workspaceId
     - Authenticate with API key
     - Rate limit per user/key
   ```

5. **Document in:**
   - Plugin repo: DEVELOPMENT.md (architecture, how to extend to new sites)
   - job-tracker repo: ARCHITECTURE.md (integration points)
   - Both repos: README.md (cross-link)

**Example:** See [Safari Plugin Architecture](./SAFARI_PLUGIN_ARCHITECTURE.md) for complete reference implementation.

---

## Documentation

### Code Documentation
- [COMPREHENSIVE_ROADMAP.md](./COMPREHENSIVE_ROADMAP.md) - Feature history & roadmap
- [V2_7_0_RELEASE_PLAN.md](./V2_7_0_RELEASE_PLAN.md) - v2.7.0 release details
- [V2_8_0_RELEASE_PLAN.md](./V2_8_0_RELEASE_PLAN.md) - v2.8.0 release details (workspace separation)
- [REFACTORING_ANALYSIS.md](./REFACTORING_ANALYSIS.md) - Code quality opportunities
- [SAFARI_PLUGIN_ARCHITECTURE.md](./SAFARI_PLUGIN_ARCHITECTURE.md) - Safari Plugin design (v1.0 planning)
- [SAFARI_PLUGIN_RELEASE_PLAN.md](./SAFARI_PLUGIN_RELEASE_PLAN.md) - Safari Plugin release timeline
- Individual file READMEs (src/services/README.md, etc. - in progress)

### User Documentation
- [README.md](../README.md) - Getting started, features, setup

---

## Known Limitations & Future Improvements

### Current Limitations
- ⚠️ App.tsx is still ~380 lines; planned v2.7.0 decomposition is not complete
- ⚠️ 10 components without tests (low-priority UI components)
- ⚠️ E2E test coverage only covers happy paths
- ⚠️ No performance optimization done yet (belt on bundle size is small)

### v2.7.0 Improvements
- ✅ ErrorBoundary component added and tested
- ✅ TableViewContext extracted and covered by tests
- ⚠️ App.tsx decomposition into planned hooks is still pending
- ⚠️ Service layer finalization is only partially complete

### v2.8.0 Improvements (In Progress)
- 🔮 Performance optimization (memoization, code splitting)
- 🔮 Accessibility audit and remediation (WCAG 2.1 AA)
- 🔮 Multi-workspace support (separate job tracks per workspace)
- 🔮 Advanced filtering and workflow enhancements

### v1.0+ Opportunities (Safari Plugin & Beyond)
- 🔮 Safari Plugin browser extension (v1.0, Q2 2026)
- 🔮 Chrome/Firefox plugin variants (v1.1+)
- 🔮 Mobile-responsive design enhancements
- 🔮 Dark mode
- 🔮 Team collaboration features (post-auth)
- 🔮 Advanced AI integration (interview prep, resume matching)

---

## Architecture Decision Records (ADRs)

### ADR-001: React Hooks for State Management
**Decision:** Use React hooks instead of external state management  
**Rationale:** Sufficient for current complexity, avoids dependency bloat  
**Trade-offs:** May need Redux/Zustand if app grows significantly  
**Status:** ACCEPTED (revisit at 2000+ LOC)

---

### ADR-002: Feature Modules (A1-A5)
**Decision:** Organize features into feature directories  
**Rationale:** Logical grouping, scalability, clear ownership  
**Trade-offs:** Slightly larger initial structure  
**Status:** ACCEPTED (proven pattern)

---

### ADR-003: Service Layer for Business Logic
**Decision:** Isolate business logic in service modules
**Rationale:** Testability, reusability, separation of concerns
**Trade-offs:** Extra layer of indirection
**Status:** ACCEPTED (reduces coupling)

---

### ADR-004: Browser Plugin Integration via Shared localStorage
**Decision:** Accept job captures from browser plugins via shared localStorage queue
**Rationale:** Works without authentication, enables offline capture, simple to implement
**Trade-offs:** Plugins and app must run on same machine (for v1.0); no multi-device sync
**Status:** ACCEPTED (v1.0 planning) — revisit for cloud sync in future versions

---

### ADR-005: Optional Backend API for Plugin Sync
**Decision:** Backend API endpoint for plugin sync is optional, not required for MVP
**Rationale:** localStorage sync is sufficient for single-machine use; backend adds complexity
**Trade-offs:** No multi-device sync until cloud backend is added
**Status:** ACCEPTED (v1.0) — promote to required in v2.0+ if cloud sync needed

---

## Getting Help

### Understanding the Codebase
1. Start with [COMPREHENSIVE_ROADMAP.md](./COMPREHENSIVE_ROADMAP.md) to understand features
2. Review this ARCHITECTURE.md for structure
3. For Safari Plugin architecture, see [SAFARI_PLUGIN_ARCHITECTURE.md](./SAFARI_PLUGIN_ARCHITECTURE.md)
4. Look at specific feature module README
5. Check tests for usage examples

### Adding a Feature
1. See "Scalability & Extension Points" above
2. Follow established patterns (hooks, services, tests)
3. Maintain test coverage ≥80%
4. Update documentation

### Adding a Browser Plugin
1. See "Integrating Browser Plugins" under "Scalability & Extension Points"
2. Review [SAFARI_PLUGIN_ARCHITECTURE.md](./SAFARI_PLUGIN_ARCHITECTURE.md) for reference implementation
3. Define message protocol for capturing jobs
4. Implement `usePluginQueue` hook to import queued jobs
5. Add optional backend endpoint if needed

### Debugging an Issue
1. Check if related hook test passes
2. Run component test in isolation
3. Check storage/persistence layer if data-related
4. Use React DevTools Profiler if performance issue

---

## Quick Reference

### Run Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test:run` - Run all tests once
- `npm run test` - Run tests in watch mode
- `npm run e2e` - Run Playwright tests
- `npm run lint` - Check code quality

### Key Files to Know
- `src/App.tsx` - Main orchestrator
- `src/domain.ts` - Core types
- `src/hooks/` - State management
- `src/services/` - Business logic
- `src/storage.ts` - Persistence abstraction
- `src/types/componentProps.ts` - Component interfaces

---

**Last Updated:** March 14, 2026  
**Version:** v3.0.0  
**Maintained By:** Development Team

