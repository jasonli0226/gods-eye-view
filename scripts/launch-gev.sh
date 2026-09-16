#!/usr/bin/env bash
# Desktop-icon launcher: starts the dev server and opens the app in the
# default browser. Keeps the terminal open so the server can be watched
# or stopped with Ctrl+C.
#
# Launched from a GUI desktop icon, this runs as a non-interactive shell
# that never sources ~/.bashrc or ~/.zshrc, so a PATH set up there (e.g.
# node/npm installed via nvm) is not present. Load nvm explicitly here.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found on PATH (even after trying to load nvm from $NVM_DIR)." >&2
  echo "Install Node.js, or fix NVM_DIR in this script, then try again." >&2
  read -rp "Press Enter to close..." _
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (first run)..."
  if ! npm install; then
    echo "ERROR: npm install failed. See output above." >&2
    read -rp "Press Enter to close..." _
    exit 1
  fi
fi

npm run dev -- --open
status=$?
if [ "$status" -ne 0 ]; then
  echo "ERROR: dev server exited with status $status." >&2
fi
read -rp "Press Enter to close..." _
exit "$status"
