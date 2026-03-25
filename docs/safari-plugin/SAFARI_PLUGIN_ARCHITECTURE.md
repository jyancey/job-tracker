# Safari Plugin Architecture Overview

**Version:** v1.0 planning (Q2 2026)
**Status:** Pre-development
**Last Updated:** March 14, 2026

---

## Overview

The Safari Plugin is a browser extension that captures job posting information directly from web pages and syncs it to the job-tracker web application. It replaces the fragile job-posting scraper with a user-driven capture mechanism, improving reliability and data quality.

**Target:** macOS Safari 15.0+ (current and previous 2 major versions)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Safari Browser Plugin                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Popup Window & Sidebar Panel               │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Quick Capture Form (Popup)                    │  │  │
│  │  │  - Company, Title, URL, Notes                  │  │  │
│  │  │  - Pre-filled from page context               │  │  │
│  │  │  - Form validation on blur                    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                        ↑ (messaging)                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Extended Sidebar Form                         │  │  │
│  │  │  - All job fields importable                   │  │  │
│  │  │  - Keyboard shortcut: Cmd+Shift+K             │  │  │
│  │  │  - Persistent form state                      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                        ↑ (messaging)                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Settings Page                                 │  │  │
│  │  │  - API key configuration                       │  │  │
│  │  │  - Sync interval & notification prefs          │  │  │
│  │  │  - Debug tools (Clear Queue, View Logs, etc)  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↕ (messaging)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Content Script (Injected)                    │  │
│  │  - Extract page metadata (title, URL, meta tags)     │  │
│  │  - Detect job posting context                        │  │
│  │  - Site-specific DOM extraction (LinkedIn, Indeed)   │  │
│  │  - Pre-fill popup with company, title, salary        │  │
│  │  - Expose window.jobTrackerPlugin API                │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↕ (messaging)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Service Worker (Background Thread)            │  │
│  │  - Message dispatcher (CAPTURE_JOB, SYNC, etc)       │  │
│  │  - Queue persistence (browser.storage.local)         │  │
│  │  - Settings management                               │  │
│  │  - Sync scheduling (manual, 5m, 15m, 1h)           │  │
│  │  - HTTP POST to backend (optional, with retries)    │  │
│  │  - Badge update (pending count)                      │  │
│  │  - Logging and error handling                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↕ (persistence)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Browser Storage (plugin:// namespace)         │  │
│  │  - job-tracker-plugin-queue (PluginQueueItem[])     │  │
│  │  - job-tracker-plugin-settings (PluginSettings)     │  │
│  │  - Maximum quota: typically 10MB on Safari           │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↕ (HTTP POST, optional)             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      Backend API (Optional, not required for MVP)     │  │
│  │  - POST /api/jobs/from-plugin                        │  │
│  │  - Accepts JobCapture + workspaceId                  │  │
│  │  - Returns created jobId or error                    │  │
│  │  - Rate limited and authenticated                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘

               ↕ (localStorage sync, cross-tab, when open)

┌─────────────────────────────────────────────────────────────┐
│            job-tracker Web App (React)                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         usePluginQueue Hook                          │  │
│  │  - Monitors localStorage for plugin queue changes    │  │
│  │  - Auto-imports queued jobs on app load              │  │
│  │  - Shows toast notification                          │  │
│  │  - Clears queue on successful import                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         jobService (existing)                        │  │
│  │  - createJob() validates and creates jobs            │  │
│  │  - Assigns workspace scope                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Storage Layer                                │  │
│  │  - localStorage / backend API                        │  │
│  │  - Workspace-scoped storage (v2.8.0)                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
safari-plugin/  (new repository or src/safari-plugin/ subdirectory)
│
├── Resources/                          # Safari extension manifest & UI
│   ├── manifest.json                   # Extension configuration
│   ├── popup.html                      # Quick capture form UI
│   ├── popup.ts                        # Popup logic & messaging
│   ├── sidebar.html                    # Extended form UI
│   ├── sidebar.ts                      # Sidebar logic
│   ├── settings.html                   # Settings/preferences page
│   ├── settings.ts                     # Settings logic
│   ├── styles.css                      # Unified styling (light/dark mode)
│   └── content.ts                      # Content script (injected into pages)
│
├── src/                                # Core plugin TypeScript
│   ├── background.ts                   # Service worker (message router, queue mgmt)
│   ├── types.ts                        # Shared TypeScript types
│   │   ├── JobCapture                  # Raw capture from plugin
│   │   ├── PluginQueueItem             # Queued job with sync metadata
│   │   ├── PluginSettings              # Plugin configuration
│   │   └── PluginMessage               # Message union type
│   ├── utils.ts                        # Common utilities
│   │   ├── extractSalary()             # Salary detection
│   │   ├── extractMetadata()           # Page metadata extraction
│   │   ├── siteExtractors              # Per-site DOM extraction templates
│   │   ├── isJobPosting()              # Heuristic detection
│   │   └── validators                  # Form validation
│   ├── storage.ts                      # Wrapper around browser.storage.local
│   │   ├── readQueue()                 # Read plugin queue
│   │   ├── writeQueue()                # Write plugin queue
│   │   ├── readSettings()              # Read plugin settings
│   │   └── writeSettings()             # Write plugin settings
│   ├── messaging.ts                    # Message dispatcher & handlers
│   │   ├── handleCaptureJob()          # Add job to queue
│   │   ├── handleSync()                # Trigger sync to backend (if configured)
│   │   ├── handleGetSettings()         # Return current settings
│   │   └── messageRouter()             # Route incoming messages
│   ├── sync.ts                         # Sync to backend (optional)
│   │   ├── syncQueueToBackend()        # HTTP POST with retry logic
│   │   ├── retryWithBackoff()          # Exponential backoff
│   │   └── updateSyncStatus()          # Mark items as synced/failed
│   └── logger.ts                       # Logging utilities
│
├── build/                              # Compiled output (gitignored)
│   ├── popup.js
│   ├── content.js
│   ├── background.js
│   └── ...
│
├── tests/                              # Test files
│   ├── unit/
│   │   ├── background.test.ts          # Service worker tests
│   │   ├── storage.test.ts             # Queue/settings persistence
│   │   ├── sync.test.ts                # Retry and sync logic
│   │   ├── types.test.ts               # Type validation
│   │   └── utils.test.ts               # Extraction and detection
│   │
│   ├── integration/
│   │   ├── messaging.test.ts           # Message routing
│   │   ├── popup-flow.test.ts          # Popup form → capture
│   │   └── pre-fill.test.ts            # Content script pre-fill
│   │
│   └── e2e/  (manual and automation scripts)
│       ├── capture-flow.test.ts
│       ├── sync-flow.test.ts
│       └── offline-flow.test.ts
│
├── .github/workflows/
│   ├── build.yml                       # CI: build and test on push
│   ├── release.yml                     # CI: tag and release
│   └── ...
│
├── docs/
│   ├── README.md                       # User guide: install, quick start, FAQ
│   ├── DEVELOPMENT.md                  # Developer guide: architecture, extending
│   ├── TROUBLESHOOTING.md              # Common issues and solutions
│   ├── PRIVACY.md                      # Privacy and permissions policy
│   ├── ARCHITECTURE.md                 # This file
│   └── SAFARI_PLUGIN_RELEASE_PLAN.md  # Release plan (from job-tracker repo)
│
├── package.json                        # Dependencies, build scripts
├── tsconfig.json                       # TypeScript configuration
├── vitest.config.ts                    # Vitest configuration (same as job-tracker)
├── esbuild.config.js                   # Build configuration
├── .eslintrc.js                        # Code quality (share with job-tracker)
├── .gitignore
└── README.md                           # Project overview

```

---

## Key Architectural Patterns

### 1. Service Worker as Central Dispatcher

**Pattern:** Single service worker routes all plugin messages and manages state.

```typescript
// Service worker receives all messages and dispatches
browser.runtime.onMessage.addListener(async (message: PluginMessage, sender) => {
  switch (message.type) {
    case 'CAPTURE_JOB':
      return handleCaptureJob(message.payload)
    case 'SYNC':
      return handleSync()
    case 'GET_SETTINGS':
      return handleGetSettings()
    case 'SAVE_SETTINGS':
      return handleSaveSettings(message.payload)
    default:
      console.warn(`Unknown message type: ${message.type}`)
  }
})
```

**Benefits:**
- Single source of truth for queue and settings
- Centralized error handling and logging
- Easier to test and debug
- Can schedule tasks (sync timer, retries)

---

### 2. Message-Driven Architecture

**Pattern:** UI (popup, sidebar, content script) and service worker communicate only via typed messages.

```typescript
interface PluginMessage =
  | { type: 'CAPTURE_JOB'; payload: JobCapture }
  | { type: 'SYNC' }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; payload: PluginSettings }
  | { type: 'GET_QUEUE' }
  | { type: 'CLEAR_QUEUE' }
