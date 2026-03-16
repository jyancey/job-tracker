# Safari Plugin Forgejo Issue Backlog

**Milestone:** Safari Plugin v1.0
**Release Theme:** Direct browser-based job capture, eliminating web scraper dependency
**Generated:** March 14, 2026

Copy each issue block into Forgejo. Suggested labels are noted per issue.

---

## Phase P1 — Core Plugin Infrastructure

---

### Issue P1-1: Set up Safari App Extension project structure

**Labels:** `safari-plugin` `infrastructure` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Create the Xcode project and TypeScript build pipeline for the Safari App Extension. This establishes the foundation for all subsequent plugin development work.

#### Tasks

- [ ] Create new Xcode project targeting macOS 12.0+, iOS 16+ (for cross-device prep)
- [ ] Configure `Info.plist` with bundle identifiers and entitlements
- [ ] Set up esbuild or webpack for TypeScript → JavaScript compilation
- [ ] Create project structure:
  ```
  safari-plugin/
  ├── Resources/
  │   ├── manifest.json
  │   ├── popup.html
  │   ├── popup.ts
  │   ├── settings.html
  │   ├── settings.ts
  │   ├── sidebar.html
  │   ├── sidebar.ts
  │   ├── content.ts
  │   └── styles.css
  ├── src/
  │   ├── background.ts (service worker)
  │   ├── types.ts
  │   └── utils.ts
  ├── build/ (output)
  ├── package.json
  ├── tsconfig.json
  ├── .github/workflows/ (CI pipeline)
  └── README.md
  ```
- [ ] Create `package.json` with build scripts: `build`, `dev`, `test`
- [ ] Add GitHub Actions workflow for build verification on push
- [ ] Document: macOS/Xcode version requirements, dev setup instructions

#### Acceptance Criteria

- Extension loads in Safari without crashes or warnings
- Build process is repeatable and documented
- CI pipeline passes on every push
- TypeScript compiles cleanly with no errors

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P1
- Safari App Extension API docs: https://developer.apple.com/documentation/safari

---

### Issue P1-2: Implement service worker and message routing

**Labels:** `safari-plugin` `service-worker` `messaging` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Implement the core service worker that persists the job queue, routes messages between content script and popup/sidebar, and manages plugin state.

#### Tasks

- [ ] Create `src/background.ts` (service worker entry point)
- [ ] Implement message dispatcher:
  ```typescript
  type PluginMessage =
    | { type: 'CAPTURE_JOB', payload: JobCapture }
    | { type: 'SYNC', payload?: void }
    | { type: 'GET_SETTINGS' }
    | { type: 'SAVE_SETTINGS', payload: PluginSettings }
    | { type: 'GET_QUEUE' }
    | { type: 'CLEAR_QUEUE' }
  ```
