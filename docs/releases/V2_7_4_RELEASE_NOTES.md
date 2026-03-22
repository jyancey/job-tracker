# v2.7.4 Release Notes

**Release Date:** March 22, 2026
**Tag:** `v2.7.4`
**Baseline:** v.2.7.3 (March 22, 2026)

## Summary

v2.7.4 is a standalone runtime reliability patch release. It hardens startup behavior for packaged deployments by fixing host binding defaults, auto-rebuilding `better-sqlite3` on Node ABI mismatch, and auto-repairing missing Next.js hashed external aliases for `better-sqlite3`.

## Highlights

### Standalone Startup Defaults

- Default standalone bind host is now `localhost` (port remains `3100`)
- Host normalization now falls back safely to `localhost` when invalid host values are detected
- Launchd template and installer output now consistently point to `http://localhost:3100`

### Native Module ABI Recovery (`better-sqlite3`)

- Startup wrappers now preflight-load `better-sqlite3`
- On `ERR_DLOPEN_FAILED` / `NODE_MODULE_VERSION` mismatch, wrappers run:

  ```bash
  npm rebuild better-sqlite3 --omit=dev --no-audit --no-fund
  ```

- Startup proceeds only after successful native module load validation

### Hashed External Alias Auto-Repair

- Added runtime repair for missing Next.js external alias packages like `better-sqlite3-<hash>`
- Wrappers scan `.next/server/chunks` for required `better-sqlite3-*` aliases
- Missing alias packages are recreated under `.next/node_modules/` and forwarded to `better-sqlite3`
- Fixes runtime failures such as:
  - `Cannot find module 'better-sqlite3-90e2652d1716b047'`

### Packaging and Daemon Documentation

- `scripts/package-standalone.sh` now emits a root `start.sh` wrapper with full preflight checks
- `docs/DAEMON_SETUP.md` updated with:
  - `start.sh` usage guidance
  - `localhost:3100` defaults
  - troubleshooting for `ENOTFOUND`, ABI mismatch, and missing hashed alias errors

## Validation

| Metric | Value |
| --- | --- |
| ESLint | Passing |
| Vitest unit/integration tests | 77 files, 677 tests passing |
| Playwright E2E tests | 10 / 10 passing |
| Next.js production build | Passing |
| Standalone runtime smoke test | Passing with wrapper defaults |
| Missing alias reproduction test | Auto-repair confirmed |

## Breaking Changes

None.

## Upgrade Notes

- Repackage standalone bundles from this version to include the new startup wrappers.
- For existing extracted bundles, use `start.sh` (or `macos/start-job-tracker.sh`) to apply startup preflight checks.