```

**Benefits:**
- Decoupled UI and logic
- Type-safe messaging (TypeScript)
- Easy to add new message types
- Testing is simplified (mock messages)

---

### 3. Content Script Extraction Templates

**Pattern:** Per-site DOM extraction templates for consistent pre-fill.

```typescript
// src/utils.ts
const siteExtractors = {
  'linkedin.com': {
    extractCompany: (doc: Document) =>
      doc.querySelector('.js-job-details-top-card__company-name')?.textContent,
    extractTitle: (doc: Document) =>
      doc.querySelector('.jobs-details__main-content h2')?.textContent,
  },
  'indeed.com': {
    extractCompany: (doc: Document) =>
      doc.querySelector('.icl-u-lg-pt--md.icl-u-pb--md.js-company-title')?.textContent,
    extractTitle: (doc: Document) =>
      doc.querySelector('h1.icl-heading-xl')?.textContent,
  },
  // ... more sites
}
```

**Benefits:**
- Easy to add support for new job sites
- Confidence scoring (high/medium/low) per extractor
- Fallback to generic extraction if no template
- Maintainable (changes isolated by site)

---

### 4. Queue-Based Persistence

**Pattern:** Plugin queue is the single source of truth. Multiple sync targets (localStorage, backend).

```
User captures job
    ↓
