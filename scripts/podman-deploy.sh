#!/bin/bash

set -euo pipefail

if [[ $# -lt 1 || $# -gt 4 ]]; then
  echo "Usage: $0 <version> [output-dir] [git-sha] [git-branch]" >&2
  exit 1
fi

if ! command -v podman >/dev/null 2>&1; then
  echo "ERROR: podman is required but was not found in PATH." >&2
  exit 1
fi

if command -v podman-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(podman-compose)
elif podman compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(podman compose)
else
  echo "ERROR: podman-compose or 'podman compose' is required but was not found." >&2
  exit 1
fi

VERSION="$1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="${2:-$ROOT_DIR/deploy}"
GIT_SHA="${3:-unknown}"
GIT_BRANCH="${4:-unknown}"
IMAGE_TAG="job-tracker:${VERSION#v}"

if [[ "$OUTPUT_DIR" != /* ]]; then
  OUTPUT_DIR="$ROOT_DIR/$OUTPUT_DIR"
fi

echo "Building deploy image with Podman Compose: $IMAGE_TAG"
export JOB_TRACKER_IMAGE_TAG="$IMAGE_TAG"
"${COMPOSE_CMD[@]}" -f "$ROOT_DIR/.gitea/podman-compose.release.yml" build release

container_id="$(podman create "$IMAGE_TAG")"
cleanup() {
  podman rm -f "$container_id" >/dev/null 2>&1 || true
}
trap cleanup EXIT

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "Extracting deployment bundle"
podman cp "$container_id":/opt/job-tracker/. "$OUTPUT_DIR"

echo "Build timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')" > "$OUTPUT_DIR/BUILD_INFO.txt"
echo "Git commit: $GIT_SHA" >> "$OUTPUT_DIR/BUILD_INFO.txt"
echo "Git branch: $GIT_BRANCH" >> "$OUTPUT_DIR/BUILD_INFO.txt"

echo "Deployment bundle prepared in $OUTPUT_DIR"