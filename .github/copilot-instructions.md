# Copilot Instructions

## Commands

```bash
npm run dev           # Next dev server at http://127.0.0.1:4173
npm run build         # Next production build
npm run start         # Run Next production server at http://127.0.0.1:3100
npm run serve         # Alias of npm run start
npm run preview       # Alias of npm run start
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
npm run test:coverage # Run with coverage (thresholds: 70% lines/functions/statements, 65% branches)
npm run test:e2e      # Playwright (against Next dev server on port 4173)
npm run test:e2e:ui  # Playwright with UI
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

## Architecture

This is a local-first Next.js + React + TypeScript app backed by SQLite.

### Runtime setup

- **Dev**: `npm run dev` runs Next.js on port 4173.
- **Production**: `npm run build && npm run start` runs Next.js on port 3100.

The API route handlers in `app/api/**/route.ts` use `backend/jobStore.ts` and the shared store in `backend/sqliteStore.ts`.

### Storage strategy

The frontend uses a two-tier storage strategy in `src/services/storageService.ts`:
1. **Primary**: `GET/PUT /api/jobs` → `app/api/jobs/route.ts` → `backend/jobStore.ts` → `backend/sqliteStore.ts` → `data/job-tracker.sqlite` (or `$JOB_TRACKER_DB_PATH`)
2. **Fallback**: If the API returns a URL-pattern error (no backend present), falls back to `localStorage` key `job-tracker.jobs.fallback`

### Frontend layer structure

```
src/domain.ts          # Core types: Job, JobDraft, JobStatus, JobPriority
src/services/          # Pure business logic (jobService, scoring, notifications, storageService, aiScoringService, etc.)
src/storage/           # Storage adapters (API client, localStorage fallback, AI config, logger)
src/hooks/             # React hooks — one hook per concern, heavily decomposed
src/components/        # Reusable UI components
src/views/             # Page-level view components
src/features/          # Self-contained feature modules: analytics, backup, savedViews, search, tasks
```

### State management

There is no global state library. All state flows through `useAppContentModel` (in `src/hooks/`), which composes ~20 specialized hooks and passes their results as props to `AppShellView`. The pattern is: `App` → `useAppContentModel` → `AppShellView` → view components.

## Conventions

- **Test colocation**: Every source file has a sibling test file (`Foo.tsx` → `Foo.test.tsx`). Unit tests use Vitest + React Testing Library; E2E tests use Playwright in `e2e/`.
- **Backend is TypeScript**: backend modules are implemented in `backend/*.ts`.
- **`src/version.ts` is generated**: Auto-created by `scripts/generate-version.ts` before dev/build/test runs. Do not edit it manually.
- **ESLint strictness**: Uses `typescript-eslint` strict mode. `no-console` is a warning (except `console.warn` and `console.error`). Unused vars prefixed with `_` are allowed.
- **AI scoring fields**: Jobs have five `score*` fields (`scoreFit`, `scoreCompensation`, `scoreLocation`, `scoreGrowth`, `scoreConfidence`), each on a 0–5 scale. Scoring logic lives in `src/services/scoring.ts`.
- **`JobDraft` vs `Job`**: Use `JobDraft` (omits `id`, `createdAt`, `updatedAt`) for new/edited records; call `createJobFromDraft()` from `src/domain.ts` to promote it to a `Job`.
- **CI/CD**: Gitea Actions workflows in `.gitea/workflows/`. Requires `npm rebuild` after install for native modules (`better-sqlite3`).
- **Debug logging**: Enable with `localStorage.setItem('job-tracker.debug', 'true')` in the browser console; download logs via "Export DB Logs" in the UI.