PluginQueueItem added to browser.storage.local
    ↓
[If app is open] → localStorage pollst for changes → job-tracker imports
    ↓
[If backend sync configured] → Service worker POSTs to backend
    ↓
PluginQueueItem marked as 'synced' or 'failed'
```

**Benefits:**
- Never lose a capture (persisted immediately)
- Works offline (localStorage is always available)
- Multiple backends supported (localStorage + optional HTTP)
- Retry logic is automatic

---

### 5. Optional Backend Sync

**Pattern:** Backend sync is optional; localStorage sync is the MVP.

```typescript
// Service worker checks if API key is configured
if (settings.apiKey) {
  // POST to backend with retry logic
  await syncQueueToBackend(settings.apiKey, queue)
} else {
  // Just use localStorage (job-tracker app polls)
}
```

**Benefits:**
- MVP works without backend
- Users don't need authentication
- Backend API can be added later or optionally
- Zero configuration for most users

---

## Data Model

### JobCapture (from Plugin)

```typescript
interface JobCapture {
  company: string              // Required
  title: string                // Required
  url: string                  // Required (must be valid URL)
  notes?: string               // Optional extra notes
  salary?: string              // Optional extracted salary
  sourcePageTitle?: string     // Page title where capture occurred
  capturedAt: number           // Timestamp (ms since epoch)
}
```

### PluginQueueItem (Internal)

```typescript
interface PluginQueueItem {
  id: string                   // UUID, generated on capture
  job: JobCapture              // The captured job
  syncStatus: 'pending' | 'synced' | 'failed'
  syncAttempts: number         // Count of POST attempts
  lastSyncError?: string       // Error message if failed
}
```

### PluginSettings (User Configuration)

```typescript
interface PluginSettings {
  apiKey?: string              // Optional backend API key
  syncInterval: 'manual' | '5m' | '15m' | '1h'
  notificationsEnabled: boolean
  lastSyncAt?: number          // Timestamp of last backend sync
}
```

### Plugin Queue Storage Format

```json
{
  "version": 1,
  "items": [
    {
      "id": "12345678-1234-1234-1234-123456789012",
      "job": {
        "company": "Acme Inc",
        "title": "Senior Engineer",
        "url": "https://linkedin.com/jobs/view/123456",
        "notes": "Found on LinkedIn",
        "salary": "$120k - $150k",
        "capturedAt": 1710432000000
      },
      "syncStatus": "pending",
      "syncAttempts": 0
    }
  ]
}
```

---

## State Flow

### Capture Flow

```
User clicks plugin icon on job page
    ↓
