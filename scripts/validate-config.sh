#!/bin/bash
set -euo pipefail

# Configuration Validator
# Validiert Service-Konfigurationen und Build-Status

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

echo "Validating service configurations for environment: $ENVIRONMENT"
echo ""

FAILED_VALIDATIONS=0
WARNINGS=0

# 1. Service-Konfiguration Validierung
echo "=== Service Configuration Validation ==="
echo ""

SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE")

while IFS= read -r service_key; do
  SERVICE_NAME=$(jq -r ".services[\"$service_key\"].displayName" "$CONFIG_FILE")
  SERVICE_PATH=$(jq -r ".services[\"$service_key\"].path" "$CONFIG_FILE")
  BUILD_CMD=$(jq -r ".services[\"$service_key\"].buildCommand" "$CONFIG_FILE")
  
  echo "--- $SERVICE_NAME ($service_key) ---"
  
  # Prüfe ob Service-Pfad existiert
  if [ ! -d "$SERVICE_PATH" ]; then
    echo "❌ Service path does not exist: $SERVICE_PATH"
    ((FAILED_VALIDATIONS++))
  else
    echo "✅ Service path exists: $SERVICE_PATH"
  fi
  
  # Prüfe ob package.json existiert
  if [ ! -f "$SERVICE_PATH/package.json" ]; then
    if [ "$(jq -r ".services[\"$service_key\"].type" "$CONFIG_FILE")" != "python" ]; then
      echo "❌ package.json not found in $SERVICE_PATH"
      ((FAILED_VALIDATIONS++))
    else
      echo "⚠️  Python service - package.json not required"
      ((WARNINGS++))
    fi
  else
    echo "✅ package.json exists"
  fi
  
  # Prüfe Build-Command
  if [ -z "$BUILD_CMD" ] || [ "$BUILD_CMD" = "null" ]; then
    echo "⚠️  Build command not specified"
    ((WARNINGS++))
  else
    echo "✅ Build command: $BUILD_CMD"
  fi
  
  echo ""
done <<< "$SERVICES"

# 2. Port-Konflikt-Check
echo "=== Port Conflict Check ==="
echo ""

PORTS=$(jq -r '.services[].port' "$CONFIG_FILE" | sort -n)
DUPLICATE_PORTS=$(echo "$PORTS" | uniq -d)

if [ -z "$DUPLICATE_PORTS" ]; then
  echo "✅ No port conflicts found"
else
  echo "❌ Found duplicate ports:"
  echo "$DUPLICATE_PORTS"
  ((FAILED_VALIDATIONS++))
fi

echo ""

# 3. Dependency-Graph Validierung
echo "=== Dependency Graph Validation ==="
echo ""

# Prüfe auf zirkuläre Abhängigkeiten (vereinfacht)
SERVICES_ARRAY=($SERVICES)

for service_key in "${SERVICES_ARRAY[@]}"; do
  DEPS=$(jq -r ".services[\"$service_key\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
  
  while IFS= read -r dep; do
    if [ -z "$dep" ]; then
      continue
    fi
    
    # Prüfe ob Dependency existiert
    if ! jq -e ".services[\"$dep\"]" "$CONFIG_FILE" > /dev/null 2>&1; then
      SERVICE_NAME=$(jq -r ".services[\"$service_key\"].displayName" "$CONFIG_FILE")
      echo "❌ $SERVICE_NAME depends on '$dep' which is not defined in services-config.json"
      ((FAILED_VALIDATIONS++))
    fi
  done <<< "$DEPS"
done

if [ $FAILED_VALIDATIONS -eq 0 ]; then
  echo "✅ All dependencies are valid"
fi

echo ""

# 4. Build-Status Check (optional, wenn dist/ existiert)
echo "=== Build Status Check ==="
echo ""

BUILT_SERVICES=0
NOT_BUILT_SERVICES=0

for service_key in "${SERVICES_ARRAY[@]}"; do
  SERVICE_PATH=$(jq -r ".services[\"$service_key\"].path" "$CONFIG_FILE")
  SERVICE_TYPE=$(jq -r ".services[\"$service_key\"].type" "$CONFIG_FILE")
  
  if [ "$SERVICE_TYPE" = "python" ]; then
    continue # Skip Python services
  fi
  
  if [ -d "$SERVICE_PATH/dist" ]; then
    ((BUILT_SERVICES++))
  else
    ((NOT_BUILT_SERVICES++))
  fi
done

if [ $NOT_BUILT_SERVICES -eq 0 ]; then
  echo "✅ All services are built"
elif [ $BUILT_SERVICES -gt 0 ]; then
  echo "⚠️  $NOT_BUILT_SERVICES service(s) not built (run 'pnpm build' to build all)"
  ((WARNINGS++))
else
  echo "⚠️  No services are built (run 'pnpm build' to build all)"
  ((WARNINGS++))
fi

echo ""

# Zusammenfassung
echo "=== Validation Summary ==="
echo ""

if [ $FAILED_VALIDATIONS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All configuration validations passed!"
  exit 0
elif [ $FAILED_VALIDATIONS -eq 0 ]; then
  echo "⚠️  Validation completed with $WARNINGS warning(s)"
  echo "⚠️  Warnings are non-blocking but should be reviewed"
  exit 0
else
  echo "❌ Validation failed with $FAILED_VALIDATIONS error(s)"
  if [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Also found $WARNINGS warning(s)"
  fi
  exit 1
fi












