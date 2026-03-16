# v2.8.0 Forgejo Issue Backlog

**Milestone:** v2.8.0  
**Release Theme:** Performance, Accessibility, Workspace Separation, and Advanced Workflow Intelligence  
**Generated:** March 11, 2026

Copy each issue block into Forgejo. Suggested labels are noted per issue.

---

## Track P1 — Performance Hardening

---

### Issue P1-1: Capture performance baseline for table and analytics views

**Labels:** `performance` `tech-debt` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Before optimizing anything, establish a documented performance baseline for the table-heavy and analytics-heavy views. This gives the team a measurable reference point for all subsequent P1 optimization work.

#### Tasks

- [ ] Identify the 3–5 most latency-sensitive user interactions (e.g. large-dataset table render, filter apply, analytics recalculation).
- [ ] Record baseline metrics (interaction response time, component render count) using browser DevTools or React DevTools profiler.
- [ ] Document results as a brief table in `docs/` (or a new `docs/PERFORMANCE_BASELINE.md`).
- [ ] Define acceptable thresholds that will be used to gate the Gate 1 checklist item.

#### Acceptance Criteria

- Baseline exists in a doc that can be referenced in PR review.
- At least 3 key interactions are measured.
- Thresholds are written down and agreed upon.

#### References

- `docs/V2_8_0_RELEASE_PLAN.md` — Track P1

---

### Issue P1-2: Optimize filter, sort, and render paths with targeted memoization

**Labels:** `performance` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Using the baseline from P1-1, apply focused memoization and render-boundary improvements to the highest-impact paths identified. Avoid global refactoring — changes must be scoped to specific components and hooks.

#### Tasks

- [ ] Review filter and sort pipeline for unnecessary recomputation on unrelated state changes.
- [ ] Add `useMemo` / `useCallback` at measured hot spots.
- [ ] Add or adjust `React.memo` boundaries on high-frequency table row and cell components.
- [ ] Verify no correctness regressions in sort/filter behavior.
- [ ] Re-measure the interactions from P1-1 and record improvement deltas.

#### Acceptance Criteria

- Measured interactions show improvement or are within agreed thresholds.
- Full test suite still passes.
- No change to user-visible sort/filter correctness.

#### References

- `docs/V2_8_0_RELEASE_PLAN.md` — Track P1
- Baseline doc from Issue P1-1

---

### Issue P1-3: Define and track performance budgets for key views

**Labels:** `performance` `dx` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Formalize the performance thresholds established in P1-1 and P1-2 as documented budgets that can be checked in future releases. This makes performance a first-class release gate rather than a one-off concern.

#### Tasks

- [ ] Write a short performance budget section in `docs/PERFORMANCE_BASELINE.md` (or equivalent).
- [ ] Identify which budgets can be enforced automatically (e.g. bundle size check, build output warning).
- [ ] Add bundle size check to build output or CI if not already present.
- [ ] Update Gate 1 checklist in `V2_8_0_RELEASE_PLAN.md` to reference the budget doc.

#### Acceptance Criteria

- Budget thresholds are documented and versioned.
- At least one budget check is automated or clearly stated in the release checklist.

#### References

- `docs/V2_8_0_RELEASE_PLAN.md` — Track P1, Gate 1

---

## Track P2 — Accessibility Audit and Remediation

---

### Issue P2-1: Audit keyboard navigation and screen-reader labeling in core flows

**Labels:** `accessibility` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Audit the core user journeys (add job, edit job, filter, import, backup) for keyboard operability and screen-reader correctness. Produce a prioritized list of issues to address in P2-2.

#### Tasks

- [ ] Walk through core CRUD and filter flows using keyboard-only navigation.
- [ ] Check focus order, trapped focus in modals, and visible focus indicators.
- [ ] Use a screen reader (VoiceOver / NVDA) or axe DevTools to capture labeling issues.
- [ ] Audit semantic structure of table headers and row interactions.
- [ ] Produce a short findings doc or tracked issue comments with severity (high / medium / low).

#### Acceptance Criteria

- All core flows are tested keyboard-only.
- Findings are categorized by severity.
- High-severity issues are captured as actionable tasks for P2-2.

