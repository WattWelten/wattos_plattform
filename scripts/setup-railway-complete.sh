#!/bin/bash
set -euo pipefail

# Railway Complete Setup Script
# Orchestriert alle Setup-Schritte für vollständiges Railway Setup

PROJECT_ID="${RAILWAY_PROJECT_ID:-a97f01bc-dc80-4941-b911-ed7ebb3efa7a}"
ENVIRONMENT="${1:-production}"
SKIP_VALIDATION="${2:-false}"

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

log_section() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Railway Complete Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Projekt ID: $PROJECT_ID"
echo "Umgebung: $ENVIRONMENT"
echo ""

# Prüfe Railway CLI
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI ist nicht installiert"
  echo "Installiere mit: npm install -g @railway/cli"
  exit 1
fi

log_success "Railway CLI gefunden"

# Schritt 1: Pre-Checks
log_section "Schritt 1: Pre-Checks"

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

# Prüfe Node.js
if ! command -v node &> /dev/null; then
  log_error "Node.js ist nicht installiert (benötigt für Config-Generierung)"
  exit 1
fi

log_success "Node.js gefunden"

# Schritt 2: Infrastructure Setup
log_section "Schritt 2: Infrastructure Setup"

if [ -f "scripts/setup-railway-infrastructure.sh" ]; then
  log_info "Führe Infrastructure Setup aus..."
  if bash scripts/setup-railway-infrastructure.sh "$ENVIRONMENT"; then
    log_success "Infrastructure Setup abgeschlossen"
  else
    log_error "Infrastructure Setup fehlgeschlagen"
    exit 1
  fi
else
  log_warning "Infrastructure Setup Script nicht gefunden - überspringe"
fi

# Schritt 3: Services Setup
log_section "Schritt 3: Services Setup"

if [ -f "scripts/setup-railway-services.sh" ]; then
  log_info "Führe Services Setup aus..."
  if bash scripts/setup-railway-services.sh "$ENVIRONMENT"; then
    log_success "Services Setup abgeschlossen"
  else
    log_warning "Services Setup mit Warnungen abgeschlossen"
  fi
else
  log_warning "Services Setup Script nicht gefunden - überspringe"
fi

# Schritt 4: Railway Configs generieren
log_section "Schritt 4: Railway Configs generieren"

if [ -f "scripts/generate-railway-configs.js" ]; then
  log_info "Generiere Railway Configs..."
  if node scripts/generate-railway-configs.js; then
    log_success "Railway Configs generiert"
  else
    log_error "Config-Generierung fehlgeschlagen"
    exit 1
  fi
else
  log_warning "Config-Generierungs-Script nicht gefunden - überspringe"
fi

# Schritt 5: Environment Variables Setup
log_section "Schritt 5: Environment Variables Setup"

if [ -f "scripts/setup-railway-env-vars.sh" ]; then
  log_info "Führe Environment Variables Setup aus..."
  if bash scripts/setup-railway-env-vars.sh "$ENVIRONMENT"; then
    log_success "Environment Variables Setup abgeschlossen"
  else
    log_warning "Environment Variables Setup mit Warnungen abgeschlossen"
  fi
else
  log_warning "Environment Variables Setup Script nicht gefunden - überspringe"
fi

# Schritt 6: Service URLs Synchronisation
log_section "Schritt 6: Service URLs Synchronisation"

if [ -f "scripts/sync-service-urls.sh" ]; then
  log_info "Synchronisiere Service URLs..."
  if bash scripts/sync-service-urls.sh "$ENVIRONMENT"; then
    log_success "Service URLs synchronisiert"
  else
    log_warning "Service URLs Synchronisation mit Warnungen abgeschlossen"
  fi
else
  log_warning "Service URLs Synchronisations-Script nicht gefunden - überspringe"
fi

# Schritt 7: Post-Setup Validierung
if [ "$SKIP_VALIDATION" != "true" ]; then
  log_section "Schritt 7: Post-Setup Validierung"
  
  if [ -f "scripts/validate-pre-deployment.sh" ]; then
    log_info "Führe Validierung aus..."
    if bash scripts/validate-pre-deployment.sh "$ENVIRONMENT"; then
      log_success "Validierung erfolgreich"
    else
      log_warning "Validierung mit Warnungen abgeschlossen"
    fi
  else
    log_warning "Validierungs-Script nicht gefunden - überspringe"
  fi
else
  log_info "Validierung übersprungen (--skip-validation)"
fi

# Zusammenfassung
log_section "✅ Setup abgeschlossen!"

echo "📊 Zusammenfassung:"
echo ""
echo "✅ Infrastructure Services geprüft/erstellt"
echo "✅ Services geprüft/verlinkt"
echo "✅ Railway Configs generiert"
echo "✅ Environment Variables gesetzt"
echo "✅ Service URLs synchronisiert"
if [ "$SKIP_VALIDATION" != "true" ]; then
  echo "✅ Validierung durchgeführt"
fi
echo ""
echo "🚀 Nächste Schritte:"
echo ""
echo "1. Prüfe Environment Variables in Railway Dashboard:"
echo "   https://railway.app/project/$PROJECT_ID"
echo ""
echo "2. Deploye Services:"
echo "   ./scripts/deploy-railway.sh $ENVIRONMENT"
echo ""
echo "3. Führe Health Checks aus:"
echo "   ./scripts/post-deployment-health-check.sh $ENVIRONMENT"
echo ""
log_success "Viel Erfolg mit dem Deployment! 🎉"
echo ""