- [ ] Implement queue persistence:
  - Use `browser.storage.local` (Safari's persistent storage)
  - Queue key: `job-tracker-plugin-queue`
  - Add timestamps to each queued job
  - Max queue size: 500 items (warn user if approaching)
- [ ] Implement settings persistence to `browser.storage.local`:
  - `job-tracker-plugin-settings` (API key, sync interval, notifications toggle)
  - Load defaults on first run
- [ ] Implement sync status tracking:
  - Last sync timestamp
  - Pending items count
  - Failed sync reason (if applicable)
- [ ] Add error handling:
  - Log all errors to console (for debugging)
  - Never silently drop messages
  - Implement retry mechanism for failed operations
- [ ] Write unit tests:
  - Message dispatcher routes all message types
  - Queue persistence survives service worker restart
  - Settings read/write/update
  - Error logging works

#### Acceptance Criteria

- All message types route without errors
- Queue persists across browser restarts
- Settings are correctly stored and loaded
- At least 80% code coverage for service worker logic

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P1
- Safari Service Worker API: https://developer.apple.com/documentation/safari/safari_web_extensions

---

### Issue P1-3: Implement content script for page interaction

**Labels:** `safari-plugin` `content-script` `dom` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Create a content script injected into all web pages. This script extracts page metadata, detects job-posting context, and communicates with the service worker.

#### Tasks

- [ ] Create `src/content.ts` that injects into all URLs
- [ ] Implement metadata extraction:
  - Page title, URL, meta tags (og:title, og:description, og:image)
  - Collect meta property `job-posting` if present (OpenGraph, Schema.org)
  - Detect page language (en, etc.)
- [ ] Implement job-posting detection heuristics:
  - Look for keywords in page title: "job", "position", "hiring", "opportunity", "apply"
  - Look for keywords in page URL: "/job/", "/position/", "/careers/", "/apply"
  - Check for common job posting selectors (company logo, apply button, salary, job description)
  - Assign a confidence score: high (0.9+), medium (0.5-0.9), low (< 0.5)
- [ ] Implement extraction templates for major job sites:
  - LinkedIn: selectors for job title, company, salary, location
  - Indeed: selectors for job title, company, salary
  - Glassdoor: selectors for company, position, salary range
  - Generic fallback for unknown sites
- [ ] Create global `window.jobTrackerPlugin` object exposing:
  ```typescript
  window.jobTrackerPlugin = {
    getPageMetadata: () => PageMetadata
    isJobPosting: () => { confidence: number, metadata: JobMetadata }
    updateContextUI: (status: string) => void (show status message on page)
  }
  ```
- [ ] Implement messaging to service worker:
  - When popup opens on a job page, send `GET_PAGE_CONTEXT` message
  - Service worker responds with extracted metadata for pre-fill
- [ ] Add error handling:
  - Gracefully handle pages with no metadata
  - Never throw errors that break page functionality
  - Log to console for debugging
- [ ] Write integration tests:
  - Content script loads on all pages without breaking them
  - Metadata extraction works on LinkedIn, Indeed, Glassdoor mock pages
  - Confidence scoring correctly identifies job pages vs. non-job pages

#### Acceptance Criteria

- Content script injects without console errors
- Metadata extraction works on major job sites
- Job-posting detection is accurate (≥ 85% on test pages)
- Page functionality is never broken by plugin

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P1, Phase P4-2 (Multi-site detection)

---

## Phase P2 — Plugin UI

---

### Issue P2-1: Build popup UI (HTML, CSS, TypeScript)

**Labels:** `safari-plugin` `ui` `popup` `ux` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Create the popup form UI that users see when clicking the plugin icon. Form must be clean, accessible, and fast-loading.

#### Tasks

- [ ] Create `Resources/popup.html` with form:
  ```html
  <form>
    <input type="text" placeholder="Company" name="company" required />
    <input type="text" placeholder="Job Title" name="title" required />
    <input type="url" placeholder="Job URL" name="url" required />
    <textarea placeholder="Notes..." name="notes" />
    <button type="submit">Save & Close</button>
  </form>
  ```
- [ ] Create `Resources/popup.ts`:
  - Load form state from content script (pre-fill if on job page)
  - Validate fields on blur (required fields, URL format)
  - Show visual indicators (red border for invalid fields)
  - Implement form submission handler:
    - Send `CAPTURE_JOB` message to service worker
    - Show loading spinner on submit
    - Close popup on success
    - Show error toast on failure (network, service worker error)
  - Persist unsaved form state to session storage (user reopens popup = form is still there)
- [ ] Create `Resources/styles.css`:
  - Follow Safari design guidelines (native appearance)
  - Support light and dark mode (use `prefers-color-scheme`)
  - Font: system font (-apple-system, Segoe UI, sans-serif)
  - Padding: 16px
  - Focus states for accessibility (keyboard navigation)
  - Responsive to 360px width (minimum)
- [ ] Add accessibility features:
  - All form fields have <label> with proper `for` attribute
  - Error messages use `role="alert"`
  - Button has clear focus indicator
  - Form is keyboard-navigable (Tab, Enter to submit, Escape to cancel)
- [ ] Write component tests:
  - Form state management (populate, validate, submit)
  - Pre-fill from content script works
  - Dark mode CSS applies correctly

#### Acceptance Criteria

- Form is usable and styled cleanly
- Can be filled out and submitted in < 10 seconds
- No layout regressions on macOS light/dark mode
- Keyboard-only operation works
- WCAG 2.1 AA accessibility standards met

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P2
- Safari Extensions Design Guidelines: https://developer.apple.com/design/extensions/

---

### Issue P2-2: Build settings page (API key, sync preferences, debug tools)

**Labels:** `safari-plugin` `ui` `settings` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Create a settings/preferences page where users configure API key, sync interval, notifications, and access debug tools.

#### Tasks

- [ ] Create `Resources/settings.html`:
  ```html
  <section>
    <label>API Key (Optional)</label>
    <input type="password" placeholder="Paste API key for backend sync" />
    <button>Test Connection</button>
  </section>
  <section>
    <label>Sync Interval</label>
    <select>
      <option value="manual">Manual (Sync button only)</option>
      <option value="5m">Every 5 minutes</option>
      <option value="15m">Every 15 minutes</option>
      <option value="1h">Every 1 hour</option>
    </select>
  </section>
  <section>
    <label>Notifications</label>
    <input type="checkbox" /> Show badge with pending count
    <input type="checkbox" /> Show toast on successful capture
  </section>
  <section>
    <h3>Debug Tools</h3>
    <button>Clear Queue</button>
    <button>View Logs</button>
    <button>Export Settings</button>
  </section>
  ```
- [ ] Create `Resources/settings.ts`:
  - Load settings from `browser.storage.local` on page load
  - Save on form change (auto-save, no save button needed)
  - Implement "Test Connection": POST to backend with API key, show success/error
  - Implement "Clear Queue": confirm prompt, then clear
  - Implement "View Logs": open new tab with dev console or download log file
  - Show last sync timestamp
  - Show queue size (X pending jobs)
- [ ] Add validation:
  - API key: non-empty string, no spaces
  - Sync interval: valid enum value
- [ ] Create `Resources/styles-settings.css`:
  - Same brand as popup (consistent styling)
  - Wider layout (600px+)
  - Section-based grouping with visual separation
- [ ] Write tests:
  - Settings load and persist
  - Test Connection sends correct payload
  - Queue clear works
  - UI validates input

#### Acceptance Criteria

- Settings page is usable and functional
- API key correctly stored and retrieved
- Test Connection validates backend connectivity
- All debug tools accessible and working

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P2, Phase P3-4 (Backend sync)

---

### Issue P2-3: Implement context-aware pre-fill (LinkedIn, Indeed, Glassdoor)

**Labels:** `safari-plugin` `ui` `content-script` `pre-fill` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

When user opens the popup on a job posting page, pre-fill company and job title in the form.

#### Tasks

- [ ] Create extraction templates in `src/utils.ts`:
  ```typescript
  interface ExtractionTemplate {
    domain: string // e.g., "linkedin.com"
    extractors: {
      company: (doc: Document) => string | null
      title: (doc: Document) => string | null
      salary?: (doc: Document) => string | null
    }
  }
  ```
- [ ] Implement LinkedIn template:
  - Company: select `.js-job-details-top-card__company-name`
  - Job Title: select `.jobs-details__main-content h2`
  - Salary: extract from job description text
- [ ] Implement Indeed template:
  - Company: select `.icl-u-lg-pt--md.icl-u-pb--md.js-company-title`
  - Job Title: select `h1.icl-heading-xl`
  - Salary: select `.metadata.salary-snippet-container`
- [ ] Implement Glassdoor template:
  - Company: select `.EmployerProfile`
  - Job Title: select `h2.JobTitle`
  - Salary: select `.Salary`
- [ ] Implement generic fallback (for unknown sites):
  - Try page title parsing
  - Look for `<title>` or `h1` for job title
  - Ask user to fill in manually (no guessing)
- [ ] In popup.ts, on page load:
  - Call `window.jobTrackerPlugin.getPageMetadata()`
  - Match current domain against extraction templates
  - If match found, extract company/title and pre-fill form fields
  - Show a "Pre-filled from page" indicator if data was populated
- [ ] Add confidence scoring:
  - High confidence (0.9+): use pre-filled data directly
  - Medium confidence (0.5-0.9): show as placeholder but let user edit
  - Low confidence (< 0.5): leave blank, let user fill
- [ ] Write tests:
  - Extract company/title from LinkedIn mock HTML
  - Extract from Indeed mock HTML
  - Fallback extraction on generic HTML
  - Confidence scoring is accurate

#### Acceptance Criteria

- LinkedIn jobs: 95%+ pre-fill accuracy
- Indeed jobs: 90%+ pre-fill accuracy
- Glassdoor jobs: 85%+ pre-fill accuracy
- No false positives on non-job pages
- Manual entry always available as fallback

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P2-3, Phase P4-2
- Issue P1-3: Content script

---

## Phase P3 — Integration with job-tracker App

---

### Issue P3-1: Define plugin ↔ web app communication protocol

**Labels:** `safari-plugin` `protocol` `architecture` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Define the message format and sync strategy between plugin and job-tracker web app.

#### Tasks

- [ ] Create `src/types.ts` with shared types:
  ```typescript
  interface JobCapture {
    company: string
    title: string
    url: string
    notes?: string
    salary?: string
    sourcePageTitle?: string
    capturedAt: number (timestamp)
  }

  interface PluginQueueItem {
    id: string (UUID)
    job: JobCapture
    syncStatus: 'pending' | 'synced' | 'failed'
    syncAttempts: number
    lastSyncError?: string
  }

  interface PluginSettings {
    apiKey?: string
    syncInterval: 'manual' | '5m' | '15m' | '1h'
    notificationsEnabled: boolean
  }
  ```
- [ ] Document localStorage queue format:
  - Key: `job-tracker-plugin-queue`
  - Value: JSON array of PluginQueueItem
  - Version field for future migrations
  - Example:
    ```json
    {
      "version": 1,
      "items": [
        {
          "id": "uuid-123",
          "job": {
            "company": "Acme Inc",
            "title": "Senior Engineer",
            "url": "https://linkedin.com/...",
            "capturedAt": 1710432000000
          },
          "syncStatus": "pending",
          "syncAttempts": 0
        }
      ]
    }
    ```
- [ ] Document HTTP sync protocol (for optional backend):
  - Endpoint: `POST /api/jobs/from-plugin`
  - Auth: Bearer token from plugin settings
  - Payload: { workspaceId, job: JobCapture }
  - Response: { success: boolean, jobId?: string, error?: string }
- [ ] Document sync strategy:
  - localStorage is primary (always works, no network dependency)
  - HTTP POST is secondary (if backend + API key configured)
  - Polling interval: configurable (manual, 5m, 15m, 1h)
  - Retry strategy: exponential backoff (1s, 2s, 4s), max 3 attempts
- [ ] Document backward compatibility:
  - Queue version field allows schema evolution
  - Job capture format is immutable after capture (versioned)
- [ ] Write documentation (README):
  - Protocol overview
  - Example payloads
  - Extension points for future

#### Acceptance Criteria

- Types are shared between plugin repo and job-tracker repo
- Protocol is documented and versioned
- Backward compatibility strategy is clear
- No ambiguities in message format

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P3

---

### Issue P3-2: Implement web app import from plugin queue (usePluginQueue hook)

**Labels:** `safari-plugin` `integration` `hooks` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Add a React hook to job-tracker that monitors the plugin queue in localStorage and imports captured jobs automatically.

#### Tasks

- [ ] Create `src/hooks/usePluginQueue.ts`:
  ```typescript
  export function usePluginQueue() {
    const { jobs, addJob } = useJobOperations()
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
      // Read queue, convert JobCapture → Job, add to jobs
      // Clear queue on success
      // Show notification
    }

    return { queueCount, importFromQueue }
  }
  ```
- [ ] Implement queue reading:
  - Parse `job-tracker-plugin-queue` from localStorage
  - Handle missing/corrupt queue gracefully
  - Map JobCapture schema to Job schema:
    - company → company
    - title → title
    - url → url
    - notes → notes
    - salary → salary (parse if string, handle null)
    - capturedAt → createdAt (or dateApplied?)
    - Defaults: status = 'Lead', source = 'Safari Plugin'
- [ ] Call jobService.createJob() for each queued item
- [ ] On successful import:
  - Show toast notification: "X new jobs captured from Safari Plugin"
  - Clear queue from localStorage
  - Update UI to show new jobs (table view should refresh)
- [ ] On failure:
  - Show error toast with details
  - Leave queue in localStorage (user can retry manually)
  - Log error for debugging
- [ ] Add manual sync button in Settings/Profile:
  - Allow user to manually trigger `importFromQueue()` anytime
  - Show loading state during import
- [ ] Call on app mount (before/after hydration):
  - Import any jobs captured while app was closed
- [ ] Write tests:
  - Queue parsing works correctly
  - JobCapture → Job mapping preserves data
  - Toast notification shown on success
  - Queue cleared on success
  - Error handling works

#### Acceptance Criteria

- Web app automatically imports plugin queue on load
- All captured jobs are correctly converted to Job schema
- User sees clear notification of import
- Queue is successfully cleared
- Manual sync button works

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P3
- Issue P3-1: Protocol definition

---

### Issue P3-3: Add backend API endpoint for plugin (optional)

**Labels:** `safari-plugin` `backend` `api` `optional` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Create `POST /api/jobs/from-plugin` endpoint in the optional Node backend for users who want backend sync (not required for MVP).

#### Tasks

- [ ] In `backend/jobsApi.ts`, add new route:
  ```javascript
  app.post('/api/jobs/from-plugin', authenticatePluginToken, async (req, res) => {
    // Receive JobCapture, validate, create Job in workspace, return jobId
  })
  ```
- [ ] Implement `authenticatePluginToken` middleware:
  - Extract Bearer token from Authorization header
  - Validate token against plugin API keys (stored in workspace settings or global config)
  - Return 401 if invalid
- [ ] Validate payload:
  - Required: company, title, url
  - Optional: notes, salary
  - Validate URL format
  - Return 400 with detailed error if invalid
- [ ] Create Job record:
  - Call jobService.createJob() with plugin data
  - Set source = 'Safari Plugin', status = 'Lead'
  - Assign to active workspace from token
- [ ] Return response:
  - Success: { success: true, jobId: "uuid" }
  - Error: { success: false, error: "detailed message" }
- [ ] Add rate limiting:
  - Max 100 jobs per day per API key (configurable)
  - Return 429 if exceeded
- [ ] Write API tests:
  - Valid payload creates job
  - Missing required field returns 400
  - Invalid token returns 401
  - Rate limit enforced

#### Acceptance Criteria

- Endpoint creates jobs correctly from plugin payloads
- Authentication and rate limiting work
- Error messages are clear and actionable
- API tests pass

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P3 (Should Have)
- Issue P3-1: Protocol definition

---

### Issue P3-4: Implement plugin sync to backend (optional)

**Labels:** `safari-plugin` `backend-sync` `optional` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Implement HTTP POST from plugin's service worker to backend when API key is configured.

#### Tasks

- [ ] In `src/background.ts`, add sync function:
  ```typescript
  async function syncQueueToBackend(apiKey: string, queue: PluginQueueItem[]) {
    // Send pending items to backend
    // Mark successful items as synced
    // Retry failed items with exponential backoff
  }
  ```
- [ ] Implement sync loop:
  - Schedule sync based on sync interval (manual, 5m, 15m, 1h)
  - On sync timer or manual trigger:
    - Read queue from storage
    - Filter items with syncStatus = 'pending'
    - POST each to backend
    - Update syncStatus based on response
    - Persist updated queue
    - Show status notification (badge, toast)
- [ ] Implement retry logic:
  - On 4xx error: mark as failed permanently (user action needed)
  - On 5xx or network error: retry with exponential backoff (1s, 2s, 4s, stop)
  - Max 3 retry attempts per item
  - Track syncAttempts and lastSyncError
- [ ] Implement failure handling:
  - Network offline: queue persists locally, retry on reconnect
  - Backend unavailable: queue persists locally, retry later
  - Invalid API key: show UI warning in settings, don't retry
  - Rate limited (429): pause syncing for 1 hour
- [ ] Update badge count:
  - Show number of pending + failed items
  - Update in real-time as queue changes
- [ ] Add logging:
  - Log all sync attempts, successes, and failures
  - Accessible via settings "View Logs" button
- [ ] Write tests:
  - Sync sends all pending items
  - Retry logic works
  - Failed items are marked and tracked
  - Offline mode leaves queue intact

#### Acceptance Criteria

- Sync reliably posts to backend when API key configured
- Retry logic handles transient failures
- Queue persists through offline periods
- Status is transparent to user

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P3, Phase P4 (Should Have)
- Issue P3-1: Protocol definition
- Issue P3-3: Backend API endpoint

---

## Phase P4 — Feature Enhancements

---

### Issue P4-1: Implement sidebar panel with extended job form

**Labels:** `safari-plugin` `ui` `sidebar` `enhancement` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Create a sidebar panel (accessible via keyboard shortcut) with the full job form, allowing users to capture detailed job information beyond the quick-popup flow.

#### Tasks

- [ ] Create `Resources/sidebar.html`:
  - All job fields: company, title, url, notes, salary, deadline, location, job type, remote status
  - Organized in sections (basic, details, preferences)
  - "Save & Close" and "Save & Continue" buttons
  - "Discard" button
- [ ] Create `Resources/sidebar.ts`:
  - Pre-fill from page if available (same as popup)
  - Form state management (persist even if user navigates away, re-open to find work in progress)
  - Validation on submit
  - Send CAPTURE_JOB message with full payload
- [ ] Register sidebar in manifest
  - Keyboard shortcut: Cmd+Shift+K
  - Show sidebar on any page (not just job postings)
- [ ] Style sidebar:
  - Fixed width (300–400px)
  - Scrollable if content extends below fold
  - Consistent with popup and settings styling
- [ ] Write tests:
  - Sidebar loads and displays form
  - Pre-fill works from content script
  - Form state persists across navigation
  - Submit sends full job payload

#### Acceptance Criteria

- Sidebar is accessible via Cmd+Shift+K
- All job fields can be entered
- Form state persists until explicitly cleared
- Sidebar doesn't break page layout or functionality

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P4-1
- Issue P2-1: Popup UI (base styling and form logic)

---

### Issue P4-2: Add multi-site content detection (Indeed, Glassdoor, Lever, Greenhouse)

**Labels:** `safari-plugin` `content-script` `detection` `enhancement` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Extend content script to support job posting detection and pre-fill on major job boards beyond LinkedIn.

#### Tasks

- [ ] Add extraction templates for:
  - Indeed (extractors for title, company, salary, location)
  - Glassdoor (extractors)
  - Lever (extractors)
  - Greenhouse (extractors)
- [ ] Update job-posting detection heuristics:
  - Add domain-specific indicators
  - Refine keyword matching based on real examples
  - Test against 20+ job postings per site
- [ ] Create test suite:
  - Mock HTML from each job board
  - Verify extraction accuracy
  - Log any extraction failures
- [ ] Update documentation:
  - List all supported job sites
  - Note pre-fill accuracy per site (e.g., 95% for LinkedIn, 88% for Indeed)
- [ ] Add analytics (optional):
  - Track which sites users capture from
  - Report pre-fill accuracy statistics
- [ ] Write tests:
  - Extraction works for each site
  - Confidence scoring is accurate
  - Fallback works for unsupported sites

#### Acceptance Criteria

- At least 5 major job sites supported
- Pre-fill accuracy ≥ 85% per site
- Fallback to manual entry always available
- Zero false positives

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P4-2
- Issue I1-3: Content script
- Issue P2-3: Pre-fill implementation

---

### Issue P4-3: Implement salary extraction from page content

**Labels:** `safari-plugin` `enhancement` `salary` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Detect and extract salary information from job posting pages using heuristic patterns.

#### Tasks

- [ ] Create salary extraction utility in `src/utils.ts`:
  ```typescript
  function extractSalary(pageText: string): string | null {
    // Regex patterns for common formats:
    // "$50,000 - $80,000"
    // "50k - 80k per year"
    // "$50k-$80k"
    // "50-80k"
    // Returns best match or null
  }
  ```
- [ ] Implement patterns for:
  - USD range: `$50,000 - $80,000`
  - Short form: `50k - 80k`
  - Per year: `$50,000 per year`
  - Hourly: `$35 - $50 per hour`
  - Handle different separators: hyphen, "to", "–"
- [ ] Handle edge cases:
  - Multiple salary mentions (pick first/highest/most specific)
  - Salary in job description vs. listing metadata
  - Non-USD currencies (skip or note)
  - Confidence scoring (exact match vs. heuristic)
- [ ] In content script, extract salary and pass to popup
- [ ] In popup, pre-fill salary field (editable)
- [ ] Add logging to debug extraction accuracy
- [ ] Write tests:
  - Extraction works for all common formats
  - Confidence scoring is reasonable
  - No false positives
  - Handles edge cases gracefully

#### Acceptance Criteria

- Salary extracted on 80%+ of postings that include it
- No hallucinations (empty field is acceptable)
- User can always override in form

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P4-3
- Issue P1-3: Content script

---

### Issue P4-4: Add keyboard shortcuts and icon badge

**Labels:** `safari-plugin` `ux` `keyboard-shortcuts` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Implement keyboard shortcuts to quickly access plugin UI and add a badge showing pending job count.

#### Tasks

- [ ] Register keyboard shortcuts in manifest:
  - Cmd+Shift+J: Open popup
  - Cmd+Shift+K: Open sidebar
  - Make shortcuts configurable in Settings (optional enhancement)
- [ ] Implement badge:
  - Show number in icon (pending queue count)
  - Updates in real-time as jobs are added/synced
  - Badge text: show "3" if 3 jobs pending, hide if 0
- [ ] Add settings to control shortcuts:
  - Allow users to customize or disable
  - Store in plugin settings
- [ ] Test on macOS:
  - Shortcuts work consistently
  - No conflicts with system shortcuts
  - Badge updates accurately
- [ ] Documentation:
  - List default shortcuts
  - Explain how to customize

#### Acceptance Criteria

- Keyboard shortcuts work as expected
- Badge count is accurate and updates in real-time
- Works on macOS 12.0+ and Safari 15.0+

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P4-4
- Safari Extensions Documentation: https://developer.apple.com/documentation/safari

---

## Phase P5 — Testing and Documentation

---

### Issue P5-1: Unit tests for service worker and storage

**Labels:** `safari-plugin` `testing` `unit` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Add comprehensive unit tests for the service worker, message routing, and queue persistence logic.

#### Tasks

- [ ] Set up test framework:
  - Vitest (same as job-tracker)
  - Mock `browser.storage.local` API
  - Mock message listeners
- [ ] Write tests for service worker (`src/background.ts`):
  - Message dispatcher routes all message types correctly
  - Unknown message types are logged and ignored
  - Error handling doesn't crash
- [ ] Write tests for queue persistence:
  - Add item to queue → persists to storage
  - Read queue → retrieved correctly
  - Clear queue → storage is empty
  - Survive service worker restart (storage is persistent)
  - Max queue size enforced (warn at 500)
- [ ] Write tests for settings persistence:
  - Save/load API key
  - Save/load sync interval
  - Save/load notification preference
  - Default settings on first load
- [ ] Write tests for sync retry logic:
  - Exponential backoff (1s, 2s, 4s)
  - Max 3 retries
  - Failed items are tracked
- [ ] Achieve ≥ 80% code coverage for service worker
- [ ] CI integration:
  - Run tests on every commit
  - Fail PR if coverage drops

#### Acceptance Criteria

- All critical paths tested
- No flaky tests (deterministic, repeatable)
- Code coverage ≥ 80%
- CI passes

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P5
- Issue P1-2: Service worker
- Issue P1-3: Content script

---

### Issue P5-2: Integration tests for UI and messaging

**Labels:** `safari-plugin` `testing` `integration` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Test popup UI, content script, and service worker working together.

#### Tasks

- [ ] Set up integration test environment:
  - Vitest with DOM simulation
  - Mock browser.storage and messaging APIs
  - Load HTML/CSS into test environment
- [ ] Test popup UI flow:
  - Form loads and renders
  - Pre-fill from content script works
  - Form validation triggers errors
  - Submit sends correct message to service worker
  - Toast notification shows on success
  - Popup closes on success
- [ ] Test content script:
  - Content script loads on page without breaking it
  - Metadata extraction works
  - Messaging to service worker works
  - Pre-fill data is correctly formatted
- [ ] Test E2E messaging:
  - Content script → Service worker → Popup (with data)
  - Popup → Service worker → Queue persisted
- [ ] Test error scenarios:
  - Content script error doesn't break page
  - Missing metadata falls back gracefully
  - Service worker error is logged and communicated to UI
- [ ] Mock job site extraction:
  - LinkedIn mock page → correct extraction
  - Indeed mock page → correct extraction
  - Non-job page → low confidence, no pre-fill

#### Acceptance Criteria

- All integration paths tested
- Mock job site pre-fills are accurate
- Error handling is solid
- No race conditions

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P5
- Issue P2-1: Popup UI
- Issue P1-3: Content script

---

### Issue P5-3: E2E tests in Safari (manual and automation)

**Labels:** `safari-plugin` `testing` `e2e` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Test complete user workflows in Safari using both manual scripts and automated tools.

#### Tasks

- [ ] Define E2E test scenarios:
  1. **Capture LinkedIn Job:** Open LinkedIn job posting, click plugin, fill form, capture, verify job appears in job-tracker
  2. **Sidebar Form:** Open sidebar with Cmd+Shift+K, fill all fields, capture, verify
  3. **Sync to Backend:** Configure API key in settings, capture job, verify POST to backend
  4. **Offline Mode:** Disable network, capture job, verify persists to localStorage, reconnect and sync
  5. **Settings:** Change API key, sync interval, notifications, restart plugin, verify settings persist
  6. **Queue Import:** Directly add job to localStorage queue (simulate plugin capture), open job-tracker, verify auto-import
- [ ] Create manual test script:
  - Step-by-step instructions for each scenario
  - Expected outcomes documented
  - Screenshots for reference
- [ ] Implement WebDriver tests (if feasible):
  - Use Selenium or similar to automate Safari testing
  - Can test 3–4 critical scenarios
  - Document browser setup for CI
- [ ] Test on multiple macOS versions:
  - macOS 12 (Monterey)
  - macOS 13 (Ventura)
  - macOS 14 (Sonoma)
  - macOS 15 (latest, if available)
- [ ] Test on multiple Safari versions:
  - Safari 15.0+, 16.0+, 17.0+
- [ ] Document results:
  - Pass/fail per scenario per OS/Safari version
  - Known issues or limitations

#### Acceptance Criteria

- All 6+ scenarios pass on at least 2 macOS versions
- Release smoke test documented and reproducible
- No critical bugs blocking release
- Manual test script is clear and actionable

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md) — Phase P5, Validation Checklist

