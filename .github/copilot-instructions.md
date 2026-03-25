# Copilot Instructions

## Commands

Use `pnpm` everywhere in this repo.

```bash
pnpm install         # Install dependencies
pnpm dev             # Next dev server at http://127.0.0.1:4173
pnpm build           # Next production build
pnpm start           # Run Next production server at http://127.0.0.1:3100
pnpm serve           # Alias of pnpm start
pnpm preview         # Alias of pnpm start
pnpm lint            # ESLint
pnpm lint:fix        # ESLint with auto-fix
pnpm test            # Vitest in watch mode
pnpm test:run        # Vitest single run
pnpm test:coverage   # Vitest with coverage
pnpm test:e2e        # Playwright against the dev server on port 4173
pnpm test:e2e:ui     # Playwright UI mode
```

Run a single test file:

```bash
pnpm exec vitest run src/path/to/file.test.ts
pnpm exec playwright test e2e/path/to/spec.ts --project=chromium
```

## Instruction Routing

Use the specialized instruction files under `.github/instructions/` when the task matches them. This file remains the repo-specific source of truth; if a generic instruction conflicts with the actual repo layout or commands here, follow this file and the live codebase.

- `brand-guidelines.instructions.md`: apply when changing visual design, CSS, TSX/JSX UI, layout, or component styling. Use it for work in `app/**`, `src/components/**`, `src/views/**`, and any styling changes.
- `context-engineering.instructions.md`: apply when planning or implementing multi-file changes, refactors, naming decisions, module boundaries, or when deciding what related files should be opened together for context.
- `github-actions-ci-cd-best-practices.instructions.md`: apply when editing CI/CD workflows. In this repo, those principles apply to `.gitea/workflows/*.yml` even though the generic instruction file references `.github/workflows/*.yml`.
- `nextjs.instructions.md`: apply when editing `app/**`, route handlers, server/client component boundaries, Next.js config, caching, or data-loading behavior. Repo-specific structure here takes precedence over generic folder examples in that file.
- `playwright-typescript.instructions.md`: apply when writing or updating Playwright coverage. Repo-specific overrides: keep specs under `e2e/`, use `pnpm exec playwright` or `pnpm test:e2e`, and follow existing helpers/patterns in `e2e/helpers.ts`.

When a task spans multiple areas, combine the relevant instruction files. Example: a new UI flow with E2E coverage should follow both `brand-guidelines.instructions.md` and `playwright-typescript.instructions.md`.

## Architecture

This is a local-first Next.js 16 + React 19 + TypeScript app backed by SQLite.

### Runtime setup

- **Dev**: `pnpm dev` runs Next.js on `127.0.0.1:4173`.
- **Production**: `pnpm build && pnpm start` runs Next.js on `127.0.0.1:3100`.
- **E2E**: Playwright uses `playwright.config.ts` to start or reuse `pnpm dev`.

### Backend boundaries

- `app/api/**/route.ts` is the HTTP layer.
- `backend/jobStore.ts` is the lazy-init entry point used by route handlers.
- `backend/sqliteStore.ts` is a compatibility facade. The real SQLite implementation lives in `backend/sqlite/`.
- `backend/sqlite/db.ts` owns connection setup and DB path handling.
- `backend/sqlite/schema.ts` owns table creation and migrations.
- `backend/sqlite/jobsRepository.ts`, `backend/sqlite/userProfileRepository.ts`, and `backend/sqlite/aiConfigRepository.ts` own repository logic.

### Storage strategy

The app uses a two-tier storage flow in `src/services/storageService.ts`:

1. Primary: `GET/PUT /api/jobs` -> `app/api/jobs/route.ts` -> `backend/jobStore.ts` -> `backend/sqliteStore.ts` -> `data/job-tracker.sqlite` (or `$JOB_TRACKER_DB_PATH`)
2. Fallback: if the API is unavailable in a browser-only environment, the frontend falls back to localStorage key `job-tracker.jobs.fallback`

AI configuration and user profile follow the same API-plus-local cache pattern through `src/storage/aiStorage.ts`, `app/api/config/route.ts`, and `app/api/profile/route.ts`.

### Frontend structure

```text
src/domain.ts              # Core types and domain helpers
src/services/              # Business logic (jobs, scoring, storage, AI, import/export)
src/storage/               # Storage adapters and browser persistence helpers
src/hooks/                 # State/composition hooks; useAppContentModel is the top-level app model
src/components/            # Reusable UI components
src/views/                 # Page-level views
src/views/settings/        # Settings sub-sections extracted from SettingsView
src/views/table/           # Table-specific view pieces
src/features/              # Feature modules: analytics, backup, savedViews, search, tasks
```

### State management

There is no global state library. The main flow is:

`App` -> `useAppContentModel` -> `AppShellView` -> view components

Keep transient UI state local to the feature or section that owns it. The refactored settings screen follows that pattern: `SettingsView` owns persisted draft state while the extracted section components own transient async state.

## Conventions

- **Package manager**: use `pnpm`, not `npm`.
- **Test colocation**: keep tests beside the source file they cover whenever practical.
- **Playwright location**: keep end-to-end tests in `e2e/`, not `tests/`.
- **CI workflow location**: workflow files live in `.gitea/workflows/`; apply GitHub Actions workflow best practices there.
- **Generated files**: `src/version.ts` is generated by `scripts/generate-version.ts`; `next-env.d.ts` is maintained by Next.js. Do not hand-edit either.
- **Backend facade**: keep `backend/sqliteStore.ts` as the public compatibility surface unless you are intentionally changing all import sites.
- **`JobDraft` vs `Job`**: use `JobDraft` for create/edit flows and promote via `createJobFromDraft()` in `src/domain.ts`.
- **AI scoring fields**: jobs carry five `score*` fields on a 0-5 scale; scoring logic lives in `src/services/scoring.ts`.
- **Tooling config**: root config lives in `eslint.config.ts`, `next.config.ts`, `playwright.config.ts`, and `vitest.config.ts`.
- **Debug logging**: enable with `localStorage.setItem('job-tracker.debug', 'true')` in the browser console, then export logs from the UI.