#### References

- `docs/V2_8_0_RELEASE_PLAN.md` — Track P2
- WCAG 2.1 AA as the target standard

---

### Issue P2-2: Remediate accessibility issues in table and modal interactions

**Labels:** `accessibility` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Fix the high-severity accessibility issues identified in the P2-1 audit. Focus on the table and modal surfaces that are central to daily use.

#### Tasks

- [ ] Address all high-severity findings from P2-1 audit.
- [ ] Fix missing or incorrect ARIA labels, roles, and descriptions on table controls.
- [ ] Ensure modal dialogs trap focus correctly and return focus on close.
- [ ] Add missing `aria-live` regions for status messages and toasts where applicable.
- [ ] Add accessibility tests for the scenarios remediated.

#### Acceptance Criteria

- No high-severity a11y issues remain in internal audit.
- Core CRUD/filter/import workflows are keyboard-operable end-to-end.
- New tests cover at least the remediated interactions.

#### References

- `docs/V2_8_0_RELEASE_PLAN.md` — Track P2, Gate 2
- Findings from Issue P2-1

---

## Track P3 — Workspace Separation Foundations

---

### Issue P3-1: Define workspace domain types and TypeScript interfaces

**Labels:** `workspace` `types` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Introduce the `Workspace` and `WorkspaceRegistry` TypeScript interfaces that form the foundation of all subsequent workspace-separation work. This issue creates the shared contract used by the service, hooks, UI, and migration code.

#### Tasks

- [ ] Create `src/types/workspace.ts` (or equivalent location) containing:
  - `Workspace` interface (`id`, `displayName`, `color?`, `archivedAt?`, `createdAt`, `updatedAt`)
  - `WorkspaceRegistry` interface (`version: 1`, `currentWorkspaceId`, `workspaces: Workspace[]`)
- [ ] Add JSDoc on each field describing its intended use.
- [ ] Export types from the relevant barrel file / index.
- [ ] Add a unit test asserting the shape can be constructed and validated (type-level tests are sufficient).

**Future auth note (do not implement in v2.8.0):** The interfaces for `Account`, `WorkspaceRole`, `WorkspaceMembership`, and `AppConfig` are documented in the technical design for reference only. Do not add them to this file — they belong in a future auth release.

#### Acceptance Criteria

- Types compile cleanly with no `any` shortcuts.
- Both `Workspace` and `WorkspaceRegistry` are exported and importable across `src/`.
- No runtime behavior introduced in this issue.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Data Model section

---

### Issue P3-2: Implement workspaceService with registry CRUD and active workspace resolution

**Labels:** `workspace` `service` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Create `src/services/workspaceService.ts`, the core service responsible for reading and writing the workspace registry and resolving the currently active workspace. All subsequent workspace-scoped storage flows will depend on this service.

#### Tasks

- [ ] Create `src/services/workspaceService.ts` with:
  - `getRegistry(): WorkspaceRegistry` — reads `job-tracker.profiles.v1` from localStorage, returns a safe default if absent
  - `saveRegistry(registry: WorkspaceRegistry): void` — persists to localStorage
  - `getCurrentWorkspaceId(): string` — reads `job-tracker.current-workspace-id`
  - `setCurrentWorkspaceId(id: string): void`
  - `createWorkspace(displayName: string, options?: Partial<Workspace>): Workspace`
  - `renameWorkspace(id: string, displayName: string): void`
  - `archiveWorkspace(id: string): void`
  - `getActiveWorkspace(): Workspace` — convenience: resolves current ID → registry entry
- [ ] Guard all reads against missing/corrupt localStorage data (parse errors should produce a safe default).
- [ ] Write unit tests covering: create, rename, archive, switch active, missing/corrupt registry.

#### Acceptance Criteria

- All exported functions have unit tests.
- No workspace entity contains auth/password/session material.
- Registry writes are idempotent (calling twice with same data produces the same result).

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Storage Design §1, Service and Module Changes

---

### Issue P3-3: Implement startup migration from single-user to workspace-scoped storage

