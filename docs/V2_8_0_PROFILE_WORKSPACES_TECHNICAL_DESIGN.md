# v2.8.0 Technical Design: Workspace Separation and Lightweight Multi-User Support

**Date:** March 11, 2026  
**Status:** Proposed  
**Related Plan:** [V2_8_0_RELEASE_PLAN.md](./V2_8_0_RELEASE_PLAN.md)

---

## Problem Statement

The current app supports exactly one effective workspace per installation.

Today, user-scoped data is effectively global:
- AI config is stored under a single localStorage key in [src/storage/aiStorage.ts](../src/storage/aiStorage.ts)
- user profile data is stored under a single localStorage key in [src/storage/aiStorage.ts](../src/storage/aiStorage.ts)
- saved views are stored under a single localStorage key in [src/features/savedViews/useSavedViews.ts](../src/features/savedViews/useSavedViews.ts)
- backup state and local backup artifacts are keyed globally
- jobs persistence has no notion of user ownership in the fallback path or SQLite path

This means users cannot cleanly separate different job-search tracks, such as applying to different job classes with different resumes, preferences, and saved views. It also means more than one person using the same installation would overwrite each other's workspace data.

## Goal

Allow one user to maintain multiple clearly separated workspaces for different job classes, resumes, and search strategies, while also allowing the same installation to be used safely by more than one person, without introducing authentication, accounts, remote identity, or collaborative editing.

## Non-Goals

- No login screen
- No passwords or authentication providers
- No permissions or role model
- No simultaneous collaboration between users
- No shared team workspaces in v2.8.0

## Future Compatibility Goal

This design should remain compatible with a future release that introduces:
- login and password-based authentication
- role-based access control
- workspace membership and permissions
- admin-only application configuration

The v2.8.0 design should therefore avoid conflating local workspaces with user accounts.

---

## Proposed Approach

Implement **local workspaces**.

A workspace is a local record plus a scoped data boundary. The app keeps one active workspace at a time, and all user-owned reads/writes resolve through that active workspace.

This should be treated as a **workspace boundary**, not as an identity or authentication boundary.

Primary product use case:
- one user can maintain separate workspaces such as `Frontend IC`, `Engineering Manager`, or `Product Design`
- each workspace can have its own jobs, resume text, profile preferences, AI scoring defaults, saved views, and backups
- switching workspaces should create clear separation between job classes

### Key Design Decision

Do **not** introduce `profileId` into the user-facing `Job` domain model unless forced by implementation friction.

Preferred approach:
- keep `Job` as the business object used throughout the UI
- scope persistence by `profileId` at the storage boundary
- use profile-specific storage keys for localStorage-backed state
- use profile-aware API/storage calls for SQLite-backed jobs

This minimizes blast radius across the existing UI and tests.

### Future Auth Compatibility Rule

Do not evolve the local workspace model into a login account model.

In a future authenticated architecture, the model should instead be:
- `Account`: identity, password/authentication, lifecycle
- `Workspace`: data boundary and shared working context
- `WorkspaceMembership`: relation between account and workspace with role information
- `AppConfig`: installation-wide configuration restricted to admins

This preserves a clean separation of concerns and avoids mixing personal identity, access control, and workspace-scoped data into one record.

---

## Data Model

### New Workspace Model

```ts
export interface Workspace {
  id: string
  displayName: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
  color?: string
}
```

### New Registry State

```ts
export interface WorkspaceRegistry {
  version: 1
  currentWorkspaceId: string
  workspaces: Workspace[]
}
```

### Future Auth Model (Not in v2.8.0)

```ts
export interface Account {
  id: string
  email: string
  displayName: string
  passwordHash: string
  disabledAt?: string
  createdAt: string
  updatedAt: string
}

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface WorkspaceMembership {
  accountId: string
  workspaceId: string
  role: WorkspaceRole
  createdAt: string
  updatedAt: string
}

export interface AppConfig {
  allowSelfSignup: boolean
  defaultRole: WorkspaceRole
  enforcePasswordPolicy: boolean
  aiProviderDefaults?: Record<string, unknown>
  updatedAt: string
}
```

For future compatibility, the local workspace model in v2.8.0 should map naturally to a future authenticated `Workspace` concept.

### Default Workspace

On migration, the app creates one default workspace:
- `id`: generated UUID
- `displayName`: `Default Workspace`
- `createdAt`: migration timestamp
- `updatedAt`: migration timestamp

---

## Storage Design

### 1. Workspace Registry Storage

Add new localStorage keys:

- `job-tracker.profiles.v1`
- `job-tracker.current-workspace-id`

Responsibility:
- store profile list
- store currently active workspace
- support create/rename/archive/switch actions

Future compatibility note:
- this registry can later become the local cache for workspace membership and active workspace selection
- it should not store password material or authentication tokens

### 2. Workspace-Scoped AI Profile and Config Storage

Current keys:
- `job-tracker-ai-config`
- `job-tracker-user-profile`

Replace with workspace-scoped keys:
- `job-tracker.ai-config.<workspaceId>`
- `job-tracker.user-profile.<workspaceId>`

