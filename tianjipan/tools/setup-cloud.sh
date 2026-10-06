#!/usr/bin/env bash
set -euo pipefail
TJ_PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$TJ_PROJECT_DIR"
npm --cache /tmp/tianjipan-npm-cache ci --ignore-scripts --no-audit --no-fund
npm --cache /tmp/tianjipan-npm-cache run build
