#!/bin/bash
# WSL Test Script - FÃ¼hrt Tests auÃŸerhalb von Cursor aus
set -e
PROJECT_ROOT="/mnt/c/cursor.ai/WattOS_Plattform"
cd "$PROJECT_ROOT" || exit 1
echo "ðŸ§ª Starte Tests in WSL..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
if [ ! -d "node_modules" ]; then
    echo "ðŸ“¦ Installiere Dependencies..."
    pnpm install
fi
if [ -z "$1" ]; then
    pnpm test 2>&1 | tee test-results.log
else
    cd "$1" && pnpm test 2>&1 | tee "../../test-results-$1.log"
fi
echo "âœ… Tests abgeschlossen."