# Job Tracker - Architecture Overview

**Version:** v2.6.0  
**Last Updated:** March 8, 2026  
**Status:** Production-Ready with 646 Tests

---

## high-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                     │
│                      (React + TypeScript)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Presentation Layer                │   │
│  │  Views: TableView, CalendarView, DashboardView, etc. │   │
│  │  Components: JobForm, FilterToolbar, KanbanBoard, ...│   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Hooks & State Management          │   │
│  │  App State: useAppState, useJobFiltering             │   │
│  │  Selection: useSelectionState, useJobSelection       │   │
│  │  Forms: useJobForm, useJobPersistence                │   │
│  │  Context: TableContext, ErrorBoundary                │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Service Layer                       │   │
│  │  jobService, importExportService, storageService     │   │
│  │  asyncDataLayer, aiScoringService, backupService     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Domain & Type Layer                     │   │
│  │  Job, JobDraft, JobStatus, domain constants          │   │
│  │  Type definitions and validation                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Storage & Persistence                   │   │
│  │  localStorage, fallbackStorage, jobsApi.js           │   │
│  │  sqliteStore (Node backend alternative)              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

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
│   │   ├── DashboardView.tsx            # Analytics & metrics
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

**Total:** 646 tests across 72 files, 100% passing

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

---

## Documentation

### Code Documentation
- [COMPREHENSIVE_ROADMAP.md](./COMPREHENSIVE_ROADMAP.md) - Feature history & roadmap
- [V2_7_0_RELEASE_PLAN.md](./V2_7_0_RELEASE_PLAN.md) - Next release details
- [REFACTORING_ANALYSIS.md](./REFACTORING_ANALYSIS.md) - Code quality opportunities
- Individual file READMEs (src/services/README.md, etc. - in progress)

### User Documentation
- [README.md](../README.md) - Getting started, features, setup

---

## Known Limitations & Future Improvements

### Current Limitations
- ⚠️ App.tsx still ~250 lines (large but manageable, post-v2.7.0 refactoring)
- ⚠️ 10 components without tests (low-priority UI components)
- ⚠️ E2E test coverage only covers happy paths
- ⚠️ No performance optimization done yet (belt on bundle size is small)

### v2.7.0 Improvements
- ✅ App.tsx decomposed into 4 focused hooks
- ✅ TableView prop drilling eliminated via Context
- ✅ Service layer finalized and organized
- ✅ Remaining component tests added

### v2.8.0+ Opportunities
- 🔮 Performance optimization (memoization, code splitting)
- 🔮 Mobile-responsive design enhancements
- 🔮 Dark mode
- 🔮 Multi-workspace support
- 🔮 Team collaboration features
- 🔮 Advanced AI integration

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

## Getting Help

### Understanding the Codebase
1. Start with [COMPREHENSIVE_ROADMAP.md](./COMPREHENSIVE_ROADMAP.md) to understand features
2. Review this ARCHITECTURE.md for structure
3. Look at specific feature module README
4. Check tests for usage examples

### Adding a Feature
1. See "Scalability & Extension Points" above
2. Follow established patterns (hooks, services, tests)
3. Maintain test coverage ≥80%
4. Update documentation

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

**Last Updated:** March 8, 2026  
**Version:** v2.6.0  
**Maintained By:** Development Team

