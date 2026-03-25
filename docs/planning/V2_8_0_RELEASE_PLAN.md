# Job Tracker v2.8.0 Release Plan

**Updated:** March 25, 2026  
**Target Window:** Q3 2026  
**Release Theme:** Performance, Accessibility, Workspace Separation, and Reliability  
**Status:** Planning, resynced to current codebase

## Current Baseline

This plan now uses the current post-v2.7.4 codebase as its starting point, not the older v2.7.0 release snapshot.

- Current validated baseline: 79 test files, 684 passing tests, 10 passing Playwright tests
- Current release baseline: `v2.7.4`
- Current branch shape: architecture cleanup landed after `v2.7.4`, including:
  - `App.tsx` reduced to a thin composition shell
  - table rendering split into context-driven subcomponents under `src/views/table/`
  - settings split into focused sections under `src/views/settings/`
  - SQLite responsibilities split into focused modules under `backend/sqlite/`
  - `pnpm` standardized across local scripts, CI, and E2E startup

Current live status is documented in:

- `docs/planning/NEXT_STEPS.md`
- `docs/ARCHITECTURE.md`

Related design references for this release:

- `docs/PERFORMANCE_BASELINE.md`
- `docs/planning/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md`
- `docs/planning/V2_8_0_FORGEJO_ISSUES.md`

## Release Intent

v2.8.0 should focus on the areas that are still clearly missing from the current product:

1. measurable performance work on known hot paths
2. a real accessibility audit and remediation pass
3. local workspace separation for multiple job-search tracks
4. E2E coverage for destructive and workspace-sensitive workflows

Earlier ideas about “advanced workflow intelligence” are no longer the primary differentiator for this release because many of those user-facing capabilities already shipped in `v2.7.x`.

## Track Status Against Current Repo

### P1: Performance Hardening

**Status:** prepared, not executed

What already exists:

- `docs/PERFORMANCE_BASELINE.md` defines target interactions, measurement steps, and budgets
- the current codebase has identified hot paths worth optimizing

What is still missing:

- actual recorded baseline numbers
- any merged optimization work tied to those measurements
- any enforced performance budget in CI or release validation

Known current hot spots:

- `src/views/AnalyticsView.tsx` performs several synchronous analytics calculations on render
- `src/hooks/useTablePipeline.ts` performs a redundant pre-sort before the user-selected sort
- score-based sorting still has potentially expensive per-comparison work

### P2: Accessibility Audit and Remediation

**Status:** groundwork present, release-track work not started

What already exists:

- shared keyboard/a11y utilities in `src/utils/a11yUtils.ts`
- many components already use `aria-*` attributes and keyboard affordances
- recent test cleanup removed the known `StatusCell` table-semantic warning in tests

What is still missing:

- a formal keyboard-navigation and screen-reader audit
- a prioritized remediation checklist
- accessibility-specific regression tests for the issues fixed
- a documented “done” standard for core CRUD/filter/import/settings flows

### P3: Workspace Separation Foundations

**Status:** design complete, implementation not started

What already exists:

- a detailed design doc in `docs/planning/V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md`
- a decomposed issue breakdown in `docs/planning/V2_8_0_FORGEJO_ISSUES.md`

What is still missing in live code:

- workspace domain types
- workspace registry/service/provider
- active workspace switcher UI
- workspace-scoped localStorage keys
- workspace-aware API requests
- workspace-aware SQLite persistence
- migration from the current single-workspace model

Current code still reflects a single-workspace model:

- AI config and user profile use single global keys in `src/storage/aiStorage.ts`
- `/api/jobs` does not accept a `workspaceId`
- SQLite job persistence has no workspace column or workspace-scoped query path

### P4: Workflow and Filtering Enhancements

**Status:** needs rescoping

Much of the original intent for this track has already landed in `v2.7.x`:

- saved views
- full-text search
- task views
- backup and restore workflows
- analytics drill-down and stuck-job workflows

For `v2.8.0`, this track should be treated as targeted quality-of-life work only, for example:

- improving saved-view ergonomics
- reducing clicks in common task triage flows
- clearer import/export and backup messaging

This track should not expand into another broad feature bucket unless the workspace and reliability tracks are already on track.

### P5: E2E and Reliability Expansion

**Status:** partially started

What already exists:

