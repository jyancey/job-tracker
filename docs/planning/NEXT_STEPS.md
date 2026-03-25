# Job Tracker - Next Steps

**Updated:** March 25, 2026  
**Release Baseline:** v2.7.4  
**Branch State:** Post-v2.7.4 maintenance and architecture cleanup

## Validation Snapshot

- `pnpm test:run` passes with 79 test files and 684 tests
- `pnpm test:e2e` passes with 10 Playwright tests
- `pnpm` is now the required package manager for local development, CI, and E2E startup

## Current State

### Product Features

The current app already includes the feature set that earlier roadmap documents treated as future work:

- Pipeline analytics with conversion metrics, time-in-stage calculations, drill-down navigation, analytics CSV export, and stuck-job modal workflows
- Today and This Week task views with priority-aware task filtering, snooze, and completion flows
- Saved views for common filter presets
- Full-text search with debounce and highlighted matches
- Backup and restore workflows with diff preview, restore modes, and backup scheduling
- AI scoring, resume parsing, profile persistence, and AI settings persistence

### Architecture Baseline

The codebase has moved beyond the earlier v2.7.0 roadmap:

- `App.tsx` is now a thin composition layer around `useAppContentModel()` and `AppShellView`
- Table rendering is split into context-driven subcomponents under `src/views/table/`
- Settings are decomposed into focused sections under `src/views/settings/`
- SQLite responsibilities are split into focused backend repository modules under `backend/sqlite/`
- Frontend storage, analytics, backup, search, and saved view logic are isolated into feature/service modules
- The test suite covers the extracted backend repositories directly, not only the compatibility facade

### Documentation Boundaries

Use this file as the live planning/status document.

Treat these as historical reference material, not live status:

- `docs/planning/COMPREHENSIVE_ROADMAP.md`
- release notes under `docs/releases/`

## Recently Completed

### Settings Refactor

- `src/views/SettingsView.tsx` now acts as the page shell
- Database setup, AI settings, backup scheduling, and restore workflows are split into focused sections
- Shared AI configuration UI now lives in `src/components/AIConfigForm.tsx`

### SQLite Backend Refactor

- `backend/sqliteStore.ts` is now a compatibility facade
- Connection setup, schema creation, job persistence, user profile persistence, and AI config persistence are split into focused modules under `backend/sqlite/`
- Direct repository tests now exist for the extracted user profile and AI config modules

### Test Suite Cleanup

- Stale tests were updated to match current types and component contracts
- The `StatusCell` test harness now renders in a real table context
- Full unit/integration and Playwright E2E validation is passing on the current working tree

### Tooling and Repo Hygiene

- `pnpm` replaced `npm` in package scripts, CI workflows, Playwright startup, and developer-facing documentation
- `package-lock.json` was removed and `pnpm-lock.yaml` was added
- Unused scaffold assets were removed from `src/assets/`

## Open Gaps

### E2E Coverage Expansion

The current E2E suite covers smoke, CRUD, filter/sort, navigation, analytics drill-down, stuck-job modal workflows, and profile/settings persistence. The most obvious remaining integration gaps are:

- bulk operations
- import/export flows
- drag-drop regression coverage

### Documentation Hygiene

The live docs are now being resynced, but the repo still contains older planning and release documents with outdated counts and structure notes. Those should remain archived unless they are intentionally rewritten as historical summaries.

### Product Direction

There is no concrete evidence in the repo yet of post-release user feedback synthesis. Before starting another large feature wave, it would be sensible to decide whether the next priority is:

- workflow polish and regression hardening
- a new product track from the v2.8 planning documents
- deployment and packaging hardening

## Recommended Next Work

### Priority 1: Fill the E2E Gaps

Add Playwright coverage for:

- bulk select and bulk delete/update flows
- JSON export and re-import verification
- drag-drop status changes across the Kanban board

### Priority 2: Keep the Live Docs Small and Accurate

When structure changes land:

- update `README.md`
- update `docs/ARCHITECTURE.md`
- update this file

Avoid duplicating live status across multiple planning documents.

### Priority 3: Pick the Next Real Roadmap Slice

Once regression coverage is stronger, decide the next workstream explicitly rather than carrying forward the old mixed v2.6/v2.7/v2.8 checklist text.

## Definition of “In Sync”

This repo should be considered in sync when all of the following remain true:

- `README.md` matches the actual commands and top-level structure
- `docs/ARCHITECTURE.md` matches the runtime and module boundaries
- this file reflects current completed work and current open work
- the test counts and E2E coverage statements are based on a recent run, not inherited from an older release plan
