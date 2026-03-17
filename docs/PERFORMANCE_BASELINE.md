# Performance Baseline

> v2.8.0 track · P1 · Issue #1

Establishes a documented baseline for the five most latency-sensitive interactions in the table and analytics views. All future optimization work in the v2.8.0 release must reference these numbers to demonstrate measurable improvement.

---

## 1. Latency-Sensitive Interactions

Five interactions were identified by tracing the data path from user gesture to visible result:

| # | Interaction | Affected Code Path |
|---|-------------|-------------------|
| **I-1** | Initial data load | `loadJobs()` → `GET /api/jobs` → SQLite `listJobs()` → React state |
| **I-2** | Filter/search input | `useJobFiltering` → `searchJobs` + predicate chain → table re-render |
| **I-3** | Column sort | `useJobSorting` (sort + optional score calc) → `useJobPagination` → table re-render |
| **I-4** | Analytics view open | `AnalyticsView` render: 5 synchronous metric functions × N jobs |
| **I-5** | Job save (add or edit) | Form submit → `saveJobs()` → `PUT /api/jobs` → SQLite transaction → UI update |

### Why these five

- **I-1** blocks the entire UI on startup; any regression here is immediately visible.
- **I-2** runs on every keystroke in the search box; perceived sluggishness degrades the filtering UX.
- **I-3** runs a full array clone + comparison sort; `calculateJobScore` adds per-row cost when sorting by score.
- **I-4** executes five O(N) passes over the jobs array synchronously during render with no memoization.
- **I-5** is the primary write path; a slow save creates anxiety about data loss.

---

## 2. Measurement Methodology

### Environment

Record all baselines in the **same environment** to keep numbers comparable:

| Parameter | Value |
|-----------|-------|
| Browser | Chrome (latest stable) |
| DevTools throttling | **None** (record native speed) |
| Network throttling | **None** for I-1/I-5; N/A for I-2/I-3/I-4 |
| Dataset size | 50 jobs · 200 jobs · 500 jobs (three runs each) |
| Hardware | Record machine specs alongside results |

### Tools

- **I-1, I-5 — network round-trips:** Read from `[storage] loaded jobs` / `[storage] saved jobs` log entries already emitted by `storageService.ts` via `logStorageInfo`. Enable storage debug logging with `setStorageDebugLogging(true)` in the browser console.
- **I-2, I-3, I-4 — client computation + render:** Use the **React DevTools Profiler** ("Record" → trigger interaction → stop). Capture the total commit duration for the relevant component subtree.
- **Cross-check with Performance API:** Open DevTools → Performance tab → record a trace. Identify the task boundaries around each interaction using the flame chart.

### How to record each interaction

**I-1 — Initial load**
1. Open DevTools Console.
2. Run `setStorageDebugLogging(true)`.
3. Hard-reload the page (Cmd+Shift+R / Ctrl+Shift+R).
4. Read `durationMs` from the `loaded jobs` console entry.
5. Also note the time-to-interactive: when the table first shows data (LCP proxy via Performance tab).

**I-2 — Filter/search**
1. Load the app with the target dataset.
2. Open React DevTools Profiler and start recording.
3. Type a 3-character search string into the filter box (one character at a time).
4. Stop recording. Note the commit duration for the worst single keystroke.

**I-3 — Column sort**
1. Load the app with the target dataset, table view visible.
2. Open React DevTools Profiler and start recording.
3. Click the **Company** column header (string sort, fastest path).
4. Click the **Score** column header (triggers `calculateJobScore` per row, most expensive path).
5. Stop recording. Record both commit durations.

**I-4 — Analytics view open**
1. Start with the table view active (analytics not yet rendered).
2. Open React DevTools Profiler and start recording.
3. Click the **Analytics** nav item.
4. Stop recording. Record the first commit duration (cold render of `AnalyticsView`).

**I-5 — Job save**
1. Enable storage debug logging (`setStorageDebugLogging(true)`).
2. Open an existing job and make a minor edit (e.g., change the notes field).
3. Save the job.
4. Read `durationMs` from the `saved jobs` console entry.

---

## 3. Baseline Measurements

> Fill in the table below after running the measurement protocol above.
> Record the **median of 3 runs** for each cell.

### 50-job dataset

| Interaction | Metric | Recorded value | Date | Notes |
|-------------|--------|----------------|------|-------|
| I-1 Initial load | `loadJobs` API round-trip (ms) | — | — | — |
| I-1 Initial load | Time to table visible (ms) | — | — | — |
| I-2 Filter (keystroke) | Worst commit duration (ms) | — | — | — |
| I-3 Sort — company | Commit duration (ms) | — | — | — |
| I-3 Sort — score | Commit duration (ms) | — | — | — |
| I-4 Analytics open | First commit duration (ms) | — | — | — |
| I-5 Job save | `saveJobs` API round-trip (ms) | — | — | — |

