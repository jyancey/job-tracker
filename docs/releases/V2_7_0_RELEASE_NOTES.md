# Job Tracker v2.7.0 Release Notes

**Date:** March 11, 2026  
**Release Type:** Architecture hardening + quality release  
**Status:** Released

## Summary

v2.7.0 completes the architecture-hardening scope that followed v2.6.0: App orchestration was decomposed into focused hooks, service boundaries were tightened, compatibility wrappers were removed after migration, and regression safety increased with expanded tests.

**Release Decision:** GO approved and published on March 11, 2026.

## Highlights

- App-level decomposition completed:
  - `App.tsx` reduced to 19 lines
  - App orchestration moved into dedicated hooks and composition model
- Service-layer migration completed:
  - Direct usage of `src/services/*` modules across app and tests
  - Legacy compatibility wrappers removed (`src/storage.ts`, `src/exportImport.ts`)
- UI and UX fixes/polish included:
  - Job description display in modal fixed
  - Toolbar and hero label polish landed
  - Branding/logo/favicon updates integrated
- Validation remains green after all refactors:
  - Full test suite passing
  - Production build passing

## Validation Snapshot

- Test files: 78
- Passing tests: 681/681
- Pass rate: 100%
- Production build: passing
- Known non-blocking warning: existing `StatusCell` test logs a table-semantic warning in test environment

## Notable Refactoring Outcomes

- New/expanded app composition hooks in `src/hooks/`
- Table/task pipeline extraction (`useTablePipeline`, `useTaskData`)
- Saved-view and task-action orchestration isolated into dedicated hooks
- Service modules used as primary boundaries for storage and import/export paths

## Release Risk Assessment

- Functional regression risk: low (broad integration/unit coverage and repeated full-suite validation)
- Architectural risk: low (incremental migration with compatibility period, then wrapper removal)
- Operational risk: low (build and runtime workflows unchanged)

## Final Review Checklist

- [x] Final code review approval recorded
- [x] Documentation consistency pass completed across roadmap/status docs
- [x] Release tag and packaging approved

## Suggested Tag Message

v2.7.0: architecture hardening complete, service boundaries finalized, and 681-test validation baseline.
