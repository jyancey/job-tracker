#!/bin/bash

set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$APP_ROOT"
mkdir -p "$APP_ROOT/data"

# Next standalone reads HOSTNAME directly. Some environments set HOSTNAME to a
# machine name (e.g. "lappy") that may not resolve, causing ENOTFOUND on bind.
BIND_HOST="${JOB_TRACKER_HOST:-${HOSTNAME:-localhost}}"
case "$BIND_HOST" in
	127.0.0.1|0.0.0.0|localhost|::1|::)
		;;
	"")
		BIND_HOST="localhost"
		;;
	*)
		if [[ "$BIND_HOST" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
			:
		else
			echo "WARN: Unsupported JOB_TRACKER_HOST '$BIND_HOST'; falling back to localhost" >&2
			BIND_HOST="localhost"
		fi
		;;
esac

export HOSTNAME="$BIND_HOST"
export PORT="${PORT:-3100}"
export NODE_ENV="production"
export JOB_TRACKER_DB_PATH="${JOB_TRACKER_DB_PATH:-$APP_ROOT/data/job-tracker.sqlite}"

ensure_sqlite_external_aliases() {
	local chunks_dir="$APP_ROOT/.next/server/chunks"
	local aliases_dir="$APP_ROOT/.next/node_modules"
	local aliases

	if [[ ! -d "$chunks_dir" ]]; then
		return 0
	fi

	mkdir -p "$aliases_dir"
	aliases="$(grep -RhoE 'better-sqlite3-[a-f0-9]{8,}' "$chunks_dir" 2>/dev/null | sort -u || true)"
	if [[ -z "$aliases" ]]; then
		return 0
	fi

	while IFS= read -r alias; do
		if [[ -z "$alias" ]]; then
			continue
		fi

		if /usr/bin/env node -e "require.resolve('$alias')" >/dev/null 2>&1; then
			continue
		fi

		echo "Repairing missing Next external alias package: $alias" >&2
		mkdir -p "$aliases_dir/$alias"
		cat > "$aliases_dir/$alias/package.json" <<JSON
{
  "name": "$alias",
  "private": true,
  "main": "index.js"
}
JSON
		cat > "$aliases_dir/$alias/index.js" <<'JS'
module.exports = require('better-sqlite3');
JS
	done <<< "$aliases"
}

ensure_sqlite_native_module() {
	if /usr/bin/env node -e "try { require('better-sqlite3'); process.exit(0); } catch (e) { if (e && e.code === 'ERR_DLOPEN_FAILED') process.exit(42); throw e; }" >/dev/null 2>&1; then
		return 0
	fi

	local status=$?
	if [[ "$status" -ne 42 ]]; then
		echo "ERROR: Failed to load better-sqlite3 for an unexpected reason." >&2
		return "$status"
	fi

	echo "Detected better-sqlite3 ABI mismatch; rebuilding native module for current Node.js..." >&2
	if ! command -v npm >/dev/null 2>&1; then
		echo "ERROR: npm is required to rebuild better-sqlite3 but was not found in PATH." >&2
		return 1
	fi

	if ! npm rebuild better-sqlite3 --omit=dev --no-audit --no-fund; then
		echo "ERROR: npm rebuild better-sqlite3 failed." >&2
		return 1
	fi

	if ! /usr/bin/env node -e "require('better-sqlite3')" >/dev/null 2>&1; then
		echo "ERROR: better-sqlite3 still failed to load after rebuild." >&2
		return 1
	fi
}

ensure_sqlite_external_aliases
ensure_sqlite_native_module

exec /usr/bin/env node server.js