### 200-job dataset

| Interaction | Metric | Recorded value | Date | Notes |
|-------------|--------|----------------|------|-------|
| I-1 Initial load | `loadJobs` API round-trip (ms) | — | — | — |
| I-1 Initial load | Time to table visible (ms) | — | — | — |
| I-2 Filter (keystroke) | Worst commit duration (ms) | — | — | — |
| I-3 Sort — company | Commit duration (ms) | — | — | — |
| I-3 Sort — score | Commit duration (ms) | — | — | — |
| I-4 Analytics open | First commit duration (ms) | — | — | — |
| I-5 Job save | `saveJobs` API round-trip (ms) | — | — | — |

### 500-job dataset (stress)

| Interaction | Metric | Recorded value | Date | Notes |
|-------------|--------|----------------|------|-------|
| I-1 Initial load | `loadJobs` API round-trip (ms) | — | — | — |
| I-1 Initial load | Time to table visible (ms) | — | — | — |
| I-2 Filter (keystroke) | Worst commit duration (ms) | — | — | — |
| I-3 Sort — company | Commit duration (ms) | — | — | — |
| I-3 Sort — score | Commit duration (ms) | — | — | — |
| I-4 Analytics open | First commit duration (ms) | — | — | — |
| I-5 Job save | `saveJobs` API round-trip (ms) | — | — | — |

---

## 4. Acceptable Thresholds

These thresholds define the performance contract for v2.8.0. Any optimization work must bring measurements within budget; any regression must be caught and reverted.

| Interaction | Metric | Budget | Rationale |
|-------------|--------|--------|-----------|
| I-1 Initial load | `loadJobs` API round-trip | **≤ 200 ms** | SQLite on local disk; >200 ms indicates a schema or query problem |
| I-1 Initial load | Time to table visible | **≤ 500 ms** | RAIL "Response" budget for page load; includes hydration |
| I-2 Filter/search | Per-keystroke commit duration | **≤ 16 ms** (50 jobs) · **≤ 50 ms** (200 jobs) | 16 ms = one frame at 60 fps; search box debounce is already in place but sync filter must complete within a frame for small datasets |
| I-3 Column sort | Commit duration (string columns) | **≤ 16 ms** (200 jobs) | One frame; sorting is synchronous and blocking |
| I-3 Column sort | Commit duration (score column) | **≤ 50 ms** (200 jobs) | Score calc adds per-row cost; 50 ms is perceptible but acceptable given the infrequency of score sorts |
| I-4 Analytics open | First render commit | **≤ 100 ms** (200 jobs) | Analytics is navigated to infrequently; 100 ms is acceptable for a cold compute |
| I-5 Job save | `saveJobs` API round-trip | **≤ 300 ms** | Write transaction includes DELETE + bulk INSERT; 300 ms is the upper limit before users perceive lag on save |

### Threshold rationale summary

```
< 16 ms   — invisible (one frame at 60 fps)
16–50 ms  — imperceptible on most interactions
50–100 ms — perceptible but tolerable for infrequent actions
100–300 ms — noticeable; acceptable only for heavy, infrequent operations
300–1000 ms — slow; degrades confidence
> 1000 ms — unacceptable; blocks the user
```

---

## 5. Known Risk Areas (pre-baseline)

The following patterns were identified during code review as likely to show elevated latency at scale, even before measurements are recorded:

1. **`AnalyticsView` — no memoization.** All five metric functions (`calculateConversionMetrics`, `calculateWeeklyTrends`, `calculateTimeInStage`, `findStuckJobs`, `calculateStatusDistribution`) run synchronously on every render with no `useMemo`. At 500 jobs this will likely exceed the 100 ms threshold.

2. **`useJobSorting` — score column.** `calculateJobScore` is called inside the comparator, meaning it runs once per comparison (up to O(N log N) calls), not once per job. This will likely exceed budget at 200+ jobs sorted by score.

3. **`useTablePipeline` — double sort.** The pipeline calls `useJobSorting` twice: once with a hardcoded `applicationDate/desc` to compute `tempTotalPages`, then again with the user-selected sort. The first call is wasted work on every render cycle.

4. **`replaceAllJobs` — full table replace.** The save path deletes all rows and bulk-inserts the entire dataset. At 500 jobs this is a large transaction; WAL mode mitigates read contention but the write itself scales linearly.

These risk areas are candidates for the P2 optimization work in v2.8.0. Baseline numbers will confirm which are actually problematic.

---

## 6. Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-03-17 | — | Initial document; framework established, measurements pending |
