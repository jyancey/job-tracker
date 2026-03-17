# Job Tracker

![Build Stats](http://localhost:3000/john/job-tracker/actions/workflows/build-test.yml/badge.svg)
![Release Badge](http://localhost:3000/john/job-tracker/actions/workflows/deploy.yml/badge.svg)
[![Release Badge](http://localhost:3000/john/job-tracker/actions/workflows/release.yml/badge.svg)](http://localhost:3000/john/job-tracker/releases)

A local-first, privacy-focused job application tracker built with React, TypeScript, and SQLite.

Track your search like a pipeline, not a spreadsheet. Manage opportunities, follow-ups, and monitor momentum from one workspace—all without leaving your browser.

## Features

- **Local-First Storage** — All data stays on your device in a real SQLite file (`data/job-tracker.sqlite` by default)
- **Privacy** — No cloud dependencies, data remains local on disk
- **Full CRUD** — Add, edit, view, and delete job applications
- **Smart Filtering** — Status, date range, salary range, and contact person filters
- **Sortable Columns** — Click headers to sort by company, role, status, dates
- **Bulk Operations** — Select multiple jobs, delete across filters with visibility controls
- **Multiple Views** — Analytics (default), Table, Kanban board, Calendar, Today, and This Week
- **AI Re-Analyze** — Re-run AI scoring directly from the job detail modal when you want a refreshed analysis
- **Import/Export** — JSON, CSV export; JSON import with merge strategies (append/upsert/replace)
- **Pagination** — Configurable page sizes (5/10/20) for large datasets
- **Overdue Tracking** — Quick metric shortcut to find jobs requiring follow-up
- **Storage Logging** — Debug visibility with console logs and downloadable .log files
- **Refined UI Theme** — Clean, paper-toned interface with productivity-focused layout

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server (http://127.0.0.1:4173)
npm run dev

# Run tests
npm run test:run

# Build for production
npm run build

# Preview/serve the production build (requires npm run build first)
npm run serve
```

You can also run as a macOS daemon. See [docs/DAEMON_SETUP.md](docs/DAEMON_SETUP.md) for instructions.

## Development

### Project Structure

```text
app/
  ├── layout.tsx              # Next.js root layout
  ├── page.tsx                # Root page (renders AppClient)
  ├── AppClient.tsx           # 'use client' bridge to src/App
  ├── globals.css             # Global styles
  └── api/
      ├── jobs/route.ts       # GET/PUT /api/jobs
      └── database/
          ├── create/route.ts # POST /api/database/create
          ├── info/route.ts   # GET /api/database/info
          └── test/route.ts   # GET /api/database/test

backend/
  ├── jobStore.ts             # Lazy-init SQLite store proxy (used by API routes)
  ├── jobsApi.ts              # Shared /api/jobs request handler
  ├── sqliteStore.ts          # File-backed SQLite repository
  └── jobValidation.ts        # Backend job payload validation

src/
  ├── App.tsx                 # Main app orchestrator
  ├── domain.ts               # Core types: Job, JobDraft, JobStatus, JobPriority
  ├── components/             # Reusable UI components (table, kanban, form, toast)
  ├── hooks/                  # Custom state and behavior hooks (~20 specialized hooks)
  ├── services/               # Business logic (scoring, notifications, storage, AI, import/export)
  ├── storage/                # Storage adapters (API client, localStorage fallback, logger)
  ├── views/                  # Page-level view components (Analytics, Table, Calendar, etc.)
  ├── features/               # Self-contained feature modules (analytics, backup, savedViews, search, tasks)
  ├── types/                  # Shared TypeScript types (ai, filters, errors, componentProps)
  ├── utils/                  # Date, accessibility, drag/drop, formatting helpers
  └── test/setup.ts           # Vitest setup

docs/
  ├── ARCHITECTURE.md         # Technical architecture overview
  ├── DAEMON_SETUP.md         # macOS daemon setup guide
  ├── PERFORMANCE_BASELINE.md # Performance measurement framework
  ├── REFACTORING_ANALYSIS.md # Code quality audit
  ├── REFACTORING_STATUS.md   # Refactoring progress tracker
  ├── releases/               # Historical release notes (v2.5, v2.6, v2.7)
  ├── planning/               # Roadmaps and release plans (v2.7, v2.8)
  └── safari-plugin/          # Safari browser plugin architecture and planning

scripts/
  ├── generate-version.ts     # Auto-generates src/version.ts from git metadata
  ├── package-standalone.sh   # Builds standalone deployment bundle
  └── launchd/                # macOS launchd helpers (plist template, install/uninstall scripts)

e2e/                          # Playwright end-to-end tests
sample-data/                  # Demo JSON files for import testing
public/                       # Static assets (favicon, logo)
```

### Testing

Tests are run with Vitest and React Testing Library:

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Current test coverage
npm run test:run -- --coverage  # (requires coverage provider)
```

**Current Status (v2.7.0):**

- 78 test files
- 681 passing tests
- Covers app workflows, hooks, backend API/store modules, services, and utility modules

### Building

```bash
# Production build (optimized, minified, tree-shaken)
npm run build

# Next.js outputs server/client artifacts in .next/
# Start production server with:
npm run start
```

## CI/CD Pipeline (Gitea Actions)

Workflow files are located in `.gitea/workflows/`:

### 1. **Build & Test** (`build-test.yml`)

Triggers on: `push` to main/develop, `pull_request` against main/develop

**Steps:**

- Lint code (ESLint)
- Run full test suite
- Build application
- Upload build artifacts (7-day retention)

**Status:** ✅ Passing on current main branch

### 2. **Release** (`release.yml`)

Triggers on: `git tag` (e.g., `git tag v1.0.0 && git push origin v1.0.0`)

**Steps:**

- Run full test suite
- Build application
- Package source tarball (`.tar.gz`)
- Package distribution zip (ready-to-deploy)
- Generate release notes
- Upload packaged artifacts for download from workflow run

**Artifacts:**

- `job-tracker-vX.Y.Z-source.tar.gz` — Source code archive
- `job-tracker-vX.Y.Z-standalone.zip` — Standalone Next.js deployment bundle with `server.js`, `.next/static`, `public/`, and `macos/` startup helpers

### 3. **Deploy** (`deploy.yml`)

Triggers on: Successful `Build & Test` workflow on main, or manual `workflow_dispatch`

**Steps:**

- Build application
- Create deployment artifact with metadata
- Upload to artifacts (30-day retention)

**Status:** Ready for manual deployment to Netlify, Vercel, GitHub Pages, or custom server

## Usage Tips

### Adding a Job

1. Fill out the "Add Job" form (Company, Role, Status, etc.)
2. Click **Add Job** to add to pipeline
3. Metric cards update instantly

### Re-Analyzing a Job

1. Open a job from table/kanban/calendar
2. In the job modal, click **Re-Analyze**
3. AI scoring runs again in the background and refreshes the score fields

### Smart Filtering

- **Status Filter** — Quick drop-down for All statuses, Overdue Follow-ups, Applied, Phone Screen, Interview, Offer, Rejected, Withdrawn
- **Advanced Filters** — Click "Filters" to refine by:
  - Application date range
  - Salary range
  - Contact person name
- **Overdue Follow-ups** — Click "View" in the overdue metric card to see jobs past their due date

### Bulk Operations

1. Select jobs via checkboxes (or select-all)
2. Manage selections across pagination
3. Click "Delete Selected on Page" — only visible selected rows are removed
4. Hidden selections preserved and reported

### Import/Export

- **Export** — JSON or CSV from toolbar; CSV opens in Excel/Sheets
- **Import** — JSON file with merge strategy:
  - **Append** — Add imported jobs to existing
  - **Upsert** — Update existing by ID, add new ones
  - **Replace** — Clear all, keep only imported

### Storage & Debugging

- Job data is stored in `data/job-tracker.sqlite` (or `JOB_TRACKER_DB_PATH` if set)
- The SQLite file can be opened with DB Browser for SQLite, `sqlite3`, and other compatible readers
- Click **Export DB Logs** in form panel to download debug logs
- Logs include: API operations, timing, error details
- Enable debug mode: `localStorage.setItem('job-tracker.debug', 'true')` in console

### Version Metadata

- `src/version.ts` is auto-generated by `scripts/generate-version.ts`
- Generation runs before `dev`, `build`, `test:run`, and `test:coverage`
- App UI shows current version badge for quick runtime verification

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

## Tech Stack

| Layer | Technology |
| --- | --- |
| **UI Framework** | React 19 |
| **Language** | TypeScript 5 |
| **Build Tool** | Next.js 15 (App Router) |
| **Database** | SQLite (file-backed via better-sqlite3) |
| **Testing** | Vitest + React Testing Library + userEvent |
| **Linting** | ESLint 9 |
| **CI/CD** | Gitea Actions |

## Performance

- **Bundle Size:** App bundle only (SQLite engine runs server-side)
- **Startup:** <1s (network) + storage hydration
- **Page Transitions:** Instant (React in-browser)
- **Pagination:** Optimized for 1000+ jobs

## Privacy & Data Ownership

- ✅ **No analytics tracking** — Zero telemetry
- ✅ **No cloud sync** — Data stays on your device
- ✅ **Full export capability** — JSON, CSV at any time
- ✅ **SQLite portability** — Open the `.sqlite` file with standard SQLite tools

## License

This project is licensed under a custom non-commercial license.

See `LICENSE` for details. Commercial use is not permitted without prior written permission.

## Support & Contribution

Report issues, suggest features, or contribute pull requests on the project repository.

---

**Last Updated:** March 11, 2026  
**Current Release Tag:** v2.7.0
