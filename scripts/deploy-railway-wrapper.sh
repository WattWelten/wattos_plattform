#!/bin/bash
# Wrapper Script für Windows/Git Bash
# Setzt PATH für jq und führt Deployment aus

# Finde jq in Windows
if command -v jq &> /dev/null; then
  echo "✅ jq gefunden"
else
  # Versuche jq in Windows-Pfaden zu finden
  JQ_PATHS=(
    "/c/Program Files/Git/usr/bin/jq"
    "/c/Windows/System32/jq.exe"
    "/usr/bin/jq"
    "/usr/local/bin/jq"
  )
  
  JQ_FOUND=false
  for path in "${JQ_PATHS[@]}"; do
    if [ -f "$path" ]; then
      export PATH="$(dirname "$path"):$PATH"
      JQ_FOUND=true
      break
    fi
  done
  
  # Versuche über Windows-PATH
  if [ "$JQ_FOUND" = false ]; then
    # Konvertiere Windows-Pfad zu Git Bash-Pfad
    WINDOWS_JQ=$(cmd.exe /c "where jq 2>nul" 2>/dev/null | tr -d '\r')
    if [ -n "$WINDOWS_JQ" ]; then
      # Konvertiere C:\Path\to\jq.exe zu /c/Path/to/jq.exe
      GIT_BASH_JQ=$(echo "$WINDOWS_JQ" | sed 's|C:|/c|' | sed 's|\\|/|g')
      if [ -f "$GIT_BASH_JQ" ]; then
        export PATH="$(dirname "$GIT_BASH_JQ"):$PATH"
        JQ_FOUND=true
      fi
    fi
  fi
  
  if [ "$JQ_FOUND" = false ]; then
    echo "❌ jq nicht gefunden"
    echo "Bitte installiere jq: winget install jqlang.jq"
    exit 1
  fi
fi

# Prüfe nochmal
if ! command -v jq &> /dev/null; then
  echo "❌ jq konnte nicht gefunden werden"
  exit 1
fi

echo "✅ jq verfügbar: $(which jq)"
echo "✅ jq Version: $(jq --version)"
echo ""

# Lade Secrets (falls vorhanden)
if [ -f ".railway-secrets.env" ]; then
  echo "📝 Lade Secrets aus .railway-secrets.env..."
  set -a
  source .railway-secrets.env
  set +a
  echo "✅ Secrets geladen"
  echo ""
fi

# Führe Deployment aus
bash scripts/deploy-railway.sh "$@"