- Playwright is configured and stable
- the suite covers smoke, CRUD, filter/sort, navigation, analytics drill-down, stuck-job modal flows, and profile/settings persistence

What is still missing:

- bulk operations coverage
- import/export coverage
- drag-drop coverage
- backup/restore destructive-flow coverage
- workspace creation/switch/isolation coverage

This is the clearest near-term gap even if workspace work has not started yet.

## Must Have Scope

### 1. Record and act on the performance baseline

- populate `docs/PERFORMANCE_BASELINE.md` with real measurements
- fix the highest-value confirmed bottlenecks
- verify no correctness regressions in filtering, sorting, pagination, or analytics output

### 2. Complete an accessibility pass for primary workflows

- audit keyboard navigation and focus order
- remediate table, modal, and status-message issues
- add tests for the highest-risk interaction fixes

### 3. Implement local workspace separation

- add a workspace registry plus active workspace resolution
- make jobs, saved views, AI config, user profile, and backup state workspace-aware
- add migration from current single-workspace installs
- add shell/profile UI for switching and managing workspaces

### 4. Expand destructive-path E2E coverage

- bulk operations
- import/export
- backup/restore
- workspace isolation

## Should Have Scope

- workspace duplication and archive flows polished
- improved import/export and backup UX copy naming the active workspace
- release checklist updates that explicitly include workspace and destructive-flow validation
- performance and accessibility standards documented in live docs

## Could Have Scope

- AI-assisted interview preparation guidance
- timeline-style visualization for pipeline momentum

These should stay out of scope unless the Must Have tracks are already complete.

## Success Criteria

### Performance

- baseline measurements are recorded and committed to docs
- at least one or two confirmed bottlenecks are improved with measurable gains
- no regressions in existing filter/sort/analytics behavior

### Accessibility

- core CRUD, filtering, settings, and import-related flows are keyboard-operable
- no known high-severity internal a11y audit issues remain open

### Workspace Separation

- users can switch between local workspaces without seeing mixed jobs, saved views, AI settings, or profile data
- active workspace context is visible in shell and destructive flows
- existing users migrate into a safe default workspace with no visible data loss

### Reliability

- destructive flows are covered by deterministic Playwright tests
- release validation is repeatable and documented

## Release Gates

### Gate 1: Baseline Captured

- [ ] performance baseline measurements recorded
- [ ] current E2E gaps confirmed and prioritized
- [ ] workspace implementation sequence agreed

### Gate 2: Core Feature Complete

- [ ] workspace-scoped data model implemented
- [ ] single-workspace migration implemented
- [ ] accessibility remediation complete for primary flows
- [ ] initial performance fixes merged
- [ ] destructive-path E2E tests implemented

### Gate 3: Release Candidate

- [ ] full unit/integration suite passing
- [ ] full E2E release suite passing
- [ ] production build passing
- [ ] docs updated
- [ ] release notes prepared

## Risks and Mitigations

- Risk: performance changes introduce subtle behavioral regressions
  - Mitigation: pair every optimization with regression tests and measured before/after numbers

- Risk: accessibility fixes change interaction behavior unexpectedly
  - Mitigation: validate fixes at the behavior-test level, not only visually

- Risk: workspace scoping causes silent data bleed
  - Mitigation: make workspace context explicit at every storage boundary and add isolation tests at service, backend, and E2E levels

- Risk: scope creep dilutes the release
  - Mitigation: keep workspace, performance, accessibility, and destructive-flow reliability as the only Must Have tracks

## What This Plan Is Not

This plan is not a restatement of work already shipped in `v2.7.x`.

The following are already part of the current product baseline and should not be treated as `v2.8.0` headline deliverables:

- analytics dashboard and drill-down
- task views and priority/snooze flows
- saved views
- full-text search
- backup scheduling and restore diff preview
- AI/profile persistence

## Revision History

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2026-03-11 | 1.0 | Copilot | Initial v2.8.0 release planning document |
| 2026-03-11 | 1.1 | John | Addition of profile switching |
| 2026-03-11 | 1.2 | Copilot | Linked profile workspaces technical design |
| 2026-03-11 | 1.3 | Copilot | Shifted plan to workspace-first framing for job-class separation |
| 2026-03-25 | 2.0 | Codex | Rebased plan on current post-v2.7.4 codebase and marked per-track implementation status |