**Labels:** `workspace` `migration` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Implement the idempotent startup migration that converts an existing single-workspace installation into the new workspace registry model. This must run before any workspace-scoped reads so existing users see no data loss.

#### Tasks

- [ ] Implement `runWorkspaceMigration()` in `src/services/workspaceService.ts` (or a dedicated `src/services/workspaceMigration.ts`):
  1. Skip if workspace registry already exists (idempotent).
  2. Create one default workspace with a generated UUID.
  3. Set `currentWorkspaceId` to the default workspace.
  4. Migrate legacy AI config key → `job-tracker.ai-config.<defaultWorkspaceId>`.
  5. Migrate legacy user profile key → `job-tracker.user-profile.<defaultWorkspaceId>`.
  6. Migrate saved views key → `jobTracker.savedViews.v1.<defaultWorkspaceId>`.
  7. Migrate fallback jobs key → `job-tracker.jobs.fallback.<defaultWorkspaceId>`.
  8. Migrate backup config/state keys → workspace-scoped equivalents.
  9. Leave legacy keys in place (do not delete) for one release cycle for rollback safety.
- [ ] Call `runWorkspaceMigration()` from app initialization before any workspace-dependent reads.
- [ ] Log a clear console message on first migration completion and on subsequent skips.
- [ ] Write unit tests:
  - fresh install (no legacy keys) → correct default workspace created
  - existing install (legacy keys present) → keys migrated, legacy preserved
  - second call → no-op (idempotency confirmed)

#### Acceptance Criteria

- Existing users open the app and see their data unchanged in a default workspace.
- Fresh installs get a default workspace without errors.
- Migration is idempotent across N runs.
- All migration test scenarios pass.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Migration Strategy

---

### Issue P3-4: Implement useWorkspace hook for active workspace state and actions

**Labels:** `workspace` `hooks` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Create `src/hooks/useWorkspace.ts` to expose active workspace state and workspace management actions to React components. This is the primary integration point for all UI that needs workspace-awareness.

#### Tasks

- [ ] Create `src/hooks/useWorkspace.ts` exposing:
  - `activeWorkspace: Workspace`
  - `allWorkspaces: Workspace[]` (non-archived)
  - `switchWorkspace(id: string): void`
  - `createWorkspace(displayName: string): Workspace`
  - `renameWorkspace(id: string, displayName: string): void`
  - `archiveWorkspace(id: string): void`
- [ ] State should react to workspace switches (consumers re-render on active workspace change).
- [ ] Wrap a context provider (`WorkspaceProvider`) so active workspace is accessible app-wide without prop drilling.
- [ ] Mount `WorkspaceProvider` at the app root in `src/main.tsx` (or `App.tsx`).
- [ ] Write unit/hook tests for: initial state, switch, create, rename, archive.

#### Acceptance Criteria

- `useWorkspace()` returns the correct active workspace after switch.
- Components wrapped in `WorkspaceProvider` re-render on workspace change.
- All hook tests pass.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Service and Module Changes

---

### Issue P3-5: Make AI config and user profile storage workspace-aware

**Labels:** `workspace` `storage` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Update `src/storage/aiStorage.ts` so that AI config and user profile data are read and written under workspace-scoped localStorage keys. This is the first Phase 2 storage scoping change.

**Depends on:** P3-3 (migration), P3-2 (workspaceService)

#### Tasks

- [ ] Update `loadAIConfig()` and `saveAIConfig()` to accept a `workspaceId: string` parameter. Read/write key `job-tracker.ai-config.<workspaceId>`.
- [ ] Update `loadUserProfile()` and `saveUserProfile()` to accept a `workspaceId: string` parameter. Read/write key `job-tracker.user-profile.<workspaceId>`.
- [ ] Update all call sites to pass the active workspace ID from `useWorkspace()` or a resolved service call.
- [ ] Verify legacy keys are no longer written (migration handles reading them on first run only).
- [ ] Add unit tests for: load/save with explicit workspaceId, isolation between two different workspace IDs.

#### Acceptance Criteria

- AI config changes in workspace A do not appear in workspace B.
- User profile changes in workspace A do not appear in workspace B.
- Tests confirm isolation.
- Existing test suite still passes.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Storage Design §2
- `src/storage/aiStorage.ts`

