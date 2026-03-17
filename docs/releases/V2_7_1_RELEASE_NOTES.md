# v2.7.1 Release Notes

**Release Date:** March 17, 2026
**Tag:** `v2.7.1`
**Baseline:** v2.7.0 (March 11, 2026)

## Summary

v2.7.1 is a stabilization release focused on infrastructure modernization. The application has been migrated from Vite to Next.js App Router, the project layout has been restructured for clarity, and the CI/CD and deployment pipelines have been overhauled to produce a self-contained standalone bundle with macOS launchd support.

No functional changes to the application UI or data layer. All 681 tests continue to pass across 78 test files.

## Highlights

### Next.js Migration

- Migrated from Vite SPA to **Next.js 15 App Router** with standalone output
- API routes implemented under `app/api/` (jobs, database create/info/test)
- Client bridge via `app/AppClient.tsx` (`'use client'`) wrapping `src/App`
- SQLite store lazy-initialized via `Proxy` to prevent `SQLITE_BUSY` during parallel build workers
- Added `busy_timeout = 10000` and `dynamic = 'force-dynamic'` on all API routes

### Standalone Deployment Packaging

- Enabled `output: 'standalone'` in `next.config.ts`
- Created `scripts/package-standalone.sh` — canonical script to assemble a deployable bundle
- Bundle includes: `server.js`, `.next/static`, `public/`, runtime `node_modules`, `docs/DAEMON_SETUP.md`, and `macos/` helpers
- End-to-end verified: packaged bundle starts and serves both UI and API correctly

### macOS Launchd Support

- Added `scripts/launchd/start-job-tracker.sh` — wrapper that sets environment and runs `node server.js`
- Added `scripts/launchd/install-launch-agent.sh` — installs and bootstraps the launchd agent
- Added `scripts/launchd/uninstall-launch-agent.sh` — cleanly removes the agent
- Updated `com.local.job-tracker.plist.template` for standalone bundle layout
- Bind address controlled via `JOB_TRACKER_HOST` (defaults to `127.0.0.1`)
- Rewrote `docs/DAEMON_SETUP.md` for the new standalone workflow

### Project Restructuring

- **Deleted** dead Vite-era files: `index.html`, `server.ts`, `public/vite.svg`
- **Renamed** `vite.config.ts` → `vitest.config.ts` (stripped dead dev-server plugin)
- **Deleted** unused `tsconfig.app.json` and `tsconfig.node.json`
- **Moved** `lib/jobStore.ts` → `backend/jobStore.ts` (eliminated `lib/` directory)
- **Moved** `scoring.ts` and `notifications.ts` into `src/services/`
- **Relocated** orphaned test files to match their source locations
- **Organized** `docs/` into subdirectories: `releases/`, `planning/`, `safari-plugin/`
- Updated all imports, README, and Copilot instructions to match new layout

### CI/CD Improvements

- Separated `.gitea/` and `.github/` workflow directories by runner type
- All workflows (build-test, deploy, release) now use `scripts/package-standalone.sh`
- Release workflow produces `job-tracker-vX.Y.Z-standalone.zip` with macOS helpers
- Deploy workflow includes `BUILD_INFO.txt` metadata
- Fixed `generate-version.ts` to escape single quotes in git commit messages

### Documentation

- Added performance baseline framework (`docs/PERFORMANCE_BASELINE.md`)
- Added comprehensive Safari Plugin v1.0 planning (5 documents in `docs/safari-plugin/`)
- Added v2.8.0 planning documents (release plan, Forgejo issues, workspace technical design)
- Added TSDoc comments across domain, services, storage, backup, search, and utility modules

## Validation

| Metric | Value |
| --- | --- |
| Test files | 78 |
| Tests passing | 681 |
| Build | Next.js standalone, compiles cleanly |
| Lint | ESLint clean (zero warnings) |
| Standalone bundle | Verified: starts, serves UI and API |

## Breaking Changes

None. This is a purely internal infrastructure release with no changes to application behavior or data format.

## Upgrade Notes

- The project root no longer contains `index.html`, `server.ts`, `vite.config.ts`, `tsconfig.app.json`, or `tsconfig.node.json`
- `lib/` directory has been removed; `jobStore` now lives in `backend/`
- `scoring.ts` and `notifications.ts` have moved from `src/` root to `src/services/`
- Test files `exportImport.test.ts` and `storage.test.ts` have moved to `src/services/`
- Docs reorganized into `docs/releases/`, `docs/planning/`, `docs/safari-plugin/`
- CI workflows have moved from `.github/workflows/` to `.gitea/workflows/` for Gitea runner
