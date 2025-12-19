#!/bin/bash
# Wrapper Script für Windows/Git Bash
# Setzt PATH für Node.js und führt Setup aus

# Node.js PATH hinzufügen (Windows Standard-Pfad)
export PATH="/c/Program Files/nodejs:$PATH"

# Prüfe Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js nicht gefunden im PATH"
  echo "Versuche alternative Pfade..."
  
  # Alternative Pfade
  for path in "/c/Program Files/nodejs" "/usr/bin" "/usr/local/bin"; do
    if [ -f "$path/node.exe" ] || [ -f "$path/node" ]; then
      export PATH="$path:$PATH"
      break
    fi
  done
fi

# Prüfe nochmal
if ! command -v node &> /dev/null; then
  echo "❌ Node.js konnte nicht gefunden werden"
  echo "Bitte stelle sicher, dass Node.js installiert ist"
  exit 1
fi

echo "✅ Node.js gefunden: $(which node)"
echo "✅ Node.js Version: $(node --version)"
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

# Setze RAILWAY_PROJECT_ID aus Secrets (falls gesetzt)
if [ -n "${RAILWAY_PROJECT_ID:-}" ]; then
  export RAILWAY_PROJECT_ID
  echo "📋 Verwende RAILWAY_PROJECT_ID: $RAILWAY_PROJECT_ID"
  echo ""
fi

# Führe Setup aus
bash scripts/setup-railway-complete.sh "$@"






