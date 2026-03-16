#!/bin/bash

set -euo pipefail

TARGET_PLIST="$HOME/Library/LaunchAgents/com.local.job-tracker.plist"
GUI_DOMAIN="gui/$(id -u)"

launchctl bootout "$GUI_DOMAIN" "$TARGET_PLIST" >/dev/null 2>&1 || true
rm -f "$TARGET_PLIST"

echo "Removed launch agent: $TARGET_PLIST"