---

### Issue P5-4: Documentation (User Guide, Developer Guide, Troubleshooting)

**Labels:** `safari-plugin` `documentation` `v1.0`
**Milestone:** Safari Plugin v1.0

#### Summary

Create comprehensive documentation for users and developers.

#### Tasks

- [ ] **User Guide (README.md in plugin repo):**
  - Installation: How to download, install, enable in Safari
  - Quick Start: Open job posting, click plugin, capture
  - Settings: API key, sync interval, notifications
  - Keyboard shortcuts
  - Supported job sites and accuracy stats
  - FAQ: "Why won't it pre-fill?", "Where are my jobs?", "How do I uninstall?"
  - Screenshots of UI

- [ ] **Developer Guide (DEVELOPMENT.md):**
  - Architecture overview (service worker, content script, popup, sidebar)
  - Message protocol documentation
  - How to extend to new job sites (extraction template)
  - Build and test commands
  - Debugging tips
  - Code structure and naming conventions

- [ ] **Privacy and Security Policy (PRIVACY.md):**
  - What data the plugin collects
  - How data is stored (localStorage vs. backend)
  - User consent and data deletion
  - No third-party tracking
  - Permissions explained (why plugin needs content-script permission, etc.)

- [ ] **Troubleshooting Guide (TROUBLESHOOTING.md):**
  - Plugin doesn't load → check Safari version, enable in Settings
  - Pre-fill not working → check if site is supported, try "View Logs"
  - Sync failures → check API key, network connection, backend logs
  - Jobs not appearing → check localStorage, manual sync
  - Performance issues → disable auto-sync, clear queue

