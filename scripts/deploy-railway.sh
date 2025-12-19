#!/bin/bash
set -euo pipefail

# Master Deployment Script für Railway
# Orchestriert alle Deployment-Schritte automatisch

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/services-config.json"

ENVIRONMENT=${1:-production}
SERVICE_FILTER=${2:-""}  # Optional: Nur bestimmten Service deployen
SKIP_VALIDATION=${3:-false}
SKIP_HEALTH_CHECK=${4:-false}

echo "🚀 Railway Deployment Automation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo "Service Filter: ${SERVICE_FILTER:-all services}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Funktion zum Loggen
log_info() {
  echo "ℹ️  $1"
}

log_success() {
  echo "✅ $1"
}

log_error() {
  echo "❌ $1"
}

log_warning() {
  echo "⚠️  $1"
}

# Prüfe Voraussetzungen
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI is not installed. Install with: npm i -g @railway/cli"
  exit 1
fi

# Prüfe jq oder Node.js
HAS_JQ=false
HAS_NODE=false

if command -v jq &> /dev/null; then
  HAS_JQ=true
fi

if command -v node &> /dev/null; then
  HAS_NODE=true
fi

if [ "$HAS_JQ" = false ] && [ "$HAS_NODE" = false ]; then
  log_error "jq oder Node.js ist erforderlich, aber nicht installiert"
  exit 1
fi

if [ "$HAS_JQ" = false ]; then
  log_warning "jq nicht gefunden - verwende Node.js als Fallback"
fi

if [ ! -f "$CONFIG_FILE" ]; then
  log_error "services-config.json not found at $CONFIG_FILE"
  exit 1
fi

# Schritt 1: Pre-Deployment Validierung
if [ "$SKIP_VALIDATION" != "true" ]; then
  echo "📋 Step 1: Pre-Deployment Validation"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if bash "$SCRIPT_DIR/validate-pre-deployment.sh" "$ENVIRONMENT"; then
    log_success "Pre-deployment validation passed"
  else
    log_error "Pre-deployment validation failed"
    echo ""
    echo "💡 Fix the errors above before deploying."
    exit 1
  fi
  echo ""
else
  log_warning "Skipping pre-deployment validation"
  echo ""
fi

# Schritt 2: Railway.json Dateien generieren
echo "🔧 Step 2: Generating Railway Configurations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if bash "$SCRIPT_DIR/generate-railway-configs.sh"; then
  log_success "Railway configurations generated"
else
  log_error "Failed to generate Railway configurations"
  exit 1
fi
echo ""

