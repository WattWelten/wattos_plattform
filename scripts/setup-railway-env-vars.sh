#!/bin/bash
set -euo pipefail

# Railway Environment Variables Setup Script
# Setzt alle Environment Variables automatisch basierend auf services-config.json

PROJECT_ID="${RAILWAY_PROJECT_ID:-a97f01bc-dc80-4941-b911-ed7ebb3efa7a}"
ENVIRONMENT="${1:-production}"
CONFIG_FILE="${2:-scripts/services-config.json}"
SECRETS_FILE="${3:-.railway-secrets.env}"

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
echo "🔐 Railway Environment Variables Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prüfe Railway CLI
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI ist nicht installiert"
  echo "Installiere mit: npm install -g @railway/cli"
  exit 1
fi

# Prüfe Node.js (für JSON-Parsing)
if ! command -v node &> /dev/null; then
  log_error "Node.js ist nicht installiert (benötigt für JSON-Parsing)"
  exit 1
fi

# Prüfe Config-Datei
if [ ! -f "$CONFIG_FILE" ]; then
  log_error "Config-Datei nicht gefunden: $CONFIG_FILE"
  exit 1
fi

log_success "Config-Datei gefunden: $CONFIG_FILE"

# Lade Secrets (falls vorhanden)
if [ -f "$SECRETS_FILE" ]; then
  log_info "Lade Secrets aus: $SECRETS_FILE"
  set -a
  source "$SECRETS_FILE"
  set +a
  log_success "Secrets geladen"
else
  log_warning "Secrets-Datei nicht gefunden: $SECRETS_FILE"
  log_info "Erstelle Template mit: cp scripts/railway-secrets-template.env $SECRETS_FILE"
fi

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

# Setze Shared Variables
log_info "Setze Shared Variables..."

# NODE_ENV
if railway variables set "NODE_ENV=production" --shared 2>/dev/null; then
  log_success "NODE_ENV=production (shared)"
else
  log_warning "NODE_ENV bereits gesetzt"
fi

# DEPLOYMENT_PLATFORM
if railway variables set "DEPLOYMENT_PLATFORM=railway" --shared 2>/dev/null; then
  log_success "DEPLOYMENT_PLATFORM=railway (shared)"
else
  log_warning "DEPLOYMENT_PLATFORM bereits gesetzt"
fi

# DATABASE_URL und REDIS_URL werden automatisch von Railway gesetzt
log_info "DATABASE_URL und REDIS_URL werden automatisch von Railway gesetzt (von Infrastructure Services)"

# Lese Services aus Config
log_info "Lese Services aus Config..."

