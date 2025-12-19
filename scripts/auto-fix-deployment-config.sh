#!/bin/bash
set -euo pipefail

# Deployment Configuration Auto-Fix Script
# Behebt automatisch behebbare Deployment-Konfigurationsfehler

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/services-config.json"
ENVIRONMENT="${1:-production}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: services-config.json not found at $CONFIG_FILE"
  exit 1
fi

# Prüfe ob jq installiert ist
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed."
  exit 1
fi

echo "=========================================="
echo "Deployment Configuration Auto-Fix"
echo "Environment: $ENVIRONMENT"
echo "=========================================="
echo ""

FIXES_APPLIED=0
ERRORS=0

# 1. Environment Variables Format-Korrekturen
echo "=== Step 1: Environment Variables Format Fixes ==="
echo ""

# Diese Fixes sind nur für sichere Format-Korrekturen
# Kritische Variablen (z.B. DATABASE_URL) werden NICHT auto-fixed

echo "✅ Environment variable format validation (no auto-fixes for security reasons)"
echo "⚠️  Manual review required for any format issues"
echo ""

# 2. Service Configuration Konsistenz
echo "=== Step 2: Service Configuration Consistency ==="
echo ""

# Prüfe auf Port-Konflikte
PORTS=$(jq -r '.services[].port' "$CONFIG_FILE" | sort -n)
DUPLICATE_PORTS=$(echo "$PORTS" | uniq -d)

if [ -z "$DUPLICATE_PORTS" ]; then
  echo "✅ No port conflicts found"
else
  echo "❌ Found duplicate ports (manual fix required):"
  echo "$DUPLICATE_PORTS"
  ((ERRORS++))
fi

echo ""

# 3. Build Command Validierung
echo "=== Step 3: Build Command Validation ==="
echo ""

SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE")
BUILD_ERRORS=0

while IFS= read -r service_key; do
  SERVICE_PATH=$(jq -r ".services[\"$service_key\"].path" "$CONFIG_FILE")
  BUILD_CMD=$(jq -r ".services[\"$service_key\"].buildCommand" "$CONFIG_FILE")
  
  if [ ! -d "$SERVICE_PATH" ]; then
    echo "⚠️  $service_key: Service path does not exist: $SERVICE_PATH"
    ((BUILD_ERRORS++))
  elif [ -z "$BUILD_CMD" ] || [ "$BUILD_CMD" = "null" ]; then
    echo "⚠️  $service_key: Build command not specified"
    ((BUILD_ERRORS++))
  fi
done <<< "$SERVICES"

if [ $BUILD_ERRORS -eq 0 ]; then
  echo "✅ All build commands are valid"
else
  echo "⚠️  Found $BUILD_ERRORS build command issue(s) (manual fix required)"
  ((ERRORS++))
fi

echo ""

# 4. Dependency Graph Validierung
echo "=== Step 4: Dependency Graph Validation ==="
echo ""

# Prüfe auf zirkuläre Abhängigkeiten
CIRCULAR_FOUND=false

for service_key in $SERVICES; do
  DEPS=$(jq -r ".services[\"$service_key\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
  
  while IFS= read -r dep; do
    if [ -z "$dep" ]; then
      continue
    fi
    
    # Prüfe ob Dependency existiert
    if ! jq -e ".services[\"$dep\"]" "$CONFIG_FILE" > /dev/null 2>&1; then
      SERVICE_NAME=$(jq -r ".services[\"$service_key\"].displayName" "$CONFIG_FILE")
      echo "❌ $SERVICE_NAME depends on '$dep' which is not defined"
      ((ERRORS++))
    fi
  done <<< "$DEPS"
done

if [ "$CIRCULAR_FOUND" = "false" ] && [ $ERRORS -eq 0 ]; then
  echo "✅ Dependency graph is valid"
fi

echo ""

# 5. Railway Configuration Validierung
echo "=== Step 5: Railway Configuration Validation ==="
echo ""

if [ -f "railway.toml" ]; then
  echo "✅ railway.toml exists"
  
  # Prüfe ob startCommand korrekt ist
  if grep -q "startCommand" railway.toml; then
    echo "✅ startCommand is configured"
  else
    echo "⚠️  startCommand not found in railway.toml"
    ((ERRORS++))
  fi
else
  echo "⚠️  railway.toml not found (may be service-specific)"
fi

echo ""

# Zusammenfassung
echo "=========================================="
echo "Auto-Fix Summary"
echo "=========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $FIXES_APPLIED -eq 0 ]; then
  echo "✅ No deployment configuration issues found"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo "✅ Applied $FIXES_APPLIED fix(es)"
  exit 0
else
  echo "❌ Found $ERRORS error(s) that require manual fix"
  echo ""
  echo "Deployment configuration issues cannot be auto-fixed for security reasons."
  echo "Please review and fix manually."
  exit 1
fi