Design impact:
- `loadAIConfig()` and `saveAIConfig()` become workspace-aware
- `loadUserProfile()` and `saveUserProfile()` become workspace-aware
- old signatures can be temporarily preserved via an active-workspace resolver

Recommended API shape:

```ts
loadAIConfig(workspaceId: string): AIConfig
saveAIConfig(workspaceId: string, config: AIConfig): void
loadUserProfile(workspaceId: string): UserProfile
saveUserProfile(workspaceId: string, profile: UserProfile): void
```

This is what allows one workspace to hold a resume and preference set for one job class, while another workspace can hold a completely different resume and targeting strategy.

### 3. Saved Views Storage

Current key:
- `jobTracker.savedViews.v1`

Replace with:
- `jobTracker.savedViews.v1.<workspaceId>`

Design impact:
- [src/features/savedViews/useSavedViews.ts](../src/features/savedViews/useSavedViews.ts) becomes profile-aware
- saved views no longer leak across workspaces

### 4. Jobs Storage

#### Local Fallback Path

Current fallback behavior writes one global jobs payload.

Proposed change:
- write fallback jobs to a workspace-specific key
- example: `job-tracker.jobs.fallback.<workspaceId>`

This keeps fallback behavior simple and avoids changing the `Job` object shape.

#### SQLite Path

Current SQLite schema stores all jobs in a single `jobs` table with no owner field.

Proposed schema change:

```sql
ALTER TABLE jobs ADD COLUMN workspaceId TEXT;
CREATE INDEX IF NOT EXISTS idx_jobs_workspace_id ON jobs(workspaceId);
```

Then make `workspaceId` required for all newly persisted rows.

Query behavior changes:
- `listJobs(workspaceId)` returns only rows for that workspace
- `replaceAllJobs(workspaceId, jobs)` replaces only that workspace's rows

This preserves the existing replace-all semantics while scoping them safely.

### 5. HTTP API Shape

Current API:
- `GET /api/jobs`
- `PUT /api/jobs`

Proposed API:
- `GET /api/jobs?workspaceId=<id>`
- `PUT /api/jobs?workspaceId=<id>`

Behavior:
- missing `workspaceId` should be rejected after migration is complete
- during compatibility rollout, missing `workspaceId` may temporarily map to the default workspace

Future compatibility note:
- server authorization should validate that the authenticated account has membership in the requested workspace
- client-side switching should not be treated as proof of authorization

### 6. Backup Storage and Snapshot Format

Current backup code assumes one global workspace.

Profile-aware changes:
- backup config key becomes workspace-scoped
- backup state key becomes workspace-scoped
- auto-backup localStorage artifacts become workspace-scoped

Example keys:
- `job-tracker.backup-config.<workspaceId>`
- `job-tracker.backup-state.<workspaceId>`
- `job-tracker.auto-backup.<workspaceId>.<timestamp>`

#### Snapshot Schema

Current snapshot shape:

```ts
interface BackupSnapshot {
  kind: 'job-tracker-backup'
  schemaVersion: 1
  createdAt: string
  jobs: Job[]
}
```

Proposed snapshot shape:

```ts
interface BackupSnapshotV2 {
  kind: 'job-tracker-backup'
  schemaVersion: 2
  createdAt: string
  workspaceId: string
  workspaceDisplayName?: string
  jobs: Job[]
}
```

Reason:
- backups should declare which workspace they belong to
- restore preview can warn when restoring into a different active workspace

Future compatibility note:
- backup metadata should remain workspace-scoped, not account-scoped
- admin/system configuration should not be bundled into normal user workspace backups by default

### 7. Import/Export

Exports should be scoped to the active workspace only.

For v2.8.0, keep import/export behavior simple:
- export only current workspace jobs
- import into current workspace only
- show active workspace name in import/export confirmation text

Optional filename improvement:
- `job-tracker-<workspaceDisplayName>-backup-<timestamp>.json`

---

## Migration Strategy

### Migration Goal

Move all single-workspace installations into a valid default-workspace model with no visible data loss.

### Migration Steps

1. Create workspace registry if none exists.
2. Create one default workspace.
3. Set `currentWorkspaceId` to the default workspace.
4. Migrate global AI config into `job-tracker.ai-config.<defaultWorkspaceId>`.
5. Migrate global user profile into `job-tracker.user-profile.<defaultWorkspaceId>`.
6. Migrate saved views into `jobTracker.savedViews.v1.<defaultWorkspaceId>`.
7. Migrate fallback job storage into `job-tracker.jobs.fallback.<defaultWorkspaceId>`.
8. Migrate backup state/config/artifacts into workspace-scoped keys.
9. For SQLite stores, backfill `workspaceId` on all existing rows with the default workspace id.
10. Leave legacy keys readable for one release only if rollback safety is desired.

### Migration Rules

- Migration must be idempotent.
- Migration must run before any workspace-scoped reads.
- Failed migration should fall back to a safe single-workspace default and log the error.

### Future Auth Migration Note

If a later release adds authentication, a second migration layer should map local workspaces into authenticated workspaces, rather than trying to reinterpret them as user accounts.

---