---

### Issue P3-6: Make saved views storage workspace-aware

**Labels:** `workspace` `storage` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Update `src/features/savedViews/useSavedViews.ts` to read and write saved views under a workspace-scoped key so that each workspace has an independent set of saved views.

**Depends on:** P3-3, P3-4

#### Tasks

- [ ] Update the `useSavedViews` hook to resolve the active workspace ID from `useWorkspace()`.
- [ ] Change the localStorage key from `jobTracker.savedViews.v1` to `jobTracker.savedViews.v1.<workspaceId>`.
- [ ] Verify that switching workspaces loads the new workspace's saved views immediately.
- [ ] Add unit tests for: view isolation between workspaces, switching reloads correct view list.

#### Acceptance Criteria

- Saved views created in workspace A are not visible in workspace B.
- Switching workspaces causes the saved view list to update without a page reload.
- Tests confirm isolation.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Storage Design §3
- `src/features/savedViews/useSavedViews.ts`

---

### Issue P3-7: Make backup storage workspace-aware

**Labels:** `workspace` `storage` `backup` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Update the backup subsystem so that backup config, backup state, and auto-backup localStorage artifacts are all scoped to the active workspace. Update the `BackupSnapshot` schema to v2 to include `workspaceId`.

**Depends on:** P3-3, P3-4

#### Tasks

- [ ] Update backup config key: `job-tracker.backup-config.<workspaceId>`
- [ ] Update backup state key: `job-tracker.backup-state.<workspaceId>`
- [ ] Update auto-backup artifact key: `job-tracker.auto-backup.<workspaceId>.<timestamp>`
- [ ] Update `BackupSnapshot` to `schemaVersion: 2`:
  - Add `workspaceId: string`
  - Add `workspaceDisplayName?: string`
- [ ] Update backup read logic to handle `schemaVersion: 1` files gracefully (no crash on import of legacy backup).
- [ ] Update restore preview to warn when restoring a backup from a different workspace.
- [ ] Update auto-backup filename format: `job-tracker-<workspaceDisplayName>-backup-<timestamp>.json`
- [ ] Add unit tests for schema v2 write, schema v1 read compatibility, cross-workspace restore warning.

#### Acceptance Criteria

- Backup actions only operate on active workspace data.
- A v1 backup file can still be imported without crashing.
- A backup file from workspace A imported into workspace B shows a clear warning.
- All tests pass.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Storage Design §6
- `src/features/backup/backupService.ts`

---

### Issue P3-8: Make fallback jobs storage workspace-aware

**Labels:** `workspace` `storage` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Update the localStorage fallback path for job storage to use a workspace-scoped key. This prevents fallback-persisted jobs from bleeding between workspaces when the backend is unavailable.

**Depends on:** P3-3, P3-4

#### Tasks

- [ ] Identify the current fallback jobs localStorage key in `src/services/storageService.ts` or equivalent.
- [ ] Change key to: `job-tracker.jobs.fallback.<workspaceId>`
- [ ] Ensure the active workspace ID is resolved before any fallback read/write.
- [ ] Add unit tests for: fallback write scoped to workspace, isolation between two workspace IDs.

#### Acceptance Criteria

- Fallback jobs from workspace A are not visible when workspace B is active.
- Tests confirm isolation.
- No change to the fallback write/read business logic beyond the key scoping.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Storage Design §4 (Local Fallback Path)

---

### Issue P3-9: Add workspaceId column to SQLite jobs table with scoped queries

**Labels:** `workspace` `backend` `database` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Add workspace ownership to the SQLite persistence layer by adding a `workspaceId` column to the `jobs` table and updating all queries to be workspace-scoped.

#### Tasks

- [ ] In `backend/sqliteStore.ts`, add migration on startup:
  ```sql
  ALTER TABLE jobs ADD COLUMN workspaceId TEXT;
  CREATE INDEX IF NOT EXISTS idx_jobs_workspace_id ON jobs(workspaceId);
  ```
