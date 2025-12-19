#!/bin/bash
set -uo pipefail  # Entferne -e, damit Script nicht bei jedem Fehler stoppt

# Pre-Deployment Validierung Script
# Prüft alle Voraussetzungen vor dem Deployment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/services-config.json"
ENVIRONMENT=${1:-production}

echo "🔍 Pre-Deployment Validation for: $ENVIRONMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0
WARNINGS=0

# Funktion zum Loggen von Fehlern
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

# 1. Prüfe Railway CLI
echo "1️⃣  Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
  log_error "Railway CLI is not installed. Install with: npm i -g @railway/cli"
else
  RAILWAY_VERSION=$(railway --version 2>/dev/null || echo "unknown")
  log_success "Railway CLI installed ($RAILWAY_VERSION)"
fi
echo ""

# 2. Prüfe Railway Authentication
echo "2️⃣  Checking Railway Authentication..."
if [ -z "${RAILWAY_TOKEN:-}" ]; then
  log_warning "RAILWAY_TOKEN not set. Run: railway login"
else
  if railway whoami &>/dev/null; then
    log_success "Railway authenticated"
  else
    log_warning "Railway authentication failed (will be retried in deploy step)"
    # KEIN exit 1 hier - non-blocking
  fi
fi
echo ""

# 3. Prüfe jq
echo "3️⃣  Checking jq..."
if ! command -v jq &> /dev/null; then
  log_error "jq is required but not installed"
else
  log_success "jq installed"
fi
echo ""

# 4. Prüfe services-config.json
echo "4️⃣  Validating services-config.json..."
if [ ! -f "$CONFIG_FILE" ]; then
  log_error "services-config.json not found at $CONFIG_FILE"
else
  if jq empty "$CONFIG_FILE" 2>/dev/null; then
    log_success "services-config.json is valid JSON"
  else
    log_error "services-config.json is invalid JSON"
  fi
fi
echo ""

# 5. Prüfe ob Services in Railway existieren
echo "5️⃣  Checking Railway Services..."
if command -v railway &> /dev/null && railway whoami &>/dev/null; then
  if [ -f "$CONFIG_FILE" ] && command -v jq &> /dev/null; then
    SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE" 2>/dev/null || echo "")
    MISSING_SERVICES=0
    
    for service_name in $SERVICES; do
      # Prüfe ob Service existiert (non-interactive)
      if timeout 5 railway service "$service_name" --json &>/dev/null; then
        log_success "Service '$service_name' exists"
      else
        log_warning "Service '$service_name' not found in Railway (will be created on first deploy)"
        ((MISSING_SERVICES++))
      fi
    done
    
    if [ $MISSING_SERVICES -gt 0 ]; then
      log_warning "$MISSING_SERVICES services not yet created in Railway"
    fi
  fi
else
  log_warning "Cannot check Railway services (CLI not available or not authenticated)"
fi
echo ""

# 6. Prüfe railway.json Dateien
echo "6️⃣  Validating railway.json files..."
if [ -f "$CONFIG_FILE" ] && command -v jq &> /dev/null; then
  SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE" 2>/dev/null || echo "")
  MISSING_CONFIGS=0
  
  for service_name in $SERVICES; do
    service_path=$(jq -r ".services[\"$service_name\"].path // \"\"" "$CONFIG_FILE")
    
    if [ -n "$service_path" ]; then
      railway_json="$PROJECT_ROOT/$service_path/railway.json"
      
      if [ -f "$railway_json" ]; then
        if jq empty "$railway_json" 2>/dev/null; then
          log_success "railway.json exists for $service_name"
        else
          log_error "Invalid railway.json for $service_name"
        fi
      else
        log_warning "railway.json missing for $service_name (run: ./scripts/generate-railway-configs.sh)"
        ((MISSING_CONFIGS++))
      fi
    fi
  done
  
  if [ $MISSING_CONFIGS -gt 0 ]; then
    log_warning "$MISSING_CONFIGS services missing railway.json files"
  fi
else
  log_warning "Cannot validate railway.json files (config or jq not available)"
fi
echo ""

# 7. Prüfe erforderliche Environment Variables
echo "7️⃣  Checking required Environment Variables..."
if [ -f "$CONFIG_FILE" ] && command -v jq &> /dev/null && command -v railway &> /dev/null && railway whoami &>/dev/null; then
  SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE" 2>/dev/null || echo "")
  MISSING_ENV_VARS=0
  
  for service_name in $SERVICES; do
    service_config=$(jq -r ".services[\"$service_name\"]" "$CONFIG_FILE")
    env_vars=$(echo "$service_config" | jq -r '.environmentVariables[]? | select(.required == true) | .name' 2>/dev/null || echo "")
    
    if [ -n "$env_vars" ]; then
      for env_var in $env_vars; do
        # Prüfe ob Variable in Railway gesetzt ist
        if timeout 5 railway variables --service "$service_name" 2>/dev/null | grep -q "^$env_var="; then
          log_success "$service_name: $env_var is set"
        else
          log_warning "$service_name: $env_var is missing (required)"
          ((MISSING_ENV_VARS++))
        fi
      done
    fi
  done
  
  if [ $MISSING_ENV_VARS -gt 0 ]; then
    log_warning "$MISSING_ENV_VARS required environment variables are missing"
  fi
