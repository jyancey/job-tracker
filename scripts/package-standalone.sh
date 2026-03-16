#!/bin/bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <output-dir>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$1"

if [[ "$OUTPUT_DIR" != /* ]]; then
  OUTPUT_DIR="$ROOT_DIR/$OUTPUT_DIR"
fi

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/.next" "$OUTPUT_DIR/macos" "$OUTPUT_DIR/docs"

cp -R "$ROOT_DIR/.next/standalone/." "$OUTPUT_DIR/"
cp -R "$ROOT_DIR/.next/static" "$OUTPUT_DIR/.next/"
cp -R "$ROOT_DIR/public" "$OUTPUT_DIR/"
cp "$ROOT_DIR/docs/DAEMON_SETUP.md" "$OUTPUT_DIR/docs/"
cp "$ROOT_DIR/scripts/launchd/com.local.job-tracker.plist.template" "$OUTPUT_DIR/macos/"
cp "$ROOT_DIR/scripts/launchd/start-job-tracker.sh" "$OUTPUT_DIR/macos/"
cp "$ROOT_DIR/scripts/launchd/install-launch-agent.sh" "$OUTPUT_DIR/macos/"
cp "$ROOT_DIR/scripts/launchd/uninstall-launch-agent.sh" "$OUTPUT_DIR/macos/"

chmod +x "$OUTPUT_DIR/macos/start-job-tracker.sh"
chmod +x "$OUTPUT_DIR/macos/install-launch-agent.sh"
chmod +x "$OUTPUT_DIR/macos/uninstall-launch-agent.sh"