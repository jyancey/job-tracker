# Job Tracker Next Steps Plan (Post v2.3.1)

This document captures the next phase of work to move Job Tracker from a solid CRUD tracker into a decision-support tool for job search execution.

## Goals

- Improve decision quality (where to focus applications and interview prep)
- Improve daily execution (what to do today/this week)
- Improve reliability and confidence (safe data operations, stronger test coverage)
- Keep architecture maintainable as features scale

## Prioritized Workstreams

## 1) Pipeline Intelligence (Highest ROI)

### Outcomes
- Understand conversion rates between stages
- Identify bottlenecks and stalled applications
- Track weekly momentum

### Features
- Stage conversion metrics:
  - `Wishlist -> Applied`
  - `Applied -> Phone Screen`
  - `Phone Screen -> Interview`
  - `Interview -> Offer`
- Median time-in-stage by status
- "Stuck" alerts (jobs in stage beyond configurable threshold)
- Weekly trend cards:
  - New applications
  - Interview count
  - Offers

### Acceptance Criteria
- Dashboard displays conversion and trend metrics correctly
- Metrics update in real time when jobs are created/edited/deleted
- Unit tests validate conversion/time calculations and edge cases

## 2) Action System Upgrade

### Outcomes
- App drives daily activity, not just record keeping
- Faster follow-up execution

### Features
- "Today" and "This Week" task views using `nextAction` and due dates
- Priority levels for actions (Low/Medium/High)
- Snooze support for tasks
- Optional local notifications for due/overdue actions

### Acceptance Criteria
- Users can complete daily follow-ups from a dedicated task surface
- Overdue tasks are clearly highlighted and filterable
- Notification logic can be toggled on/off safely

## 3) Application Quality Scoring

### Outcomes
- Better allocation of effort across opportunities

### Features
- Per-job weighted score based on criteria (fit, compensation, location, growth, confidence)
- Ranking/sorting by score
- Side-by-side compare view for shortlisted jobs

### Acceptance Criteria
- Scoring model is transparent and user-adjustable
- Sorting and compare behavior remain fast on larger datasets
- Export includes scoring fields when present

## 4) Search and Saved Views

### Outcomes
- Reduce repeated filtering and navigation friction

### Features
- Full-text search across company, role, notes, contact person
- Save reusable filter presets ("Saved Views")
- Quick access to saved views in toolbar

### Acceptance Criteria
- Search is responsive and accurate across key fields
- Saved views persist locally and restore correctly

## 5) Reliability and Data Safety

### Outcomes
- Reduce fear of data loss or destructive mistakes

### Features
- Backup snapshots (JSON and/or SQLite) with restore points
- Import preview with diff before replace operations
- Improved error handling and user-friendly recovery states

### Acceptance Criteria
- Restore flow can recover from accidental replace/import issues
- Risky actions show clear confirmation and impact summary
- Error boundaries prevent full app crashes on recoverable UI faults

## 6) Engineering Foundation (Parallel Track)

### Outcomes
- Faster and safer feature delivery in future releases

### Work
- Continue decomposing `src/App.tsx` into focused hooks/modules
- Reduce prop drilling (Table view context/provider pattern)
- Add `ErrorBoundary` component and fallback UX
- Add Playwright smoke tests for critical workflows:
  - Add/edit/delete
  - Filtering and bulk delete
  - Import/export basics

### Acceptance Criteria
- App-level state logic is easier to reason about and test
- CI includes stable smoke coverage for top user paths

## Suggested Release Sequence

## v2.4.0 (Focus: Insight + Execution)
- Pipeline Intelligence MVP
- Task views (Today/This Week)
- Initial saved views

## v2.5.0 (Focus: Decision Quality)
- Application Quality Scoring
- Compare view
- Search enhancements

## v2.6.0 (Focus: Safety + Scale)
- Backup/restore workflow
- Import preview/diff
- Expanded E2E + architecture hardening

## Implementation Notes

- Keep changes iterative and test-backed; avoid one large rewrite PR.
- Prefer feature flags/toggles for bigger UX changes.
- Preserve backward compatibility for existing exported data where practical.
- Update README release notes and migration notes at each minor release.

## Immediate Next Sprint Proposal (2 Weeks)

### Week 1
- Build conversion/time-in-stage metrics + dashboard cards
- Add core calculation tests and fixtures

### Week 2
- Build Today/This Week task view + overdue highlighting
- Add saved view MVP (create/apply/delete presets)

### Done Definition for Sprint
- Feature complete with tests
- `npm run build` and full test suite passing
- Documentation updated (`README.md` + release notes)