else
  log_warning "Cannot check environment variables (dependencies not available)"
fi
echo ""

# 8. Prüfe Build-Commands (syntaktisch)
echo "8️⃣  Validating build commands..."
if [ -f "$CONFIG_FILE" ] && command -v jq &> /dev/null; then
  SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE" 2>/dev/null || echo "")
  INVALID_BUILDS=0
  
  for service_name in $SERVICES; do
    service_config=$(jq -r ".services[\"$service_name\"]" "$CONFIG_FILE")
    build_command=$(echo "$service_config" | jq -r '.buildCommand // ""')
    service_path=$(echo "$service_config" | jq -r '.path // ""')
    
    if [ -n "$build_command" ] && [ -n "$service_path" ]; then
      # Prüfe ob der Pfad existiert
      if [ -d "$PROJECT_ROOT/$service_path" ]; then
        log_success "$service_name: Build command and path valid"
      else
        log_error "$service_name: Path '$service_path' does not exist"
        ((INVALID_BUILDS++))
      fi
    else
      log_error "$service_name: Missing buildCommand or path"
      ((INVALID_BUILDS++))
    fi
  done
  
  if [ $INVALID_BUILDS -gt 0 ]; then
    log_error "$INVALID_BUILDS services have invalid build configurations"
  fi
else
  log_warning "Cannot validate build commands (config or jq not available)"
fi
echo ""

# 9. Prüfe Port-Konflikte
echo "9️⃣  Checking for port conflicts..."
if [ -f "$CONFIG_FILE" ] && command -v jq &> /dev/null; then
  declare -A port_usage
  
  SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE" 2>/dev/null || echo "")
  PORT_CONFLICTS=0
  
  for service_name in $SERVICES; do
    service_config=$(jq -r ".services[\"$service_name\"]" "$CONFIG_FILE")
    port=$(echo "$service_config" | jq -r '.port // 0')
    
    if [ "$port" != "0" ] && [ -n "${port_usage[$port]:-}" ]; then
      log_error "Port conflict: $port used by both ${port_usage[$port]} and $service_name"
      ((PORT_CONFLICTS++))
    elif [ "$port" != "0" ]; then
      port_usage[$port]=$service_name
    fi
  done
  
  if [ $PORT_CONFLICTS -eq 0 ]; then
    log_success "No port conflicts detected"
  fi
else
  log_warning "Cannot check port conflicts (config or jq not available)"
fi
echo ""

# 10. Prüfe Dependencies
echo "🔟 Checking service dependencies..."
if [ -f "$CONFIG_FILE" ] && command -v jq &> /dev/null; then
  SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE" 2>/dev/null || echo "")
  INVALID_DEPS=0
  
  for service_name in $SERVICES; do
    service_config=$(jq -r ".services[\"$service_name\"]" "$CONFIG_FILE")
    dependencies=$(echo "$service_config" | jq -r '.dependencies[]? // empty' 2>/dev/null || echo "")
    
    if [ -n "$dependencies" ]; then
      for dep in $dependencies; do
        # Prüfe ob Dependency in Config existiert
        if jq -e ".services[\"$dep\"]" "$CONFIG_FILE" &>/dev/null; then
          log_success "$service_name: Dependency '$dep' exists"
        else
          log_error "$service_name: Dependency '$dep' not found in config"
          ((INVALID_DEPS++))
        fi
      done
    fi
  done
  
  if [ $INVALID_DEPS -gt 0 ]; then
    log_error "$INVALID_DEPS invalid dependencies found"
  fi
else
  log_warning "Cannot check dependencies (config or jq not available)"
fi
echo ""

# Zusammenfassung
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary:"
echo "  ❌ Errors: $ERRORS"
echo "  ⚠️  Warnings: $WARNINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -gt 0 ]; then
  echo "❌ Pre-deployment validation failed with $ERRORS error(s)"
  echo ""
  echo "💡 Fix the errors above before deploying."
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo "⚠️  Pre-deployment validation completed with $WARNINGS warning(s)"
  echo ""
  echo "💡 Review warnings above. Deployment can proceed, but some issues may occur."
  exit 0
else
  echo "✅ Pre-deployment validation passed!"
  echo ""
  echo "💡 Ready to deploy. Run: ./scripts/deploy-railway.sh $ENVIRONMENT"
  exit 0
fi