- [ ] Backfill `workspaceId` for existing rows using the default workspace ID (received from the app at startup or via a migration API call).
- [ ] Update `listJobs(workspaceId)` to filter `WHERE workspaceId = ?`.
- [ ] Update `replaceAllJobs(workspaceId, jobs)` to `DELETE WHERE workspaceId = ?` before inserting.
- [ ] Reject calls with missing `workspaceId` after the migration window (log and return error).
- [ ] Write tests for: scoped list, scoped replace, isolation between two workspace IDs, backfill behavior.

#### Acceptance Criteria

- Jobs written under workspace A are not returned when workspace B queries.
- Existing jobs are backfilled and still readable after migration.
- Tests confirm scoped query isolation.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Storage Design §4 (SQLite Path)
- `backend/sqliteStore.ts`

---

### Issue P3-10: Update backend HTTP API to accept and validate workspaceId

**Labels:** `workspace` `backend` `api` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Update the `GET /api/jobs` and `PUT /api/jobs` routes in `backend/jobsApi.ts` to require and validate a `workspaceId` query parameter. Requests without it should be rejected once migration is complete.

**Depends on:** P3-9

#### Tasks

- [ ] Update `GET /api/jobs` to read `workspaceId` from `req.query` and pass it to `listJobs()`.
- [ ] Update `PUT /api/jobs` to read `workspaceId` from `req.query` and pass it to `replaceAllJobs()`.
- [ ] Validate that `workspaceId` is a non-empty string. Return `400 Bad Request` with a descriptive message if missing or invalid.
- [ ] Add API-level tests (or update existing) for: valid workspace request, missing workspaceId returns 400, two workspaces return isolated results.

**Security note:** In v2.8.0, `workspaceId` is trusted from the client since there is no auth layer. Document this assumption in a comment in `jobsApi.ts`. A future auth release should validate workspace membership server-side.

#### Acceptance Criteria

- Valid requests with `workspaceId` are served correctly.
- Requests missing `workspaceId` return `400` with a clear error message.
- No workspace data from one ID is returned in a request for another ID.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Storage Design §5 (HTTP API)
- `backend/jobsApi.ts`

---

### Issue P3-11: Update storageService and apiClient to pass workspaceId

**Labels:** `workspace` `service` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Update the frontend service layer (`src/services/storageService.ts`, `src/services/apiClient.ts`) so that all job reads and writes pass the active workspace ID through the persistence stack.

**Depends on:** P3-4, P3-10

#### Tasks

- [ ] Update `apiClient.ts` to include `workspaceId` as a query parameter in `GET /api/jobs` and `PUT /api/jobs` calls.
- [ ] Update `storageService.ts` to resolve the active workspace ID (from `workspaceService` or passed as a parameter) for all job operations.
- [ ] Ensure the `workspaceId` resolved at the service call site matches the `useWorkspace()` active state.
- [ ] Update or add unit tests for: outgoing requests include correct `workspaceId`, switching active workspace changes which ID is sent.

#### Acceptance Criteria

- All job API calls include `workspaceId` in the request.
- Tests confirm the correct workspace ID is used per active workspace.
- Existing tests still pass.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Service and Module Changes
- `src/services/storageService.ts`, `src/services/apiClient.ts`

---

### Issue P3-12: Add workspace switcher to app shell

**Labels:** `workspace` `ui` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Add a visible, accessible workspace switcher control to the app shell so users can see their active workspace and switch to another workspace without leaving the main view.

**Depends on:** P3-4

#### Tasks

- [ ] Add a workspace switcher component near the profile/settings area of the header.
- [ ] Show the active workspace `displayName` (and optional `color` indicator if present).
- [ ] Dropdown/menu lists all non-archived workspaces and allows selecting one.
- [ ] Switching triggers `switchWorkspace()` from `useWorkspace()`.
- [ ] Include a "Create new workspace" entry in the menu that opens a name-entry prompt.
- [ ] Ensure the switcher is keyboard-accessible (focus, arrow-key navigation, Enter to select, Escape to close).

#### Acceptance Criteria

- Active workspace name is always visible in the shell.
- User can switch workspaces from any page.
- After switching, the job list and saved views update to reflect the new workspace.
- Keyboard-only operation works.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — UI and UX Changes (App Shell)

---

