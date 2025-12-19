#!/bin/bash
set -euo pipefail

# Sammelt Railway Service-Logs

OUTPUT_DIR=${1:-logs/railway}
SERVICE=${2:-}  # Optional: spezifischer Service

mkdir -p "$OUTPUT_DIR"

log_info() { echo "ℹ $1"; }
log_success() { echo "✅ $1"; }
log_error() { echo "❌ $1"; }

# Prüfe Railway CLI
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI ist nicht installiert"
  log_info "Installiere: npm install -g @railway/cli"
  exit 1
fi

# Prüfe Authentifizierung
if ! railway whoami &> /dev/null 2>&1; then
  log_error "Nicht bei Railway eingeloggt"
  log_info "Führe aus: railway login"
  exit 1
fi

log_info "Sammle Railway Logs..."

# Services aus services-config.json
SERVICES=(
  "api-gateway"
  "chat-service"
  "rag-service"
  "agent-service"
  "llm-gateway"
  "tool-service"
  "customer-intelligence-service"
  "crawler-service"
  "voice-service"
  "avatar-service"
  "character-service"
  "admin-service"
  "summary-service"
  "feedback-service"
  "metaverse-service"
  "ingestion-service"
)

services_to_check=("${SERVICES[@]}")
if [ -n "$SERVICE" ]; then
  services_to_check=("$SERVICE")
fi

for service in "${services_to_check[@]}"; do
  log_info "Sammle Logs für $service..."
  
  # Build-Logs (letztes Deployment)
  railway logs --service "$service" --deployment latest --tail 500 > "$OUTPUT_DIR/${service}-build.log" 2>&1 || true
  
  # Runtime-Logs (letzte 200 Zeilen)
  railway logs --service "$service" --tail 200 > "$OUTPUT_DIR/${service}-runtime.log" 2>&1 || true
  
  # Service-Status
  railway service "$service" > "$OUTPUT_DIR/${service}-status.txt" 2>&1 || true
  
  # Service-Variables (für Debugging)
  railway variables --service "$service" > "$OUTPUT_DIR/${service}-variables.txt" 2>&1 || true
done

log_success "Railway Logs gesammelt: $OUTPUT_DIR"