## UI and UX Changes

### App Shell

Add an active workspace control near the profile/settings actions.

Minimum UI:
- active workspace name
- switch workspace menu
- create new workspace action

### Profile View

Extend the profile screen to support workspace management:
- switch workspace
- create workspace
- rename workspace
- duplicate current workspace
- archive inactive workspace

### Future Auth/Admin UI Constraint

If authentication is introduced later:
- workspace switching should remain separate from login/logout controls
- admin configuration should live in a dedicated admin/settings surface
- normal profile editing should remain distinct from account security management

### Messaging Requirements

The active workspace should be visible in:
- profile page
- import/export dialogs
- backup/restore screens
- settings pages that affect AI config

### Safety Rules

- destructive actions must mention the active workspace
- restore and replace import flows must explicitly name the target workspace
- archived workspaces should be hidden from normal switching but recoverable

---

## Service and Module Changes

### New Modules Recommended

- `src/services/workspaceService.ts`
  - registry CRUD
  - current workspace resolution
  - migration bootstrap

- `src/hooks/useWorkspace.ts`
  - active workspace state
  - switch/create/rename/archive actions

### Existing Modules to Update

- [src/storage/aiStorage.ts](../src/storage/aiStorage.ts)
- [src/features/savedViews/useSavedViews.ts](../src/features/savedViews/useSavedViews.ts)
- [src/services/storageService.ts](../src/services/storageService.ts)
- [src/services/apiClient.ts](../src/services/apiClient.ts)
- [src/features/backup/backupService.ts](../src/features/backup/backupService.ts)
- backup scheduler/storage helpers
- profile-related views/components

### Backend Changes

- [backend/jobsApi.ts](../backend/jobsApi.ts): accept and validate `workspaceId`
- [backend/sqliteStore.ts](../backend/sqliteStore.ts): add `workspaceId` column and workspace-scoped queries

### Future Modules Likely Needed (Not in v2.8.0)

- `src/services/authService.ts`
- `src/services/workspaceMembershipService.ts`
- `src/services/appConfigService.ts`
- `src/hooks/useAuthSession.ts`
- admin-oriented views for app configuration and member management

---

## Testing Strategy

### Unit Tests

Add tests for:
- workspace registry CRUD
- active-workspace resolution
- migration from legacy single-user keys
- saved-view isolation by workspace
- AI profile/config isolation by workspace
- backup key generation and parsing with workspace scope

### Integration Tests

Add tests for:
- switching workspace updates data sources used by hooks/services
- import/export flows reflect active workspace
- workspace duplication copies only allowed workspace-scoped data

### E2E Tests

Add flows for:
- create second workspace
- switch workspaces
- verify job list isolation
- verify saved view isolation
- verify backup/import messaging names active workspace

### Regression Risk to Watch

The highest-risk failure is silent data bleed across workspaces. Isolation tests should be treated as release-blocking.

---

## Implementation Sequence

### Phase 1: Foundations

1. Add workspace registry types and storage service.
2. Add active workspace resolver hook/service.
3. Add startup migration from single-user storage.

### Phase 2: Client Storage Scoping

1. Make AI config/profile storage profile-aware.
2. Make saved views storage profile-aware.
3. Make backup config/state/artifacts workspace-aware.
4. Make fallback jobs storage workspace-aware.

### Phase 3: Persistence Boundary Updates

1. Update `storageService` and `apiClient` to require `profileId`.
2. Update backend API to accept `profileId`.
3. Add SQLite `profileId` column and scoped queries.
4. Backfill existing SQLite rows to the default profile.

### Phase 4: UI Integration

1. Add shell-level active workspace switcher.
2. Extend workspace management UI.
3. Update import/export/backup screens with active-workspace messaging.

### Phase 5: Validation and Hardening

1. Add unit and integration isolation tests.
2. Add E2E workspace-switching flows.
3. Run migration testing against legacy localStorage and SQLite states.

---

## Open Questions

1. Should workspace duplication copy jobs, or only preferences and saved views?
Recommended default: copy preferences and saved views only, not jobs.

2. Should archived workspaces retain backups?
Recommended default: yes, until explicitly deleted.

3. Should import allow importing a backup from a different workspace?
Recommended default: yes, but require an explicit confirmation naming both source and target workspaces.

4. Should workspace identity ever appear inside exported jobs?
Recommended default: no. Keep exported jobs portable; store workspace identity only in backup metadata.

5. How should future admin privileges be modeled?
Recommended default: as account membership roles plus a separate admin-only app configuration domain, not as a special profile type.

6. Should a future authenticated release reuse `profileId` terminology?
Recommended default: no. Internally migrate terminology toward `workspaceId` once server-backed auth is introduced.

---

## Recommendation

For v2.8.0, implement **profile workspaces** as a local-only, one-active-profile-at-a-time system. This solves the immediate multi-user problem with low architectural risk and keeps the door open for a future team/collaboration model without forcing auth complexity now.

If login/password, roles, and permissions are added later, they should be layered on top of this design by introducing `Account`, `WorkspaceMembership`, and `AppConfig` models rather than by mutating local workspaces into account records.
