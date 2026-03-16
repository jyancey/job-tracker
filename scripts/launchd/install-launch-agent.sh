#!/bin/bash

set -euo pipefail

MACOS_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(cd "$MACOS_DIR/.." && pwd)"
TEMPLATE="$MACOS_DIR/com.local.job-tracker.plist.template"
AGENT_DIR="$HOME/Library/LaunchAgents"
LOG_DIR="$HOME/Library/Logs/job-tracker"
TARGET_PLIST="$AGENT_DIR/com.local.job-tracker.plist"
GUI_DOMAIN="gui/$(id -u)"

mkdir -p "$AGENT_DIR" "$LOG_DIR" "$APP_ROOT/data"

sed \
  -e "s#__APP_ROOT__#$APP_ROOT#g" \
  -e "s#__LOG_DIR__#$LOG_DIR#g" \
  "$TEMPLATE" > "$TARGET_PLIST"

chmod 644 "$TARGET_PLIST"

launchctl bootout "$GUI_DOMAIN" "$TARGET_PLIST" >/dev/null 2>&1 || true
launchctl bootstrap "$GUI_DOMAIN" "$TARGET_PLIST"
launchctl kickstart -k "$GUI_DOMAIN/com.local.job-tracker"

echo "Installed launch agent at $TARGET_PLIST"
echo "Logs: $LOG_DIR/job-tracker.log"
echo "Open: http://127.0.0.1:3100"