### Issue P3-13: Add workspace management UI (create, rename, archive, duplicate)

**Labels:** `workspace` `ui` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Extend the profile or settings screen with full workspace management: create, rename, archive, and duplicate workspaces.

**Depends on:** P3-4, P3-12

#### Tasks

- [ ] Add a "Manage Workspaces" section to the profile or settings page.
- [ ] List all workspaces (active and archived, clearly differentiated).
- [ ] Per-workspace actions: rename, archive, duplicate (copy preferences and saved views, not jobs — per design doc recommendation).
- [ ] Archived workspaces are hidden from the switcher but visible and recoverable from the management screen.
- [ ] Confirm before archiving: show a prompt naming the workspace.
- [ ] Duplicate flow copies AI config, user profile, and saved views only.
- [ ] All actions use `useWorkspace()` or `workspaceService` — no direct localStorage access from components.

#### Acceptance Criteria

- Users can rename any workspace.
- Users can archive a workspace (it disappears from switcher, reachable from management screen).
- Duplication produces a new workspace with copied preferences, no jobs.
- All actions require explicit user confirmation for destructive operations.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — UI and UX Changes (Profile View)

---

### Issue P3-14: Update import/export/backup UI with active workspace context

**Labels:** `workspace` `ui` `backup` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Update the import, export, and backup/restore screens to clearly show the active workspace, so users never accidentally restore or import into the wrong workspace.

**Depends on:** P3-4, P3-7

#### Tasks

- [ ] Import dialog: show "Importing into: **{workspaceName}**" above the file picker or confirmation step.
- [ ] Export: include active workspace name in the dialog and default filename (`job-tracker-<workspaceName>-<date>.json`).
- [ ] Backup screen: show active workspace name in config and state displays.
- [ ] Restore flow: if backup `workspaceId` differs from active workspace, show a clear warning: "This backup is from **{sourceWorkspace}**. You are restoring into **{activeWorkspace}**."
- [ ] All messaging must be workspace-name–only (not workspace ID) in user-facing copy.

#### Acceptance Criteria

- Active workspace name is visible in import, export, and backup screens.
- Cross-workspace restore shows an explicit warning before proceeding.
- No user-facing copy leaks internal IDs.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — UI (Messaging Requirements, Safety Rules), Storage Design §6–7

---

### Issue P3-15: Add unit and integration tests for workspace service, migration, and storage isolation

**Labels:** `workspace` `testing` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Add comprehensive unit and integration tests covering workspace registry operations, the startup migration, and per-storage isolation across all workspace-scoped subsystems.

**Depends on:** P3-1 through P3-11

#### Tasks

- [ ] Unit tests for `workspaceService`:
  - create, rename, archive, switch
  - missing/corrupt registry returns safe default
- [ ] Unit tests for `runWorkspaceMigration`:
  - fresh install → default workspace
  - existing keys → migrated, legacy preserved
  - idempotency (second call is no-op)
- [ ] Unit tests for each workspace-scoped storage module:
  - AI config isolation: workspace A ≠ workspace B
  - saved views isolation
  - fallback jobs isolation
  - backup key isolation
- [ ] Integration tests:
  - switching active workspace causes service calls to resolve different data
  - import/export reflects active workspace

#### Acceptance Criteria

- All critical isolation paths have test coverage.
- Idempotency of migration is verified by a test.
- No flaky tests introduced.

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Testing Strategy

---

### Issue P3-16: Add E2E tests for workspace creation, switching, and data isolation

**Labels:** `workspace` `testing` `e2e` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Add end-to-end test flows that verify workspace creation, switching, and job/saved-view isolation from the user's perspective. Data bleed across workspaces is a release-blocking risk that E2E tests must catch.

**Depends on:** P3-12, P3-13, P3-14

#### Tasks

- [ ] E2E flow: create a second workspace from the switcher.
- [ ] E2E flow: switch from workspace A (with jobs) to workspace B (empty), verify job list is empty.
- [ ] E2E flow: create a saved view in workspace A, switch to workspace B, verify the view does not appear.
- [ ] E2E flow: import a backup from workspace A into workspace B, verify cross-workspace warning appears.
- [ ] Tag all new flows so they can be run as part of the release smoke suite.

