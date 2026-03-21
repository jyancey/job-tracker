# v2.7.2 Release Notes

**Release Date:** March 20, 2026
**Tag:** `v2.7.2`
**Baseline:** v2.7.1 (March 17, 2026)

## Summary

v2.7.2 is a quality and polish release. It introduces the JT brand system across the full UI, adds SQLite persistence for user profile and AI configuration, strengthens AI scoring, expands the Playwright E2E suite with persistence coverage for Profile and Settings, and cleans up legacy code and documentation.

## Highlights

### JT Brand System

- Introduced a unified `--jt-*` CSS custom property namespace, replacing the legacy `--gh-*` prefix throughout `src/App.css` and `src/index.css`
- Color palette: dark `#141413`, warm paper `#faf9f5`, subtle `#e8e6dc`, muted `#b0aea5`, orange accent `#d97757`, blue accent `#6a9bcc`, green `#788c5d`
- Typography: `Poppins` for headings and buttons; `Lora` for body and form text
- Button tokens: `.button-primary` (green `#788c5d`), `.button-secondary` (subtle `#e8e6dc`)
- Applied brand tokens consistently across table, kanban, calendar, dashboard, modal, and analytics surfaces
- Profile and Settings modals fully aligned: section cards, chips, field inputs, and action buttons all use JT classes; inline styles replaced with reusable class names
- Added `.github/instructions/brand-guidelines.instructions.md` as a reusable Copilot skill for future styling work

### Analytics - Conversion Rates

- Added overall **Applied → Offer** conversion metric card
- Clarified stage-to-stage conversion denominator text: "reached next stage out of …"
- Sparkline colors updated to JT green and orange palette

### SQLite Persistence: User Profile and AI Config

- User profile now persisted to SQLite via `POST /api/profile` (with `localStorage` as synchronous read layer)
- AI configuration now persisted to SQLite via `POST /api/config`
- Added `getUserProfile`, `saveUserProfile`, `getAIConfig`, `saveAIConfig` functions to `backend/sqliteStore.ts`
- Storage layer in `src/storage/aiStorage.ts` syncs localStorage writes to the API asynchronously in the background

### Profile: Custom Skills

- Added a custom skill input field with chip display to the Profile modal
- Users can type a skill, press Enter or click Add, and remove chips individually
- Skills are persisted alongside the rest of the profile

### AI Scoring Improvements

- Improved robustness for reasoning-heavy models (o1, o3, DeepSeek R1) that wrap JSON in `<think>` blocks or prose
- Score extraction now strips reasoning tokens and markdown code fences before parsing

### E2E Test Coverage

- **New spec**: `e2e/profile-settings.spec.ts` — two tests covering full-round-trip persistence across page reloads:
  - Profile fields (name, role, location, custom skill) survive reload
  - AI provider, API key, and model survive reload
- Hardened `e2e/helpers.ts` `resetAppState` to reset all three backend surfaces (`/api/jobs`, `/api/profile`, `/api/config`) before each test, preventing state leakage between tests
- Added `openProfile` and `openSettings` shared helpers
- Full Playwright suite: **10 tests passing**

### Code Cleanup

- Removed legacy files: `jobsApi.ts`, `jobsApi.test.ts`, `main.tsx`
- Added file-level description comments to key service and storage modules
- Fixed deprecated TypeScript types across the codebase

### CI/CD

- Updated CI workflows to use `RUNNER_PATH` for Node resolution
- Added manual release trigger to the release workflow
- Fixed Actions expression syntax for `RUNNER_PATH` variable

### Documentation

- Updated `.github/copilot-instructions.md` to reflect current stack (Next.js 16, React 19), tooling config filenames (`eslint.config.ts`, etc.), AI/profile storage pattern, `next-env.d.ts` generated-file note, and single-file Playwright run example
- Added `.github/instructions/brand-guidelines.instructions.md` with full JT design spec

## Validation

| Metric | Value |
| --- | --- |
| Vitest unit/integration tests | All passing |
| Playwright E2E tests | 10 / 10 passing |
| Build | Next.js standalone, compiles cleanly |
| Lint | ESLint clean |

## Breaking Changes

None. Profile and AI config data is now dual-written to SQLite; existing localStorage data continues to be read on load and is unaffected.

## Upgrade Notes

No migration steps required. The new SQLite tables (`user_profile`, `ai_config`) are auto-created on first start via `ensureUserProfileSchema` and `ensureAIConfigSchema` in `backend/sqliteStore.ts`.