Popup opens, pre-fills from content script
    ↓
User fills form and clicks "Save"
    ↓
Popup sends CAPTURE_JOB message
    ↓
Service worker receives CAPTURE_JOB
    ↓
Creates PluginQueueItem with UUID
    ↓
Persists to browser.storage.local (queue-key)
    ↓
Updates badge count
    ↓
Popup closes
    ↓
[If job-tracker is open] → Observes localStorage change → Imports job
[If backend API configured] → Service worker triggers sync
[Else] → Waits in queue for app to open
```

### Sync Flow (Optional Backend)

```
Service worker checks sync timer (5m, 15m, 1h, or manual)
    ↓
Reads queue from browser.storage.local
    ↓
Filters items with syncStatus = 'pending' or 'failed'
    ↓
For each item:
  POST to /api/jobs/from-plugin with apiKey
    ↓
    On 2xx success:
      - Mark item as 'synced'
      - Remove from queue (optional: archive)
    ↓
    On 4xx error (invalid key, validation):
      - Mark as 'failed'
      - Log error, don't retry
    ↓
    On 5xx or timeout:
      - Increment syncAttempts
      - Retry with exponential backoff (1s, 2s, 4s, stop)
    ↓
    On network offline:
      - Leave as 'pending'
      - Retry when online
    ↓
Update UI badge and last sync timestamp
```

### Pre-fill Flow

```
User navigates to a job posting (LinkedIn, Indeed, etc)
    ↓
Content script loads and extracts metadata
    ↓
User clicks plugin icon
    ↓
Popup sends GET_PAGE_CONTEXT message
    ↓
Content script responds with extracted data:
  - company (if detected)
  - title (if detected)
  - salary (if extracted)
  - confidence score
    ↓
Popup pre-fills form fields
    ↓