#### Acceptance Criteria

- All 4+ flows are implemented and pass consistently.
- Job list isolation and saved view isolation are both verified E2E.
- Tests are included in the release smoke suite (Gate 2 and Gate 3 checklists).

#### References

- `docs/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md` — Testing Strategy (E2E)
- `docs/V2_8_0_RELEASE_PLAN.md` — Track P5, Gate 2

---

## Track P4 — Workflow and Filtering Enhancements

---

### Issue P4-1: Add quality-of-life improvements to advanced filtering

**Labels:** `workflow` `ux` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Improve the filtering experience for users who manage large job lists. Focus on reducing click-count for common filter configurations and making filter state more transparent.

#### Tasks

- [ ] Audit the current filter controls for friction points (review user feedback or self-test daily workflows).
- [ ] Identify the top 2–3 most commonly applied filter combinations.
- [ ] Implement targeted improvements (e.g. quick-filter chips, clear-all button, filter summary label, persistent last-used filter).
- [ ] Ensure no regressions to existing filter logic or test coverage.

#### Acceptance Criteria

- Reduced interaction cost for the identified common filter workflows.
- Existing filter tests still pass.
- No behavior change to filter logic itself.

#### References

- `docs/V2_8_0_RELEASE_PLAN.md` — Track P4

---

### Issue P4-2: Improve saved-view workflows for rapid context switching

**Labels:** `workflow` `ux` `saved-views` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Make saved views faster to create and apply so users can treat them as lightweight named workspaces within a workspace (e.g. "Today's Follow-Ups", "Screen Calls Due").

#### Tasks

- [ ] Identify pain points in the current save-view and load-view flow.
- [ ] Add quick-apply access to saved views (e.g. a compact view-switcher control).
- [ ] Improve naming/editing UX for saved views if needed.
- [ ] Ensure the P3-6 workspace-scoping of saved views is compatible with these improvements.

#### Acceptance Criteria

- Applying a saved view requires fewer interactions than today.
- No behavior regressions in saved view save/load/delete.
- Works correctly with workspace-scoped view storage from P3-6.

#### References

- `docs/V2_8_0_RELEASE_PLAN.md` — Track P4

---

## Track P5 — E2E and Reliability Expansion

---

### Issue P5-1: Add E2E tests for import/replace safety, backup/restore, and bulk operations

**Labels:** `testing` `e2e` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Expand E2E coverage for destructive and high-stakes operations: importing a file (replace behavior), restoring a backup, and bulk-editing jobs. These paths are high-risk and currently under-covered.

#### Tasks

- [ ] E2E flow: import a jobs file and confirm replace behavior shows correct count and prompts.
- [ ] E2E flow: backup current workspace, then restore it, and verify job count is unchanged.
- [ ] E2E flow: bulk status update on multiple selected jobs.
- [ ] Ensure all new flows are tagged for the release smoke suite.

#### Acceptance Criteria

- All 3+ flows pass consistently.
- Import/replace flow includes confirmation UI verification.
- Restore flow verifies data integrity post-restore.

#### References

- `docs/V2_8_0_RELEASE_PLAN.md` — Track P5

---

### Issue P5-2: Strengthen release validation checklist and smoke suite documentation

**Labels:** `testing` `dx` `release` `v2.8.0`  
**Milestone:** v2.8.0

#### Summary

Update the release validation process to incorporate workspace-separation smoke flows and make the release checklist repeatable and self-contained for the v2.8.0 release candidate.

#### Tasks

- [ ] Update `docs/V2_8_0_RELEASE_PLAN.md` Gate 3 checklist to include:
  - Workspace E2E flows (from P3-16 and P5-1)
  - Migration smoke test against a simulated legacy localStorage state
- [ ] Write or update `docs/RELEASE_SMOKE_CHECKLIST.md` (or equivalent) with step-by-step manual verification steps for a release candidate.
- [ ] Tag which E2E tests substitute for which manual steps.

#### Acceptance Criteria

- Gate 3 checklist is complete and references test suite coverage.
- Release smoke checklist is runnable by any team member.
- Workspace and backup isolation flows are explicitly covered.

