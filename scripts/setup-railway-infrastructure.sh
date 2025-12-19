#!/bin/bash
set -euo pipefail

# Railway Infrastructure Setup Script
# Erstellt PostgreSQL und Redis Services automatisch

PROJECT_ID="${RAILWAY_PROJECT_ID:-a97f01bc-dc80-4941-b911-ed7ebb3efa7a}"
ENVIRONMENT="${1:-production}"

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
echo "🏗️  Railway Infrastructure Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prüfe Railway CLI
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI ist nicht installiert"
  echo "Installiere mit: npm install -g @railway/cli"
  exit 1
fi

log_success "Railway CLI gefunden"

# Prüfe Authentifizierung
if ! railway whoami &> /dev/null 2>&1; then
  log_warning "Nicht bei Railway eingeloggt"
  if [ -n "${RAILWAY_TOKEN:-}" ]; then
    echo "$RAILWAY_TOKEN" | railway login --token-stdin || railway login
  else
    railway login
  fi
fi

log_success "Bei Railway authentifiziert"

# Link zu Projekt
log_info "Verlinke mit Projekt: $PROJECT_ID"
if railway link "$PROJECT_ID" 2>/dev/null || railway link; then
  log_success "Mit Projekt verlinkt"
else
  log_error "Konnte nicht mit Projekt verlinken"
  exit 1
fi

# Prüfe ob PostgreSQL existiert
log_info "Prüfe PostgreSQL Service..."
POSTGRES_EXISTS=false
if railway service postgresql &> /dev/null 2>&1; then
  POSTGRES_EXISTS=true
  log_success "PostgreSQL Service existiert bereits"
else
  log_info "PostgreSQL Service nicht gefunden - erstelle..."
  if railway add postgresql; then
    POSTGRES_EXISTS=true
    log_success "PostgreSQL Service erstellt"
  else
    log_error "Konnte PostgreSQL Service nicht erstellen"
    exit 1
  fi
fi

# Extrahiere DATABASE_URL
if [ "$POSTGRES_EXISTS" = true ]; then
  log_info "Extrahiere DATABASE_URL..."
  DATABASE_URL=$(railway variables --service postgresql 2>/dev/null | grep -i "DATABASE_URL\|POSTGRES_URL" | head -1 | awk '{print $2}' || echo "")
  
  if [ -z "$DATABASE_URL" ]; then
    # Versuche über Railway Variables direkt
    DATABASE_URL=$(railway variables get DATABASE_URL --service postgresql 2>/dev/null || echo "")
  fi
  
  if [ -n "$DATABASE_URL" ] && [ "$DATABASE_URL" != "null" ]; then
    log_success "DATABASE_URL gefunden"
    # Setze als Shared Variable
    if railway variables set "DATABASE_URL=$DATABASE_URL" --shared 2>/dev/null; then
      log_success "DATABASE_URL als Shared Variable gesetzt"
    else
      log_warning "Konnte DATABASE_URL nicht als Shared Variable setzen (möglicherweise bereits gesetzt)"
    fi
  else
    log_warning "DATABASE_URL konnte nicht extrahiert werden - wird automatisch von Railway gesetzt"
  fi
fi

# Prüfe ob Redis existiert
log_info "Prüfe Redis Service..."
REDIS_EXISTS=false
if railway service redis &> /dev/null 2>&1; then
  REDIS_EXISTS=true
  log_success "Redis Service existiert bereits"
else
  log_info "Redis Service nicht gefunden - erstelle..."
  if railway add redis; then
    REDIS_EXISTS=true
    log_success "Redis Service erstellt"
  else
    log_error "Konnte Redis Service nicht erstellen"
    exit 1
  fi
fi

# Extrahiere REDIS_URL
if [ "$REDIS_EXISTS" = true ]; then
  log_info "Extrahiere REDIS_URL..."
  REDIS_URL=$(railway variables --service redis 2>/dev/null | grep -i "REDIS_URL" | head -1 | awk '{print $2}' || echo "")
  
  if [ -z "$REDIS_URL" ]; then
    # Versuche über Railway Variables direkt
    REDIS_URL=$(railway variables get REDIS_URL --service redis 2>/dev/null || echo "")
  fi
  
  if [ -n "$REDIS_URL" ] && [ "$REDIS_URL" != "null" ]; then
    log_success "REDIS_URL gefunden"
    # Setze als Shared Variable
    if railway variables set "REDIS_URL=$REDIS_URL" --shared 2>/dev/null; then
      log_success "REDIS_URL als Shared Variable gesetzt"
    else
      log_warning "Konnte REDIS_URL nicht als Shared Variable setzen (möglicherweise bereits gesetzt)"
    fi
  else
    log_warning "REDIS_URL konnte nicht extrahiert werden - wird automatisch von Railway gesetzt"
  fi
fi

# Setze Shared Variables
log_info "Setze Shared Variables..."
railway variables set "NODE_ENV=production" --shared 2>/dev/null || log_warning "NODE_ENV bereits gesetzt"
railway variables set "DEPLOYMENT_PLATFORM=railway" --shared 2>/dev/null || log_warning "DEPLOYMENT_PLATFORM bereits gesetzt"

log_success "Shared Variables gesetzt"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Zusammenfassung"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ PostgreSQL: $([ "$POSTGRES_EXISTS" = true ] && echo "Vorhanden" || echo "Nicht gefunden")"
echo "✅ Redis: $([ "$REDIS_EXISTS" = true ] && echo "Vorhanden" || echo "Nicht gefunden")"
echo ""
log_success "Infrastructure Setup abgeschlossen!"
echo ""






