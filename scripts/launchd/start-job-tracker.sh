#!/bin/bash

set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$APP_ROOT"
mkdir -p "$APP_ROOT/data"

export HOSTNAME="${JOB_TRACKER_HOST:-127.0.0.1}"
export PORT="${PORT:-3100}"
export NODE_ENV="production"
export JOB_TRACKER_DB_PATH="${JOB_TRACKER_DB_PATH:-$APP_ROOT/data/job-tracker.sqlite}"

exec /usr/bin/env node server.js