#### References

- `docs/V2_8_0_RELEASE_PLAN.md` — Gate 3, Track P5

---

## Summary Table

| ID | Title | Track | Labels |
|----|-------|-------|--------|
| P1-1 | Capture performance baseline | P1 Performance | `performance` |
| P1-2 | Optimize filter/sort/render paths | P1 Performance | `performance` |
| P1-3 | Define and track performance budgets | P1 Performance | `performance` `dx` |
| P2-1 | Audit keyboard and screen-reader labeling | P2 Accessibility | `accessibility` |
| P2-2 | Remediate table and modal a11y issues | P2 Accessibility | `accessibility` |
| P3-1 | Workspace domain types and interfaces | P3 Workspace | `workspace` `types` |
| P3-2 | workspaceService: registry CRUD | P3 Workspace | `workspace` `service` |
| P3-3 | Startup migration to workspace-scoped storage | P3 Workspace | `workspace` `migration` |
| P3-4 | useWorkspace hook and WorkspaceProvider | P3 Workspace | `workspace` `hooks` |
| P3-5 | Workspace-aware AI config and user profile storage | P3 Workspace | `workspace` `storage` |
| P3-6 | Workspace-aware saved views storage | P3 Workspace | `workspace` `storage` |
| P3-7 | Workspace-aware backup storage and schema v2 | P3 Workspace | `workspace` `backup` |
| P3-8 | Workspace-aware fallback jobs storage | P3 Workspace | `workspace` `storage` |
| P3-9 | SQLite workspaceId column and scoped queries | P3 Workspace | `workspace` `backend` `database` |
| P3-10 | Backend API workspaceId validation | P3 Workspace | `workspace` `backend` `api` |
| P3-11 | Frontend service layer: pass workspaceId | P3 Workspace | `workspace` `service` |
| P3-12 | Workspace switcher in app shell | P3 Workspace | `workspace` `ui` |
| P3-13 | Workspace management UI | P3 Workspace | `workspace` `ui` |
| P3-14 | Import/export/backup workspace context messaging | P3 Workspace | `workspace` `ui` `backup` |
| P3-15 | Unit and integration tests: workspace isolation | P3 Workspace | `workspace` `testing` |
| P3-16 | E2E tests: workspace creation, switching, isolation | P3 Workspace | `workspace` `testing` `e2e` |
| P4-1 | Advanced filtering quality-of-life improvements | P4 Workflow | `workflow` `ux` |
| P4-2 | Saved-view rapid context switching improvements | P4 Workflow | `workflow` `ux` |
| P5-1 | E2E: import, backup/restore, bulk operations | P5 E2E | `testing` `e2e` |
| P5-2 | Release validation checklist and smoke suite | P5 E2E | `testing` `release` |

**Total: 25 issues**

---

## Suggested Labels to Create in Forgejo

| Label | Color | Purpose |
|-------|-------|---------|
| `workspace` | `#0075ca` | Workspace separation feature work |
| `performance` | `#e4e669` | Runtime performance improvements |
| `accessibility` | `#0e8a16` | A11y audit and remediation |
| `migration` | `#d93f0b` | Data migration, schema changes |
| `backend` | `#5319e7` | Node/SQLite backend changes |
| `database` | `#5319e7` | Schema and query changes |
| `api` | `#5319e7` | HTTP API surface changes |
| `storage` | `#1d76db` | localStorage / persistence layer |
| `service` | `#1d76db` | Service module changes |
| `hooks` | `#1d76db` | React hook changes |
| `ui` | `#bfd4f2` | UI component changes |
| `types` | `#c2e0c6` | TypeScript interface/type work |
| `testing` | `#f9d0c4` | Test additions or fixes |
| `e2e` | `#f9d0c4` | End-to-end test flows |
| `workflow` | `#fef2c0` | UX workflow improvements |
| `backup` | `#e99695` | Backup/restore subsystem |
| `dx` | `#c5def5` | Developer experience, tooling, docs |
| `release` | `#d4c5f9` | Release process and validation |
| `v2.8.0` | `#0052cc` | Version milestone tag |