# Schritt 3: Services nach Dependencies sortieren
echo "📊 Step 3: Analyzing Service Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Funktion zum Topologischen Sortieren (vereinfacht)
get_deployment_order() {
  local deployment_order=()
  
  if [ "$HAS_JQ" = true ]; then
    # Verwende jq
    local services_json=$(jq -c '.services' "$CONFIG_FILE")
    local sorted_services=$(echo "$services_json" | jq -r 'to_entries | sort_by(.value.deploymentPriority) | .[].key')
    
    for service_name in $sorted_services; do
      if [ -z "$SERVICE_FILTER" ] || [ "$service_name" = "$SERVICE_FILTER" ]; then
        deployment_order+=("$service_name")
      fi
    done
  elif [ "$HAS_NODE" = true ]; then
    # Verwende Node.js als Fallback
    local sorted_services=$(node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
      const services = Object.entries(config.services)
        .sort((a, b) => (a[1].deploymentPriority || 99) - (b[1].deploymentPriority || 99))
        .map(([name]) => name);
      console.log(services.join('\n'));
    " 2>/dev/null)
    
    for service_name in $sorted_services; do
      if [ -z "$SERVICE_FILTER" ] || [ "$service_name" = "$SERVICE_FILTER" ]; then
        deployment_order+=("$service_name")
      fi
    done
  fi
  
  # Gebe Deployment-Order aus
  printf '%s\n' "${deployment_order[@]}"
}

DEPLOYMENT_ORDER=$(get_deployment_order)
DEPLOYMENT_COUNT=$(echo "$DEPLOYMENT_ORDER" | wc -l | tr -d ' ')

log_info "Deployment order determined: $DEPLOYMENT_COUNT services"
echo ""
echo "📋 Deployment Plan:"
DEPLOYMENT_INDEX=1
for service_name in $DEPLOYMENT_ORDER; do
  if [ "$HAS_JQ" = true ]; then
    service_config=$(jq -r ".services[\"$service_name\"]" "$CONFIG_FILE")
    priority=$(echo "$service_config" | jq -r '.deploymentPriority // 5')
    dependencies=$(echo "$service_config" | jq -r '.dependencies[]? // empty' | tr '\n' ',' | sed 's/,$//')
  elif [ "$HAS_NODE" = true ]; then
    service_info=$(node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
      const service = config.services['$service_name'];
      if (service) {
        console.log(JSON.stringify({
          priority: service.deploymentPriority || 5,
          dependencies: service.dependencies || []
        }));
      }
    " 2>/dev/null)
    priority=$(echo "$service_info" | node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf8')); console.log(d.priority);" 2>/dev/null)
    dependencies=$(echo "$service_info" | node -e "const d = JSON.parse(require('fs').readFileSync(0, 'utf8')); console.log((d.dependencies || []).join(','));" 2>/dev/null)
  fi
  
  echo "  $DEPLOYMENT_INDEX. $service_name (Priority: $priority)"
  if [ -n "$dependencies" ]; then
    echo "     Dependencies: $dependencies"
  fi
  ((DEPLOYMENT_INDEX++))
done
echo ""

# Schritt 4: Services deployen
echo "🚀 Step 4: Deploying Services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DEPLOYED_COUNT=0
FAILED_COUNT=0
FAILED_SERVICES=()

for service_name in $DEPLOYMENT_ORDER; do
  echo ""
  echo "📦 Deploying: $service_name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  service_config=$(jq -r ".services[\"$service_name\"]" "$CONFIG_FILE")
  service_path=$(echo "$service_config" | jq -r '.path // ""')
  
  if [ -z "$service_path" ]; then
    log_error "Service path not found, skipping..."
    ((FAILED_COUNT++))
    FAILED_SERVICES+=("$service_name")
    continue
  fi
  
  # Wechsle zum Service-Verzeichnis
  cd "$PROJECT_ROOT"
  
  # Linke Service in Railway
  log_info "Linking service to Railway..."
  if railway link --service "$service_name" &>/dev/null || railway service "$service_name" &>/dev/null; then
    log_success "Service linked"
  else
    log_warning "Service may not exist yet, will be created on deploy"
  fi
  
  # Deploye Service
  log_info "Deploying service..."
  if railway up --service "$service_name" --detach; then
    log_success "Deployment initiated for $service_name"
    ((DEPLOYED_COUNT++))
  else
    log_error "Deployment failed for $service_name"
    ((FAILED_COUNT++))
    FAILED_SERVICES+=("$service_name")
    continue
  fi
  
  # Warte kurz zwischen Deployments
  if [ $DEPLOYED_COUNT -lt $DEPLOYMENT_COUNT ]; then
    log_info "Waiting 5s before next deployment..."
    sleep 5
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary:"
echo "  ✅ Deployed: $DEPLOYED_COUNT services"
echo "  ❌ Failed: $FAILED_COUNT services"

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
  echo ""
  echo "  Failed Services:"
  for failed_service in "${FAILED_SERVICES[@]}"; do
    echo "    - $failed_service"
  done
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Schritt 5: Service URLs synchronisieren
echo "🔗 Step 5: Synchronizing Service URLs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Waiting 30s for services to start..."
sleep 30

if bash "$SCRIPT_DIR/sync-service-urls.sh" "$ENVIRONMENT"; then
  log_success "Service URLs synchronized"
else
  log_warning "Service URL synchronization had issues (may be normal if services are still starting)"
fi
echo ""

# Schritt 6: Post-Deployment Health Checks
if [ "$SKIP_HEALTH_CHECK" != "true" ]; then
  echo "🏥 Step 6: Post-Deployment Health Checks"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  log_info "Waiting 60s for services to be fully ready..."
  sleep 60
  
  if bash "$SCRIPT_DIR/post-deployment-health-check.sh" "$ENVIRONMENT"; then
    log_success "All health checks passed"
  else
    log_warning "Some health checks failed (services may still be starting)"
    echo ""
    echo "💡 Re-run health check manually:"
    echo "   ./scripts/post-deployment-health-check.sh $ENVIRONMENT"
  fi
  echo ""
else
  log_warning "Skipping post-deployment health checks"
  echo ""
fi

# Finale Zusammenfassung
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment Process Completed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Final Summary:"
echo "  ✅ Successfully deployed: $DEPLOYED_COUNT services"
echo "  ❌ Failed: $FAILED_COUNT services"
echo ""

if [ $FAILED_COUNT -gt 0 ]; then
  echo "⚠️  Some deployments failed. Check Railway logs:"
  for failed_service in "${FAILED_SERVICES[@]}"; do
    echo "   railway logs --service $failed_service"
  done
  echo ""
  exit 1
else
  echo "✅ All services deployed successfully!"
  echo ""
  echo "💡 Next steps:"
  echo "   1. Monitor services: railway logs --service <service-name>"
  echo "   2. Check health: ./scripts/post-deployment-health-check.sh $ENVIRONMENT"
  echo "   3. View service status: railway service <service-name>"
  echo ""
  exit 0
fi




