#!/bin/bash

set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <version> [output-dir]" >&2
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
OUTPUT_DIR="${2:-$ROOT_DIR/release/$VERSION}"
IMAGE_TAG="job-tracker:${VERSION#v}"

if [[ "$OUTPUT_DIR" != /* ]]; then
  OUTPUT_DIR="$ROOT_DIR/$OUTPUT_DIR"
fi

mkdir -p "$OUTPUT_DIR"

echo "Building release image with Podman Compose: $IMAGE_TAG"
export JOB_TRACKER_IMAGE_TAG="$IMAGE_TAG"
"${COMPOSE_CMD[@]}" -f "$ROOT_DIR/.gitea/podman-compose.release.yml" build release

echo "Saving OCI archive"
podman image save "$IMAGE_TAG" | gzip -c > "$OUTPUT_DIR/job-tracker-$VERSION-oci-image.tar.gz"

container_id="$(podman create "$IMAGE_TAG")"
cleanup() {
  podman rm -f "$container_id" >/dev/null 2>&1 || true
}
trap cleanup EXIT

rm -rf "$OUTPUT_DIR/deploy"
mkdir -p "$OUTPUT_DIR"

echo "Extracting standalone deploy bundle from image"
podman cp "$container_id":/opt/job-tracker/. "$OUTPUT_DIR/deploy"

echo "Creating standalone archives"
(
  cd "$OUTPUT_DIR/deploy"
  zip -r "../job-tracker-$VERSION-standalone.zip" .
  tar -czf "../job-tracker-$VERSION-standalone.tar.gz" .
)

rm -rf "$OUTPUT_DIR/deploy"

echo "Release artifacts created in $OUTPUT_DIR"