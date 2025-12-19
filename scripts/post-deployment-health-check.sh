#!/bin/bash
set -euo pipefail

# Post-Deployment Health Check Script
# Prüft alle Services nach dem Deployment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/services-config.json"
ENVIRONMENT=${1:-production}
MAX_RETRIES=${2:-5}
RETRY_DELAY=${3:-10}

echo "🏥 Post-Deployment Health Check for: $ENVIRONMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0
HEALTHY_SERVICES=0
UNHEALTHY_SERVICES=0

# Funktion zum Loggen
log_error() {
  echo "  ❌ $1"
  ((ERRORS++))
}

log_warning() {
  echo "  ⚠️  $1"
  ((WARNINGS++))
}

log_success() {
  echo "  ✅ $1"
}

# Funktion zum Prüfen eines Health Endpoints
check_health_endpoint() {
  local service_name=$1
  local health_path=$2
  local service_url=$3
  local retries=$MAX_RETRIES
  local delay=$RETRY_DELAY
  
  local health_url="${service_url}${health_path}"
  
  for ((i=1; i<=retries; i++)); do
    # Prüfe Health Endpoint
    if curl -f -s -m 10 "$health_url" > /dev/null 2>&1; then
      return 0
    fi
    
    if [ $i -lt $retries ]; then
      echo "    ⏳ Retry $i/$retries in ${delay}s..."
      sleep $delay
    fi
  done
  
  return 1
}

# Funktion zum Abrufen der Service-URL von Railway
get_service_url() {
  local service_name=$1
  
  # Versuche verschiedene Methoden, die Service-URL zu bekommen
  local url=""
  
  # Methode 1: Railway Variables
  if command -v railway &> /dev/null; then
    url=$(timeout 10 railway variables --service "$service_name" 2>/dev/null | grep -i "RAILWAY_PUBLIC_DOMAIN\|PUBLIC_DOMAIN\|URL" | head -1 | awk '{print $2}' || echo "")
    
    if [ -n "$url" ] && [ "$url" != "null" ]; then
      # Füge https:// hinzu falls nicht vorhanden
      if [[ ! "$url" =~ ^https?:// ]]; then
        url="https://$url"
      fi
      echo "$url"
      return 0
    fi
    
    # Methode 2: Railway Service Info
    url=$(timeout 10 railway service "$service_name" --json 2>/dev/null | jq -r '.url // .domain // empty' || echo "")
    
    if [ -n "$url" ] && [ "$url" != "null" ]; then
      if [[ ! "$url" =~ ^https?:// ]]; then
        url="https://$url"
      fi
      echo "$url"
      return 0
    fi
  fi
  
  return 1
}

# Prüfe Railway CLI
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI is not installed"
  exit 1
fi

if ! railway whoami &>/dev/null; then
  log_error "Railway CLI not authenticated. Run: railway login"
  exit 1
fi

# Prüfe jq
if ! command -v jq &> /dev/null; then
  log_error "jq is required but not installed"
  exit 1
fi

# Prüfe curl
if ! command -v curl &> /dev/null; then
  log_error "curl is required but not installed"
  exit 1
fi

# Lese alle Services aus der Config
if [ ! -f "$CONFIG_FILE" ]; then
  log_error "services-config.json not found"
  exit 1
fi

SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE" 2>/dev/null || echo "")

if [ -z "$SERVICES" ]; then
  log_error "No services found in config"
  exit 1
fi

echo "📋 Checking health of $(echo "$SERVICES" | wc -l | tr -d ' ') services..."
echo ""

# Prüfe jeden Service
for service_name in $SERVICES; do
  echo "🔍 Checking: $service_name"
  
  # Extrahiere Service-Konfiguration
  service_config=$(jq -r ".services[\"$service_name\"]" "$CONFIG_FILE")
  
  if [ "$service_config" = "null" ]; then
    log_warning "Service config not found, skipping..."
    echo ""
    continue
  fi
  
  # Extrahiere Health Check Path
  health_path=$(echo "$service_config" | jq -r '.healthCheckPath // "/health"')
  service_type=$(echo "$service_config" | jq -r '.type // "nestjs"')
  
  # Workers haben möglicherweise keine öffentliche URL
  if [ "$service_type" = "worker" ]; then
    log_success "$service_name: Worker service (no health check required)"
    ((HEALTHY_SERVICES++))
    echo ""
    continue
  fi
  
  # Versuche Service-URL zu bekommen
  service_url=$(get_service_url "$service_name")
  
  if [ -z "$service_url" ]; then
    log_warning "$service_name: Could not determine service URL (may not be deployed yet)"
    ((UNHEALTHY_SERVICES++))
    echo ""
    continue
  fi
  
  echo "    URL: $service_url"
  echo "    Health Path: $health_path"
  
  # Prüfe Health Endpoint
  if check_health_endpoint "$service_name" "$health_path" "$service_url"; then
    log_success "$service_name: Health check passed"
    ((HEALTHY_SERVICES++))
  else
    log_error "$service_name: Health check failed (endpoint: ${service_url}${health_path})"
    ((UNHEALTHY_SERVICES++))
  fi
  
  echo ""
done

# Prüfe Service Discovery URLs
echo "🔗 Checking Service Discovery URLs..."
echo ""

if [ -f "$SCRIPT_DIR/sync-service-urls.sh" ]; then
  # Führe Service-URL-Synchronisation durch
  if bash "$SCRIPT_DIR/sync-service-urls.sh" "$ENVIRONMENT" &>/dev/null; then
    log_success "Service URLs synchronized"
  else
    log_warning "Service URL synchronization had issues (may be normal if services are still deploying)"
  fi
else
  log_warning "sync-service-urls.sh not found, skipping URL synchronization"
fi

echo ""

# Zusammenfassung
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Health Check Summary:"
echo "  ✅ Healthy: $HEALTHY_SERVICES services"
echo "  ❌ Unhealthy: $UNHEALTHY_SERVICES services"
echo "  ⚠️  Warnings: $WARNINGS"
echo "  ❌ Errors: $ERRORS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -gt 0 ] || [ $UNHEALTHY_SERVICES -gt 0 ]; then
  echo "❌ Health check failed!"
  echo ""
  echo "💡 Troubleshooting:"
  echo "   1. Check Railway logs: railway logs --service <service-name>"
  echo "   2. Verify service URLs: railway variables --service <service-name>"
  echo "   3. Check service status: railway service <service-name>"
  echo "   4. Re-run health check: ./scripts/post-deployment-health-check.sh $ENVIRONMENT"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo "⚠️  Health check completed with warnings"
  echo ""
  echo "💡 Some services may still be deploying. Re-run in a few minutes."
  exit 0
else
  echo "✅ All services are healthy!"
  echo ""
  echo "💡 Deployment successful!"
  exit 0
fi









