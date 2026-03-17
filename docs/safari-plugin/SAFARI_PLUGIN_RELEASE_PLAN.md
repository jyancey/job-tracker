# Job Tracker Safari Plugin — Release Plan

**Release Target:** Q2 2026
**Release Theme:** Direct job-capture from browser, eliminating web scraping dependency
**Status:** Planning

---

## Overview

The Safari Plugin project replaces the fragile job-posting scraper with a user-driven capture mechanism. Instead of attempting to parse arbitrary job posting HTML, users install a Safari toolbar button that captures job details directly from any webpage and pipes them into job-tracker.

This approach eliminates scraper maintenance, improves data quality (user controls what's captured), and enables cross-site support with zero configuration.

## Baseline (from job-tracker v2.7.0)

- job-tracker running as a production React application
- localStorage-based persistence (primary storage)
- Optional Node backend with SQLite support
- Service layer established for job operations
- 681 passing tests

**Browser Target:** macOS Safari 15.0+ (current and previous 2 major releases)

## Release Goals

### Must Have

1. **Core Plugin Framework:** Safari App Extension with content script and service worker infrastructure.
2. **Quick-Capture UI:** Popup form capturing company, job title, job URL, and notes.
3. **localStorage Sync:** Plugin writes to job-tracker queue; app imports on load or via sync button.
4. **Settings Page:** Plugin authentication (API key) and sync preferences.
5. **Basic Content Script:** Detect job posting context and pre-fill company/title on supported sites (LinkedIn minimum).
6. **Documentation:** Setup guide for users, developer guide for contributors.

### Should Have

1. **Multiple Job Sites:** Support Indeed, Glassdoor, and general web forms beyond LinkedIn.
2. **Sidebar Panel:** Extended form accessible via keyboard shortcut for detailed capture.
3. **Auto-Sync:** Background sync to server if job-tracker backend API available.
4. **Keyboard Shortcuts:** Cmd+Shift+J (popup), Cmd+Shift+K (quick add).
5. **Status Notifications:** Icon badge showing pending job count.

### Could Have

1. **Salary Detection:** Extract salary ranges from page content.
2. **Resume Attach:** Ability to attach a resume file to a captured job.
3. **Browser History Integration:** Offer recent URLs as job links.
4. **Multi-Browser Support:** Firefox and Chrome variants (requires separate implementation, deferred to v1.1).

---

## Detailed Scope

### Phase 1: Core Plugin Infrastructure

**Deliverable:** Functional Safari App Extension with message routing and basic rendering.

#### P1-1: Set up Safari App Extension project structure
- Create new Xcode project for Safari App Extension
- Configure `Info.plist` for macOS 12.0+ target
- Set up TypeScript/JavaScript build pipeline (esbuild or webpack)
- Create placeholder `manifest.json` and service worker stub
- Document: macOS/Xcode version requirements, setup instructions

**Success Criteria:**
- Extension loads without errors in Safari
- Service worker starts cleanly
- Developer can test in Safari

#### P1-2: Implement service worker and message routing
- Create service worker that listens for popup/content-script messages
- Implement message dispatcher for: `CAPTURE_JOB`, `SYNC`, `GET_SETTINGS`, `SAVE_SETTINGS`
- Add error handling and logging
- Implement queue persistence in Safari's internal storage (not localStorage)

**Success Criteria:**
- All message types route correctly
- No silent failures
- Queue survives service worker restarts

#### P1-3: Implement content script for page interaction
- Create content script injected into all pages
- Add document metadata detection (page title, URL, meta tags)
- Implement page context detection (is this a job posting?)
- Bootstrap `job-tracker-plugin` global object for user scripts

**Success Criteria:**
- Content script injects without breaking page
- Metadata accessible to popup (via messaging)
- No console errors in browser DevTools

### Phase 2: Plugin UI

**Deliverable:** Functional popup form and settings page UI.

#### P2-1: Build popup UI (HTML/CSS + TypeScript)
- Create popup.html with form fields: Company, Job Title, Job URL, Notes
- Style with Safari-native appearance (simple, clean)
- Implement form state management (local state, validation)
- Add "Save & Close" button (triggers `CAPTURE_JOB` message)
- Show loading spinner on save, then dismiss popup

**Success Criteria:**
- Form is usable and accessible
- No layout regressions on macOS (light/dark mode)
- Users can fill and submit in < 10 seconds

#### P2-2: Build settings page
- Create settings.html with: API key input, Sync interval dropdown, Notifications toggle
- Persist settings to Safari internal storage
- Add "Test Connection" button (validates API key if backend connected)
- Include "Clear Cache" and "View Logs" for debugging

**Success Criteria:**
- Settings persist across plugin restarts
- Users can enable/disable notifications
- Accessibility: keyboard-navigable, screen-reader compatible

#### P2-3: Implement context-aware pre-fill
- Detect common job site structures (LinkedIn, Indeed, Glassdoor)
- Extract company name and job title from page DOM
- Pre-populate popup form when opened on a job posting
- Fall back to empty form on non-job pages

**Success Criteria:**
- LinkedIn job posts: 100% pre-fill (company + title)
- Indeed job posts: 90%+ pre-fill
- Zero false positives (pre-fill only on actual job pages)

### Phase 3: Integration with job-tracker

**Deliverable:** Plugin and web app seamlessly sync job captures.

#### P3-1: Define plugin ↔ web app communication protocol
- Design localStorage queue format: `job-tracker-plugin-queue`
- Document message schema (version, timestamp, job fields, sourceUrl, sourcePageTitle)
- Define sync methods: localStorage polling vs. HTTP POST to backend
- Create TypeScript types for plugin messages

**Success Criteria:**
- Protocol versioned and documented
- Types are shared between plugin and web app
- Backward compatibility plan established

#### P3-2: Implement web app import from plugin queue
- Create `usePluginQueue` hook that monitors localStorage for plugin updates
- On app load, check for queued jobs and import automatically
- Show toast: "X new jobs captured from Safari plugin"
- Add manual sync button in Settings for user control
- Clear queue on successful import

**Success Criteria:**
- Web app detects new plugin queue entries
- Jobs are imported with correct schema
- User gets feedback on import success

#### P3-3: Add backend API endpoint for plugin (optional)
- Create `POST /api/jobs/from-plugin` on optional backend
- Accept authentication token (API key from plugin settings)
- Validate job payload and store in workspace
- Return created job ID or validation errors

**Success Criteria:**
- Endpoint handles plugin payloads correctly
- Validation matches web app jobService rules
- API tests pass

#### P3-4: Implement plugin sync to backend (optional)
- Add HTTP POST to plugin's service worker
- Send captured jobs to backend if API key is configured
- Retry on network failure (exponential backoff, max 3 retries)
- Clear queue on successful backend sync
- Fall back to localStorage if backend unavailable

**Success Criteria:**
- Plugin can reach backend API
- Payload schema matches endpoint expectations
- Offline mode gracefully degrades to localStorage

### Phase 4: Feature Enhancements

**Deliverable:** Extended capture workflow and user experience improvements.

#### P4-1: Implement sidebar panel for extended capture
- Create sidebar.html with full job form (all Job fields)
- Trigger via keyboard shortcut: Cmd+Shift+K
- Show all job details: company, title, URL, notes, salary, deadline, status, etc.
- Persist form state if user dismisses without saving

**Success Criteria:**
- Sidebar opens quickly (< 500ms)
- All Job fields are editable
- Form state survives sidebar close/reopen

#### P4-2: Add multi-site content detection
- Extend content script to detect: LinkedIn, Indeed, Glassdoor, Lever, Greenhouse
- Per-site extraction templates for consistent pre-fill
- User reports for "this didn't pre-fill correctly"
- Dashboard showing site coverage statistics

**Success Criteria:**
- At least 5 major job sites supported
- Pre-fill accuracy ≥ 90% on each site
- Fallback to manual entry is always available

#### P4-3: Implement salary extraction
- Use heuristic regex for common salary formats ("$X-$Y", "X-Y per year", etc.)
- Extract from page content when present
- Pre-fill salary field in popup/sidebar
- Log extraction confidence for debugging

**Success Criteria:**
- Extracts salary on 80%+ of postings that include it
- No hallucinations (empty salary field is OK)
- User can override in popup

#### P4-4: Add keyboard shortcuts and status badge
- Cmd+Shift+J: Open popup
- Cmd+Shift+K: Open sidebar
- Icon badge shows pending capture count (e.g. "3")
- Badge updates in real-time as jobs are added/synced

**Success Criteria:**
- All shortcuts work consistently
- Badge count is accurate
- Shortcuts configurable in Settings (optional)

### Phase 5: Testing and Documentation

**Deliverable:** Shipping-ready plugin with comprehensive docs and test coverage.

#### P5-1: Unit tests for service worker and storage
- Test queue persistence (add, read, clear)
- Test message dispatcher (routing, error handling)
- Test sync retry logic (offline, server error, success)
- Achieve ≥ 80% code coverage

**Success Criteria:**
- All critical paths tested
- No flaky tests
- CI passes on every commit

#### P5-2: Integration tests for popup UI and content script
- Test form validation (required fields, URL format)
- Test pre-fill accuracy on mock job pages
- Test popup ↔ service worker messaging
- Test localStorage sync with mock web app

**Success Criteria:**
- UI integration tests pass
- Content script correctly handles diverse page structures
- No race conditions in message passing

#### P5-3: E2E tests in Safari (manual and automation)
- Test: Open Safari, capture job on LinkedIn, verify web app imports
- Test: Sidebar form, all fields populated, sync to backend
- Test: Offline mode persists to localStorage, retries on reconnect
- Test: Settings saved and applied
- Document manual test cases for pre-release validation

**Success Criteria:**
- 3+ full-flow E2E scenarios pass
- Release smoke test documented
- Users can validate before public release

#### P5-4: Documentation
- **User Guide:** Install plugin, capture, sync, settings
- **Developer Guide:** Architecture, message protocol, extending to new job sites
- **Troubleshooting:** Common issues (plugin not loading, sync failures)
- **Privacy Policy:** What data plugin collects and how it's used

**Success Criteria:**
- User can install and capture without support
- Developer can extend plugin to new sites
- All troubleshooting FAQs addressed

---

## Gates

### Gate 1: Core Infrastructure & Phase 1 Complete

- [ ] Safari App Extension loads and runs cleanly
- [ ] Service worker message routing tested
- [ ] Content script injects without errors
- [ ] P1 phase issues closed

### Gate 2: UI & Basic Integration Complete

- [ ] Popup form UI is functional and styled
- [ ] Settings page stores and retrieves data
- [ ] Web app detects and imports plugin queue
- [ ] P2 and P3 phase issues closed
- [ ] localStorage sync E2E flow works
- [ ] Manual testing on 5 macOS versions passes

### Gate 3: Release Candidate

- [ ] All unit/integration tests pass
- [ ] All E2E scenarios pass
- [ ] Documentation is complete and reviewed
- [ ] Privacy and security review passed
- [ ] Release notes prepared
- [ ] First user validation (beta feedback) collected (if applicable)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Safari App Extension API changes | Low | High | Monitor Apple dev releases, test on beta OS versions |
| localStorage quota exceeded | Low | Medium | Implement queue cleanup, warn user if queue > 50 items |
| Plugin crashes on malformed job pages | Medium | Medium | Robust error handling in content script, graceful degradation |
| Users forget to install plugin | N/A | Low | In-app prompt to install, user education docs |
| Sync conflicts (plugin queue vs. backend) | Low | Medium | Clear messaging, queue = source of truth until sync confirms |
| Performance: polling localStorage burdens app | Low | Medium | Use debouncing, optional per-user polling interval |
| Multi-site pre-fill false positives | Medium | Medium | Conservative heuristics, always provide manual override |

---

## Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| P1: Core Infrastructure | 2 weeks | Week 1 | Week 2 |
| P2: UI & Settings | 2 weeks | Week 3 | Week 4 |
| P3: Integration | 1.5 weeks | Week 5 | Week 6 |
| P4: Enhancements | 1.5 weeks | Week 6 | Week 7 |
| P5: Testing & Docs | 2 weeks | Week 8 | Week 9 |
| Buffer & Release Prep | 1 week | Week 10 | Week 10 |

**Total: ~10 weeks (Q2 2026 target)**

---

## Release Validation Checklist

### Pre-Release
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E flows pass on macOS 12, 13, 14, 15
- [ ] Production build created and code-signed
- [ ] Privacy policy reviewed and approved
- [ ] Documentation proofread and linked from README
- [ ] No console errors or warnings in plugin or web app

### Release Day
- [ ] GitHub release tagged with version (e.g. `safari-plugin/v1.0.0`)
- [ ] Release notes published
- [ ] Web app README updated with plugin link
- [ ] Safari App Store submission prepared (or self-signed distribution)
- [ ] User documentation pages deployed
- [ ] Announcement to user base (email, social media)

---

## Assumptions

1. **No Auth Required in v1.0:** Plugin and web app share localStorage on same machine. Multi-user scenarios are out of scope.
2. **localStorage as Primary Sync:** HTTP backend API is optional; localStorage sync is the MVP.
3. **Single Active Workspace:** Plugin always syncs to the currently active job-tracker workspace (P3-4 from v2.8.0).
4. **Safari-Only for v1.0:** Chrome/Firefox support deferred to v1.1.
5. **User Responsibility:** Users manually install and configure plugin; no auto-update mechanism in v1.0.

---

## Success Metrics (Post-Release)

- Users can install plugin and capture a job in < 5 minutes
- Pre-fill accuracy ≥ 85% on major job sites
- Plugin sync reliability ≥ 99.9% (queue never lost)
- User satisfaction score ≥ 4.0 / 5.0 in post-release survey
- Zero security/privacy incidents in first 30 days

---

## Out of Scope (Deferred to v1.1+)

- Firefox and Chrome variants
- Cloud sync (multi-device)
- Resume attachment workflow
- Salary history tracking
- Job interview prep integration
- ChatGPT-powered job summary
- Multi-browser bookmark sync
- Scheduled job monitoring
- OAuth authentication

---

## Revision History

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2026-03-14 | 1.0 | Claude Code | Initial Safari Plugin release plan |

---

## References

- [Job Tracker Architecture Overview](./ARCHITECTURE.md)
- [v2.8.0 Release Plan](./V2_8_0_RELEASE_PLAN.md) — Workspace separation, needed before plugin v1.0
- Safari App Extension Development Guide: https://developer.apple.com/safari/

