#!/bin/bash
# WSL Build Script - FÃ¼hrt Builds auÃŸerhalb von Cursor aus
set -e
PROJECT_ROOT="/mnt/c/cursor.ai/WattOS_Plattform"
cd "$PROJECT_ROOT" || exit 1
echo "ðŸ”¨ Starte Build in WSL..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
if [ ! -d "node_modules" ]; then
    echo "ðŸ“¦ Installiere Dependencies..."
    pnpm install
fi
if [ -z "$1" ]; then
    pnpm build 2>&1 | tee build-results.log
else
    cd "$1" && pnpm build 2>&1 | tee "../../build-results-$1.log"
fi
echo "âœ… Build abgeschlossen."