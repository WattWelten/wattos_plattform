#!/bin/bash
set -euo pipefail

# Railway Services Setup Script
# Prüft und verlinkt alle Services (Services sind bereits erstellt)

PROJECT_ID="${RAILWAY_PROJECT_ID:-a97f01bc-dc80-4941-b911-ed7ebb3efa7a}"
ENVIRONMENT="${1:-production}"
CONFIG_FILE="${2:-scripts/services-config.json}"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper Functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠️${NC} $1"
}

log_error() {
  echo -e "${RED}❌${NC} $1"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Railway Services Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prüfe Railway CLI
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI ist nicht installiert"
  echo "Installiere mit: npm install -g @railway/cli"
  exit 1
fi

# Prüfe jq (optional, für JSON-Parsing)
HAS_JQ=false
if command -v jq &> /dev/null; then
  HAS_JQ=true
fi

# Prüfe Node.js (für Fallback)
HAS_NODE=false
if command -v node &> /dev/null; then
  HAS_NODE=true
fi

if [ "$HAS_JQ" = false ] && [ "$HAS_NODE" = false ]; then
  log_warning "jq oder Node.js nicht gefunden - verwende Text-Parsing"
fi

# Prüfe Config-Datei
if [ ! -f "$CONFIG_FILE" ]; then
  log_error "Config-Datei nicht gefunden: $CONFIG_FILE"
  exit 1
fi

log_success "Config-Datei gefunden: $CONFIG_FILE"

# Prüfe Authentifizierung
if ! railway whoami &> /dev/null 2>&1; then
  log_warning "Nicht bei Railway eingeloggt"
  if [ -n "${RAILWAY_TOKEN:-}" ]; then
    echo "$RAILWAY_TOKEN" | railway login --token-stdin || railway login
  else
    railway login
  fi
fi

# Link zu Projekt
log_info "Verlinke mit Projekt: $PROJECT_ID"
railway link "$PROJECT_ID" 2>/dev/null || railway link || true

# Lese Services aus Config
log_info "Lese Services aus Config..."

if [ "$HAS_JQ" = true ]; then
  # Verwende jq für JSON-Parsing
  SERVICE_NAMES=$(jq -r '.services | keys[]' "$CONFIG_FILE" 2>/dev/null || echo "")
elif [ "$HAS_NODE" = true ]; then
  # Verwende Node.js für JSON-Parsing
  SERVICE_NAMES=$(node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
    console.log(Object.keys(config.services).join('\n'));
  " 2>/dev/null || echo "")
else
  # Fallback: Text-Parsing
  SERVICE_NAMES=$(grep -o '"[^"]*":\s*{' "$CONFIG_FILE" | sed 's/":.*//' | sed 's/"//g' || echo "")
fi

if [ -z "$SERVICE_NAMES" ]; then
  log_error "Konnte Services aus Config nicht lesen"
  exit 1
fi

# Sortiere Services nach Priority
log_info "Sortiere Services nach Priority..."

if [ "$HAS_JQ" = true ]; then
  SORTED_SERVICES=$(jq -r '.services | to_entries | sort_by(.value.deploymentPriority) | .[].key' "$CONFIG_FILE" 2>/dev/null || echo "$SERVICE_NAMES")
elif [ "$HAS_NODE" = true ]; then
  SORTED_SERVICES=$(node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
    const sorted = Object.entries(config.services)
      .sort((a, b) => (a[1].deploymentPriority || 99) - (b[1].deploymentPriority || 99))
      .map(([name]) => name);
    console.log(sorted.join('\n'));
  " 2>/dev/null || echo "$SERVICE_NAMES")
else
  SORTED_SERVICES="$SERVICE_NAMES"
fi

# Prüfe und verlinke Services
EXISTING_COUNT=0
MISSING_COUNT=0
LINKED_COUNT=0

echo ""
log_info "Prüfe Services in Railway..."
echo ""

for service_name in $SORTED_SERVICES; do
  # Prüfe ob Service existiert
  if railway service "$service_name" &> /dev/null 2>&1; then
    log_success "$service_name: Existiert"
    ((EXISTING_COUNT++))
    
    # Versuche Service zu verlinken (idempotent)
    if railway service "$service_name" &> /dev/null 2>&1; then
      ((LINKED_COUNT++))
    fi
  else
    log_warning "$service_name: Nicht gefunden (muss manuell erstellt werden)"
    ((MISSING_COUNT++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Zusammenfassung"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Vorhandene Services: $EXISTING_COUNT"
echo "⚠️  Fehlende Services: $MISSING_COUNT"
echo "🔗 Verlinkte Services: $LINKED_COUNT"
echo ""

if [ $MISSING_COUNT -gt 0 ]; then
  log_warning "Einige Services fehlen - diese müssen manuell in Railway erstellt werden"
  echo ""
  echo "Fehlende Services können im Railway Dashboard erstellt werden:"
  echo "https://railway.app/project/$PROJECT_ID"
fi

log_success "Services Setup abgeschlossen!"
echo ""






