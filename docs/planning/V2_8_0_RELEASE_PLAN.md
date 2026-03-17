# Job Tracker v2.8.0 Release Plan

**Release Window:** Q3 2026  
**Release Theme:** Performance, Accessibility, Workspace Separation, and Advanced Workflow Intelligence  
**Status:** Planning

---

## Overview

v2.8.0 builds on the stabilized v2.7.0 architecture. The release prioritizes measurable runtime performance gains, a formal accessibility pass, workspace separation for distinct job-search tracks, and advanced decision-support capabilities that improve daily execution quality for users.

## Baseline (from v2.7.0 release)

- 681 passing tests across 78 test files
- Production build green
- Service-layer boundaries finalized
- App decomposition completed

**Technical Design:** [V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md](./V2_8_0_PROFILE_WORKSPACES_TECHNICAL_DESIGN.md)

## Release Goals

### Must Have

1. Performance optimization pass for table-heavy and analytics-heavy workflows.
2. Accessibility pass targeting WCAG 2.1 AA for core user journeys.
3. Workspace separation for distinct job classes, resumes, and search strategies.
4. Advanced filtering and workflow refinements for faster daily triage.
5. Expanded E2E coverage for critical and destructive paths.

### Should Have

1. Workspace UX improvements (switcher, duplication, workspace-specific defaults).
2. Improved import/export and backup ergonomics (preview clarity and safety prompts).
3. Additional documentation for performance and accessibility standards.

### Could Have

1. AI-assisted interview preparation guidance.
2. Timeline visualization for pipeline momentum.

---

## Detailed Scope

### Track P1: Performance Hardening

- Optimize expensive filter/sort/render paths for large datasets.
- Introduce focused memoization and render-boundary checks in high-frequency components.
- Define and track performance budgets for key views.

**Success Criteria:**
- Table interactions remain responsive for large job sets.
- No regressions in correctness or sorting/filtering behavior.
- Build size remains stable or improved.

### Track P2: Accessibility Audit and Remediation

- Audit keyboard navigation, focus order, and screen-reader labeling in core flows.
- Address semantic issues in table and modal interactions.
- Add missing accessibility tests where practical.

**Success Criteria:**
- Core CRUD/filter/import workflows keyboard-operable.
- No high-severity a11y issues in internal audit.

### Track P3: Workspace Separation Foundations

**Primary Product Outcome:**
- One user can maintain multiple workspaces for different job classes.
- Each workspace can have different jobs, a different resume/profile, different AI preferences, and different saved views.
- Workspace switching should create clear separation between these job-search tracks.

**Recommended Simple Implementation Approach:**
- Avoid authentication, shared collaboration, and permissions in v2.8.0.
- Support multiple local workspaces on the same installation, with one active workspace at a time.
- Scope user-specific data by `workspaceId`, so each workspace gets isolated jobs, saved views, AI settings, backups, and resume/profile preferences.

**Implementation Shape:**
- Introduce a lightweight workspace model:
  - `id`
  - `displayName`
  - `createdAt`
  - `updatedAt`
  - optional UI metadata such as color/avatar initial
- Add `currentWorkspaceId` persistence and a workspace switcher in the shell/profile area.
- Replace the single global storage model with workspace-scoped records.
- Add `workspaceId` ownership to user-scoped entities:
  - jobs
  - saved views
  - AI config and user profile
  - backups and restore metadata
- Default all reads and writes to the active workspace context.

**Why this is the simplest path:**
- No login, password reset, or session management.
- No server-side auth or cross-user permissions model.
- Preserves the current local-first product direction.
- Solves the immediate problem: users can keep job classes clearly separated, and more than one person can safely use the same app instance without mixing data.

**Concrete Workspace Improvements:**
- Add workspace switcher UI in header/profile screen.
- Support create, rename, archive, and duplicate workspace.
- Add workspace-specific defaults for AI scoring preferences and saved views.
- Show active workspace clearly in the shell and import/export flows.

**Success Criteria:**
- One user can switch between workspaces for different job classes without seeing mixed jobs, resumes, or saved views.
- AI scoring uses the active workspace profile only.
- Import/export and backup actions are clearly scoped to the current workspace.
- Existing single-user installs migrate automatically into a default workspace.

### Track P4: Workflow and Filtering Enhancements

- Add advanced filtering quality-of-life controls.
- Improve saved-view workflows for rapid context switching.
- Expand task triage and due-date workflow usability.

**Success Criteria:**
- Reduced clicks for common daily workflows.
- No behavior regressions in existing saved view/task flows.

### Track P5: E2E and Reliability Expansion

- Add E2E tests for workspace creation, workspace switching, and scoped data isolation.
- Add E2E tests for import/replace safety, backup/restore, and bulk operations.
- Strengthen release validation checklist and smoke coverage.

**Success Criteria:**
- Critical end-user workflows covered by deterministic E2E tests.
- Release candidate validation is repeatable and documented.

### Migration Notes

- On first run after upgrade, convert the current single stored profile/workspace into a default workspace record.
- Attach existing jobs and saved views to that default `workspaceId`.
- Preserve backward compatibility for users who never create a second profile.

---

## Gates

### Gate 1: Mid-Release Architecture and Performance

- [ ] Performance baseline captured
- [ ] Initial optimization changes merged
- [ ] No regression in unit/integration suite

### Gate 2: Feature Complete

- [ ] Workspace-scoped data separation implemented
- [ ] Single-workspace to default-workspace migration implemented
- [ ] Accessibility remediation complete for primary workflows
- [ ] Advanced filtering/workflow enhancements complete
- [ ] E2E scenarios for destructive operations implemented

### Gate 3: Release Candidate

- [ ] Full test suite passing
- [ ] Production build passing
- [ ] Final code review complete
- [ ] Release notes prepared

---

## Risks and Mitigations

- Risk: Performance changes introduce subtle behavior regressions.
  - Mitigation: Add targeted regression tests for filter/sort/pagination edge cases.
- Risk: Accessibility fixes alter UI behavior unexpectedly.
  - Mitigation: Pair semantic updates with interaction-level tests.
- Risk: Workspace scoping leaks data between job-search tracks.
  - Mitigation: Make `workspaceId` mandatory in workspace-scoped storage paths and add isolation tests at service and E2E layers.
- Risk: Scope creep from new feature ideas.
  - Mitigation: Keep Must Have scope strict and defer non-critical items.

---

## Validation Checklist (Release Day)

- [ ] Full unit/integration suite passes
- [ ] E2E release smoke suite passes
- [ ] Production build succeeds
- [ ] Documentation updated (README, NEXT_STEPS, roadmap)
- [ ] Release notes and tag message approved

---

## Revision History

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2026-03-11 | 1.0 | Copilot | Initial v2.8.0 release planning document |
| 2026-03-11 | 1.1 | John | Addition of profile switching |
| 2026-03-11 | 1.2 | Copilot | Linked profile workspaces technical design |
| 2026-03-11 | 1.3 | Copilot | Shifted plan to workspace-first framing for job-class separation |