User edits if needed and submits
```

---

## Integration with job-tracker

### New Hook: usePluginQueue

Located in `src/hooks/usePluginQueue.ts` (job-tracker repo):

```typescript
export function usePluginQueue() {
  const { addJob } = useJobOperations()
  const [queueCount, setQueueCount] = useState(0)

  // Monitor localStorage for plugin queue changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'job-tracker-plugin-queue') {
        importFromQueue()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const importFromQueue = async () => {
    const rawQueue = localStorage.getItem('job-tracker-plugin-queue')
    if (!rawQueue) return

    const { items } = JSON.parse(rawQueue)
    for (const item of items) {
      const job = {
        company: item.job.company,
        title: item.job.title,
        url: item.job.url,
        notes: item.job.notes,
        salary: item.job.salary,
        status: 'Lead',
        source: 'Safari Plugin',
        createdAt: item.job.capturedAt,
      }
      await addJob(job)
    }

    // Clear queue
    localStorage.removeItem('job-tracker-plugin-queue')

    // Show notification
    notifications.show(`${items.length} new jobs captured from Safari Plugin`)
  }

  return { queueCount, importFromQueue }
}
```

### Integration Points

1. **App.tsx:** Call `usePluginQueue()` at app root to monitor queue
2. **jobService.ts:** Use existing `createJob()` for imported jobs (no changes needed)
3. **domain.ts:** Share or import `JobCapture` type (optional if using plugin repo)
4. **types/componentProps.ts:** May export plugin-related types if needed

---

## Performance Considerations

### Browser Storage Quota
- Safari allows ~10MB per extension
- Queue size limit: 500 items (max ~1MB)
- Warn user if queue > 500 items
- Cleanup: Automatically remove synced items after 7 days

### Message Passing Overhead
- Messages are async (don't block):
  - Popup → Service Worker: ~5ms
  - Content Script → Service Worker: ~5ms
  - UI → Queue persist: ~10ms
- No performance impact to page

### Content Script Injection
- Only runs on content pages (not system pages like about:*)
- Extraction is fast (<50ms on typical job posting)
- Doesn't block page rendering

### Sync Scheduling
- Service worker runs only when needed (idle detection)
- Sync tasks are non-blocking to browser
- Default interval: manual (user triggers via Settings button)
- Optional intervals: 5m, 15m, 1h (configurable)

---

## Security and Privacy

### Data Storage
- **Local storage:** Jobs stored in `browser.storage.local` (sandbox per extension)
- **Transmission:** Optional HTTPS POST to backend (user must configure API key)
- **No tracking:** No analytics, no third-party calls

### Permissions Required
- `storage`: Read/write to extension storage (required)
- `activeTab`: Detect when user opens popup on job page (optional, for pre-fill)
- `scripting`: Content script injection (required)

### Plugin Isolation
- Plugin storage is isolated from web app localStorage
- Queue key: `job-tracker-plugin-queue` (shared with job-tracker, intentional)
- No access to other sites' data

### API Key Handling
- Stored in `browser.storage.local` (never transmitted unless syncing)
- Treated as a secret (masked in UI, not logged)
- User responsible for rotating/revoking

---

## Testing Strategy

### Unit Tests (80%+ coverage)
- Message routing and dispatch
- Queue read/write/clear
- Settings persistence
- Pre-fill extraction (mock DOM)
- Validation logic
- Retry and backoff

### Integration Tests
- Popup form → Service worker → Queue
- Content script extraction → Popup pre-fill
- Queue import in job-tracker app
- Settings changes apply correctly

### E2E Tests (Manual primary)
1. Capture on LinkedIn → Jobs appear in job-tracker
2. Sidebar form → Full job details saved
3. Settings → API key configured → Backend sync
4. Offline → Jobs queue locally → Reconnect → Auto-sync
5. Multiple workspaces → Plugin syncs to active workspace

### Test Tools
- **Unit/Integration:** Vitest (shared with job-tracker)
- **Mocking:** Mock Safari storage API, mock fetch
- **E2E:** Manual workflows + optional WebDriver automation

---

## Future Extensibility

### Adding a New Job Site
1. Create extractor in `src/utils.ts`:
   ```typescript
   siteExtractors['newsite.com'] = {
     extractCompany: (doc) => {...},
     extractTitle: (doc) => {...},
   }
   ```
2. Update confidence scoring if needed
3. Add extraction tests
4. Document in README

### Adding a New Message Type
1. Add to `PluginMessage` union in `src/types.ts`
2. Implement handler in `src/messaging.ts`
3. Send from popup/sidebar/content-script
4. Add tests

### Supporting Additional Browser
1. Create `firefox/` directory with Firefox-specific manifest
2. Build pipelines for Firefox (same TS, different config)
3. Adjust messaging API (Firefox uses `browser.* ` like Safari)
4. Share core `src/` TypeScript code

---

## Known Limitations (v1.0)

- ⚠️ **Single Machine Only:** Plugin and app must be on same computer (shares localStorage)
- ⚠️ **No Cross-Tab Sync:** Changes in one Safari window may not instantly reflect in another (localStorage events are per-tab)
- ⚠️ **No Auto-Update:** Users must manually update when new version released
- ⚠️ **Safari Only:** Chrome/Firefox support deferred to v1.1
- ⚠️ **Manual Sync Default:** Backend sync requires user configuration
- ⚠️ **Basic Job Sites:** LinkedIn, Indeed, Glassdoor in v1.0; more in v1.1

---

## Scalability & Extension Points

### Scaling Queue for Large Captures
- Implement queue archival (remove synced items after 7 days)
- Batch import in job-tracker app (100 items at a time)
- Warn user if queue > 500 items

### Multi-Browser
- Refactor core `src/` as "core" package
- Create browser-specific projects:
  - `safari-extension/` (manifests, Safari-specific code)
  - `chrome-extension/` (manifests, Chrome-specific code)
  - `firefox-addon/` (manifests, Firefox-specific code)
- Share TypeScript types via `@job-tracker/plugin-types` package

### Cloud Sync (Future)
- Once job-tracker supports cloud sync, plugin can POST directly to cloud
- No on-device localStorage needed
- Enable multi-device plugin use

### AI Integration (Future)
- Plugin could extract and summarize job details
- Send full job description + user resume to backend
- Backend returns AI-scored fit score
- Plugin shows score when opening job posting

---

## Getting Help

### Understanding the Plugin
1. Start with `README.md` for user overview
2. Review this `ARCHITECTURE.md` for structure
3. Read `DEVELOPMENT.md` for coding patterns
4. Check tests for usage examples

### Contributing
1. Pick an issue from Forgejo
2. Create a feature branch
3. Follow patterns from existing code
4. Write tests for new functionality
5. Ensure all tests pass locally
6. Open PR with clear description

### Debugging
1. Open Safari Extensions preferences
2. Enable "Inspect Background Page" for service worker
3. Use browser DevTools to inspect popup/content-script
4. Check browser console for logs
5. See `TROUBLESHOOTING.md` for common issues

---

## Quick Reference

### Build Commands
```bash
pnpm build         # Compile TypeScript to build/
pnpm dev           # Watch mode for development
pnpm test          # Run all tests
pnpm test:watch   # Watch mode tests
pnpm lint          # ESLint code quality
pnpm type-check   # TypeScript type check
```

### Key Files to Know
- `Resources/manifest.json` — Extension config
- `src/background.ts` — Service worker entry point
- `src/types.ts` — TypeScript type definitions
- `src/messaging.ts` — Message dispatcher
- `src/utils.ts` — Extraction templates and utilities
- `Resources/popup.ts` — Popup form UI logic
- Tests in `tests/` — Use for understanding behavior

### File Size Budget
- Service worker: < 100KB
- Popup UI + CSS: < 50KB
- Content script: < 50KB
- Total: < 200KB (uncompressed)

### Dependencies (Minimal)
- TypeScript (dev only, compiled out)
- Vitest (dev, testing)
- ESLint (dev, code quality)
- No runtime dependencies (pure TypeScript/DOM APIs)

---

## Maintenance

### Updating Extraction Templates
When a job site changes its HTML structure:
1. Audit the site using DevTools
2. Update selectors in `src/utils.ts`
3. Run extraction tests
4. Check confidence scoring
5. Document in PR

### Version Bumping
- Use semantic versioning: v1.0.0, v1.1.0, v2.0.0
- Bump on releases via GitHub Actions
- Update version in `package.json` and changelog

### Deprecation
- Maintain backward compatibility in queue format (version field)
- Support reading old queue versions
- Document migration path in release notes

---

**Last Updated:** March 14, 2026
**Status:** Pre-development architecture (v1.0 planning)

