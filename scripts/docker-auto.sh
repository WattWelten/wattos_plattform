#!/bin/bash
# scripts/docker-auto.sh
# Auto-Detection: WÃ¤hlt automatisch das richtige Skript (WSL/Linux/Windows)
# FÃ¼r Cross-Platform-Nutzung

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# PrÃ¼fe ob wir in WSL sind
if grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null ; then
    echo "ðŸ” WSL environment detected - using WSL script"
    exec "$SCRIPT_DIR/docker-start.sh" "$@"
elif [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ] || [ -n "$WINDIR" ]; then
    echo "ðŸ” Windows environment detected - using PowerShell script"
    powershell.exe -ExecutionPolicy Bypass -File "$SCRIPT_DIR/docker-start.ps1" "$@"
else
    echo "ðŸ” Linux environment detected - using Linux script"
    exec "$SCRIPT_DIR/docker-start.sh" "$@"
fi
