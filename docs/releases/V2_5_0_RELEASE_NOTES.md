# Job Tracker v2.5.0 Release Notes

**Date:** Historical release (pre-v2.6.0)  
**Release Type:** Decision quality + workflow efficiency release  
**Status:** Released

## Summary

v2.5.0 improved daily decision quality by introducing weighted application scoring and side-by-side opportunity comparison, then reduced triage friction with full-text search and persistent saved views.

This release moved Job Tracker beyond basic record keeping into structured prioritization and faster execution workflows.

## Highlights

- Application quality scoring introduced:
  - Weighted criteria model (fit, compensation, location, growth, confidence)
  - Per-job scoring and ranking
  - Compare view for side-by-side shortlisted opportunities
  - Adjustable scoring profile behavior
- Search and saved views delivered:
  - Debounced full-text search across core fields
  - Search result highlighting
  - Persistent saved view presets for repeat workflows
  - Faster toolbar-based context switching
- Quality baseline advanced:
  - +82 tests added in the release cycle
  - Strong test coverage for scoring/search/view behavior

## Validation Snapshot

- Test files: 62
- Passing tests: 497/497
- Pass rate: 100%
- Production build: passing
- Known release note: no blocking defects carried at release close

## Notable Delivery Areas

### Feature 3: Application Quality Scoring (A3)

Delivered capabilities:
- Weighted scoring for each job opportunity
- Ranking/sorting by score
- Compare view with side-by-side differences
- User-adjustable scoring model inputs

Representative test files:
- `jobScoring.test.ts`
- `scoring.test.ts`
- `CompareView.test.tsx`

### Feature 4: Search and Saved Views (A4)

Delivered capabilities:
- Full-text search across company, role, notes, and contact context
- 300ms debounced search for responsiveness
- Multi-field matching logic
- Highlighted query matches in UI
- Saved views with persistence and quick reuse

Representative test files:
- `searchJobs.test.ts`
- `useSavedViews.test.ts`
- `HighlightedText.test.tsx`

## Release Risk Assessment

- Functional regression risk: low (core feature paths covered by targeted unit/component tests)
- UX adoption risk: low (features integrated into existing workflow surfaces)
- Operational risk: low (stable test/build baseline retained)

## Final Review Checklist

- [x] Scoring and compare workflows validated
- [x] Search and saved views validated
- [x] Full suite passing at release close
- [x] Production build passing

## Suggested Tag Message

v2.5.0: weighted opportunity scoring, compare view, and search/saved views delivered with 497-test validation baseline.
