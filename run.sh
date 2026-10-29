#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
if [ -x .runtime/node/bin/node ]; then export PATH="$PWD/.runtime/node/bin:$PATH"; fi
command -v node >/dev/null || { echo "Önce bash install.sh çalıştırın." >&2; exit 1; }
export RADAR_NPM_CLI="$(command -v npm || true)"
exec node scripts/run.mjs "$@"