- [ ] **Integration with job-tracker README:**
  - Link to plugin in main README
  - Quick link: "Install Safari Plugin"
  - Note that plugin is optional

- [ ] **Changelog (CHANGELOG.md):**
  - v1.0 release notes
  - Features, bug fixes, known issues
  - Link to upgrade guide

#### Acceptance Criteria

- User can install and use plugin without external help
- Developer can extend without modifying core code
- All common issues documented with solutions
- Documentation is clear and accessible

#### References

- [Safari Plugin Release Plan](./SAFARI_PLUGIN_RELEASE_PLAN.md), all phases
- job-tracker README for integration

---

## Summary Table

| ID | Title | Phase | Labels |
|----|-------|-------|--------|
| P1-1 | Set up Safari App Extension project | P1 | `infrastructure` |
| P1-2 | Implement service worker and messaging | P1 | `service-worker` |
| P1-3 | Implement content script | P1 | `content-script` |
| P2-1 | Build popup UI | P2 | `ui` `popup` `ux` |
| P2-2 | Build settings page | P2 | `ui` `settings` |
| P2-3 | Implement context-aware pre-fill | P2 | `ui` `pre-fill` |
| P3-1 | Define communication protocol | P3 | `protocol` `architecture` |
| P3-2 | Implement web app import hook | P3 | `integration` `hooks` |
| P3-3 | Add backend API endpoint | P3 | `backend` `api` `optional` |
| P3-4 | Implement plugin sync to backend | P3 | `backend-sync` `optional` |
| P4-1 | Implement sidebar panel | P4 | `ui` `sidebar` |
| P4-2 | Add multi-site detection | P4 | `content-script` `detection` |
| P4-3 | Implement salary extraction | P4 | `content-script` `salary` |
| P4-4 | Add keyboard shortcuts and badge | P4 | `ux` `keyboard-shortcuts` |
| P5-1 | Unit tests for service worker | P5 | `testing` `unit` |
| P5-2 | Integration tests for UI | P5 | `testing` `integration` |
| P5-3 | E2E tests in Safari | P5 | `testing` `e2e` |
| P5-4 | Documentation | P5 | `documentation` |

