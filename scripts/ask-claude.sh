#!/usr/bin/env sh
set -eu

if [ "$#" -eq 0 ]; then
  echo "Usage: scripts/ask-claude.sh <question or task>" >&2
  exit 1
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
echo "[omk] wrapper deprecation: prefer 'omk ask claude \"...\"'." >&2
if [ -x "$SCRIPT_DIR/../bin/omk.js" ]; then
  if node "$SCRIPT_DIR/../bin/omk.js" ask claude "$@"; then
    exit 0
  fi
  echo "[omk] wrapper fallback: bin/omk ask failed, using legacy advisor script." >&2
fi
exec node "$SCRIPT_DIR/run-provider-advisor.js" claude "$@"
