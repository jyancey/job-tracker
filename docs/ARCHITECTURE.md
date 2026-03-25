# Job Tracker - Architecture Overview

**Updated:** March 25, 2026  
**Release Baseline:** v2.7.4  
**Validation Snapshot:** 79 test files, 684 passing tests, 10 passing Playwright tests

## System Overview

Job Tracker is a local-first Next.js 16 application with a React 19 client, App Router route handlers, and a file-backed SQLite database.

The architecture is intentionally split across three layers:

1. Browser UI and view orchestration
2. Route handlers and backend adapters
3. SQLite persistence and file-system-backed operational workflows

The app also supports a browser-only fallback mode for job data when the backend API is unavailable.

## Runtime Model

### Frontend Runtime

- The browser app is rendered through `app/page.tsx` and `app/AppClient.tsx`
- `src/App.tsx` is a thin shell around `useAppContentModel()` and `AppShellView`
- Most business logic lives in hooks, features, and service modules under `src/`

### Backend Runtime

- API routes live under `app/api/`
- `backend/jobStore.ts` is the lazy-init entry point used by the route handlers
- `backend/sqliteStore.ts` is a compatibility facade over the split repository modules in `backend/sqlite/`
- The SQLite file defaults to `data/job-tracker.sqlite` unless `JOB_TRACKER_DB_PATH` is set

### Production Packaging

- Production builds use Next.js standalone output
- Launchd helper scripts under `scripts/launchd/` support macOS daemon-style startup
- Native module recovery for `better-sqlite3` is handled by the packaging/startup scripts

## Primary Data Flows

### Jobs

1. UI state is composed in `useAppContentModel()`
2. Job actions call service/storage logic in `src/services/` and `src/storage/`
3. The frontend uses `/api/jobs`
4. `app/api/jobs/route.ts` calls `backend/jobStore.ts`
5. `backend/jobStore.ts` uses the SQLite facade in `backend/sqliteStore.ts`
6. The facade delegates to the repository modules in `backend/sqlite/`

### User Profile and AI Settings

1. The UI reads and writes profile/settings through browser-side storage helpers
2. API routes under `app/api/profile/` and `app/api/config/` persist the canonical backend state
3. SQLite persistence is handled by `backend/sqlite/userProfileRepository.ts` and `backend/sqlite/aiConfigRepository.ts`

### Backup and Restore

1. Backup scheduling and restore logic lives in `src/features/backup/`
2. Restore operations are surfaced through the settings screen
3. Restore diff previews and merge/replace flows are handled entirely in the feature layer before state is committed

## Current Project Structure

```text
app/
  AppClient.tsx              # Client bridge into src/App
  api/                       # Route handlers for jobs, profile, config, and database ops
  layout.tsx                 # Root metadata and HTML shell
  page.tsx                   # App Router entry page

backend/
  jobStore.ts                # Lazy-init store entry point for API routes
  jobValidation.ts           # Backend payload validation
  sqliteStore.ts             # Compatibility facade
  sqlite/
    db.ts                    # DB opening, path handling, connection config
    schema.ts                # Table creation and migrations
    jobsRepository.ts        # Job persistence
    userProfileRepository.ts # User profile persistence
    aiConfigRepository.ts    # AI config persistence

src/
  components/                # Reusable UI components
  features/                  # Analytics, backup, saved views, search, tasks
  hooks/                     # State and behavior composition hooks
  services/                  # Business logic modules
  storage/                   # API adapters and fallback storage helpers
  views/                     # Page-level views
  views/settings/            # Settings sub-sections
  views/table/               # Table subcomponents
```

## Frontend Architecture

### View Composition

- `AppShellView` handles high-level layout and view switching
- Page-level views live under `src/views/`
- Shared UI elements live under `src/components/`
- Settings and table rendering use extracted subdirectories to keep page files small

### State Strategy

There is no global state library.

The dominant pattern is:

- keep app composition in `useAppContentModel()`
- keep feature-specific logic in focused hooks
- keep pure calculations in services/features/utils
- keep transient UI state inside the smallest component/section that owns it

### Feature Modules

Feature work that used to be tracked as roadmap items is now implemented in dedicated modules:

- analytics: `src/features/analytics/`
- tasks: `src/features/tasks/`
- search: `src/features/search/`
- saved views: `src/features/savedViews/`
- backup and restore: `src/features/backup/`

## Backend Architecture

### SQLite Layer

The SQLite backend is intentionally split by concern:

- `db.ts` handles connection lifecycle and DB path resolution
- `schema.ts` handles table creation and migrations
- `jobsRepository.ts` handles the main job store
- `userProfileRepository.ts` handles persisted profile state
- `aiConfigRepository.ts` handles persisted AI config state

This keeps `backend/sqliteStore.ts` stable for existing import sites while allowing the implementation to evolve.

### Validation and API Surface

- Route handlers validate and normalize request data before persistence
- Backend job validation is centralized in `backend/jobValidation.ts`
- The repository layer is tested directly, not only through higher-level route flows

## Testing and Delivery

### Automated Validation

- Unit, component, hook, service, and backend repository tests run under Vitest
- End-to-end flows run under Playwright
- The Playwright config starts the app with `pnpm dev`

### CI/CD

- Gitea workflows under `.gitea/workflows/` run install, lint, test, build, and packaging steps
- `pnpm` is the expected package manager in local and CI environments
- The repo includes a preinstall guard to reject non-pnpm installs

## Current Gaps

The architecture is in a much better state than the older roadmap documents imply, but a few areas remain worth tracking:

- broader Playwright coverage for bulk ops, import/export, and drag-drop
- keeping live docs in sync after structural refactors
- deciding the next product wave instead of carrying forward stale historical plans

## Documentation Notes

This file and `docs/planning/NEXT_STEPS.md` are the live documentation for current structure and status.

Older planning docs and release plans remain useful as history, but they should not be treated as the current architecture source of truth.