**Total: 18 issues**

---

## Suggested Labels to Create in Forgejo

| Label | Color | Purpose |
|-------|-------|---------|
| `safari-plugin` | `#0075ca` | Safari Plugin feature work |
| `plugin` | `#7057ff` | Browser plugin related |
| `infrastructure` | `#5319e7` | Plugin setup and build |
| `service-worker` | `#1d76db` | Service worker implementation |
| `content-script` | `#1d76db` | Content script implementation |
| `messaging` | `#1d76db` | Cross-component messaging |
| `popup` | `#bfd4f2` | Popup UI component |
| `sidebar` | `#bfd4f2` | Sidebar UI component |
| `ui` | `#bfd4f2` | UI component changes |
| `settings` | `#bfd4f2` | Settings/preferences UI |
| `ux` | `#fef2c0` | User experience improvements |
| `keyboard-shortcuts` | `#fef2c0` | Keyboard accessibility |
| `pre-fill` | `#e0f2fe` | Form pre-population |
| `detection` | `#a3e6d4` | Content/site detection |
| `salary` | `#c6f6d5` | Salary-related features |
| `integration` | `#1d76db` | Integration with job-tracker |
| `protocol` | `#c2e0c6` | Message/communication protocol |
| `architecture` | `#c2e0c6` | Architectural design |
| `backend` | `#5319e7` | Node/backend changes |
| `api` | `#5319e7` | API endpoint changes |
| `backend-sync` | `#5319e7` | Backend synchronization |
| `optional` | `#f9d0c4` | Optional/defer-able work |
| `hooks` | `#1d76db` | React hook changes |
| `testing` | `#f9d0c4` | Test additions |
| `unit` | `#f9d0c4` | Unit tests |
| `integration` | `#f9d0c4` | Integration tests |
| `e2e` | `#f9d0c4` | End-to-end tests |
| `documentation` | `#d4c5f9` | Docs and guides |
| `v1.0` | `#0052cc` | Safari Plugin v1.0 release |
| `dom` | `#e8f5e9` | DOM manipulation |
| `enhancement` | `#a2eeef` | Feature enhancements |

---

## Milestones in Forgejo

Create the following milestone:
- **Safari Plugin v1.0** — Q2 2026 release target

Assign all issues to this milestone.

---

## Revision History

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2026-03-14 | 1.0 | Claude Code | Initial Safari Plugin Forgejo issue backlog |