SERVICES_JSON=$(node -e "
  const fs = require('fs');
  const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
  console.log(JSON.stringify(config.services));
" 2>/dev/null)

if [ -z "$SERVICES_JSON" ]; then
  log_error "Konnte Services aus Config nicht lesen"
  exit 1
fi

# Funktion: Setze Variable für Service
set_service_var() {
  local service_name=$1
  local var_name=$2
  local var_value=$3
  local is_shared=${4:-false}
  
  if [ "$is_shared" = true ]; then
    if railway variables set "$var_name=$var_value" --shared 2>/dev/null; then
      log_success "$var_name (shared)"
      return 0
    else
      log_warning "$var_name bereits gesetzt (shared)"
      return 1
    fi
  else
    if railway service "$service_name" &> /dev/null 2>&1; then
      if railway variables set "$var_name=$var_value" --service "$service_name" 2>/dev/null; then
        log_success "$service_name: $var_name"
        return 0
      else
        log_warning "$service_name: $var_name bereits gesetzt"
        return 1
      fi
    else
      log_warning "$service_name: Service nicht gefunden - überspringe"
      return 1
    fi
  fi
}

# Funktion: Frage nach Secret (interaktiv)
ask_secret() {
  local var_name=$1
  local description=$2
  local current_value="${!var_name:-}"
  
  if [ -n "$current_value" ]; then
    echo "$current_value"
    return 0
  fi
  
  echo ""
  log_warning "$var_name ist nicht gesetzt"
  read -p "Bitte $description eingeben (oder Enter zum Überspringen): " secret_value
  if [ -n "$secret_value" ]; then
    echo "$secret_value"
    return 0
  else
    return 1
  fi
}

# Verarbeite jeden Service
log_info "Setze Service-spezifische Variables..."
echo ""

SERVICE_COUNT=0
VAR_COUNT=0

for service_name in $(echo "$SERVICES_JSON" | node -e "
  const services = JSON.parse(require('fs').readFileSync(0, 'utf8'));
  Object.keys(services).forEach(name => console.log(name));
"); do
  SERVICE_COUNT=$((SERVICE_COUNT + 1))
  
  # Lese Environment Variables für diesen Service
  ENV_VARS=$(echo "$SERVICES_JSON" | node -e "
    const services = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const service = services['$service_name'];
    if (service && service.environmentVariables) {
      console.log(JSON.stringify(service.environmentVariables));
    } else {
      console.log('[]');
    }
  " 2>/dev/null)
  
  if [ "$ENV_VARS" = "[]" ] || [ -z "$ENV_VARS" ]; then
    continue
  fi
  
  log_info "Verarbeite $service_name..."
  
  # Verarbeite jede Environment Variable
  echo "$ENV_VARS" | node -e "
    const envVars = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    envVars.forEach(envVar => {
      const name = envVar.name;
      const required = envVar.required || false;
      const defaultValue = envVar.default || '';
      const description = envVar.description || '';
      
      console.log(JSON.stringify({
        name: name,
        required: required,
        default: defaultValue,
        description: description
      }));
    });
  " 2>/dev/null | while IFS= read -r env_var_json; do
    VAR_NAME=$(echo "$env_var_json" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).name)" 2>/dev/null)
    REQUIRED=$(echo "$env_var_json" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).required)" 2>/dev/null)
    DEFAULT_VALUE=$(echo "$env_var_json" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).default || '')" 2>/dev/null)
    DESCRIPTION=$(echo "$env_var_json" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).description || '')" 2>/dev/null)
    
    # Prüfe ob Variable bereits gesetzt ist (aus Environment oder Secrets)
    VAR_VALUE="${!VAR_NAME:-}"
    
    # Verwende Default-Wert falls vorhanden
    if [ -z "$VAR_VALUE" ] && [ -n "$DEFAULT_VALUE" ]; then
      VAR_VALUE="$DEFAULT_VALUE"
    fi
    
    # Frage nach Secret falls erforderlich und nicht gesetzt
    if [ -z "$VAR_VALUE" ] && [ "$REQUIRED" = "true" ]; then
      VAR_VALUE=$(ask_secret "$VAR_NAME" "$DESCRIPTION" || echo "")
    fi
    
    # Setze Variable
    if [ -n "$VAR_VALUE" ]; then
      # Service Discovery URLs werden später synchronisiert - überspringe
      if [[ "$VAR_NAME" == *"_URL" ]] && [[ "$VAR_NAME" != "DATABASE_URL" ]] && [[ "$VAR_NAME" != "REDIS_URL" ]]; then
        log_info "$service_name: $VAR_NAME wird später synchronisiert"
        continue
      fi
      
      if set_service_var "$service_name" "$VAR_NAME" "$VAR_VALUE" false; then
        VAR_COUNT=$((VAR_COUNT + 1))
      fi
    else
      if [ "$REQUIRED" = "true" ]; then
        log_warning "$service_name: $VAR_NAME ist erforderlich, aber nicht gesetzt"
      fi
    fi
  done
  
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Zusammenfassung"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Verarbeitete Services: $SERVICE_COUNT"
echo "✅ Gesetzte Variables: $VAR_COUNT"
echo ""
log_success "Environment Variables Setup abgeschlossen!"
echo ""
log_info "💡 Tipp: Führe ./scripts/sync-service-urls.sh aus, um Service URLs zu synchronisieren"
echo ""






