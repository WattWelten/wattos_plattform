#!/bin/bash
set -euo pipefail

# Script zum Generieren von service-spezifischen railway.json Dateien
# aus scripts/services-config.json

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/services-config.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Error: $CONFIG_FILE not found"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "❌ Error: jq is required but not installed"
  echo "   Install with: brew install jq (macOS) or apt-get install jq (Linux)"
  exit 1
fi

echo "🔧 Generating Railway configuration files..."
echo ""

# Funktion zum Bestimmen der Scaling-Konfiguration basierend auf Service-Typ
get_scaling_config() {
  local service_type=$1
  local priority=$2
  
  case "$service_type" in
    "gateway")
      echo '{"minReplicas": 2, "maxReplicas": 5, "targetCPU": 70, "targetMemory": 80}'
      ;;
    "nestjs")
      if [ "$priority" -le 2 ]; then
        echo '{"minReplicas": 2, "maxReplicas": 10, "targetCPU": 70, "targetMemory": 80}'
      else
        echo '{"minReplicas": 1, "maxReplicas": 3, "targetCPU": 70, "targetMemory": 80}'
      fi
      ;;
    "python")
      echo '{"minReplicas": 1, "maxReplicas": 3, "targetCPU": 70, "targetMemory": 80}'
      ;;
    "worker")
      echo '{"minReplicas": 1, "maxReplicas": 2, "targetCPU": 50, "targetMemory": 60}'
      ;;
    *)
      echo '{"minReplicas": 1, "maxReplicas": 3, "targetCPU": 70, "targetMemory": 80}'
      ;;
  esac
}

# Funktion zum Generieren der railway.json für einen Service
generate_railway_config() {
  local service_name=$1
  local service_path=$2
  local build_command=$3
  local start_command=$4
  local health_check_path=$5
  local service_type=$6
  local priority=$7
  
  local railway_json_path="$PROJECT_ROOT/$service_path/railway.json"
  local railway_dir=$(dirname "$railway_json_path")
  
  # Erstelle Verzeichnis falls nicht vorhanden
  mkdir -p "$railway_dir"
  
  # Bestimme Scaling-Konfiguration
  local scaling_config=$(get_scaling_config "$service_type" "$priority")
  
  # Generiere railway.json
  cat > "$railway_json_path" <<EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "$build_command"
  },
  "deploy": {
    "startCommand": "$start_command",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "$health_check_path",
    "healthcheckTimeout": 100,
    "healthcheckInterval": 10,
    "scaling": $scaling_config
  }
}
EOF
  
  echo "  ✅ Generated: $railway_json_path"
}

# Lese alle Services aus der Config
SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE")

GENERATED_COUNT=0
FAILED_COUNT=0

for service_name in $SERVICES; do
  echo "📦 Processing: $service_name"
  
  # Extrahiere Service-Konfiguration
  service_config=$(jq -r ".services[\"$service_name\"]" "$CONFIG_FILE")
  
  if [ "$service_config" = "null" ]; then
    echo "  ⚠️  Service not found in config, skipping..."
    ((FAILED_COUNT++))
    continue
  fi
  
  # Extrahiere Felder
  service_path=$(echo "$service_config" | jq -r '.path // ""')
  build_command=$(echo "$service_config" | jq -r '.buildCommand // ""')
  start_command=$(echo "$service_config" | jq -r '.startCommand // ""')
  health_check_path=$(echo "$service_config" | jq -r '.healthCheckPath // "/health"')
  service_type=$(echo "$service_config" | jq -r '.type // "nestjs"')
  priority=$(echo "$service_config" | jq -r '.deploymentPriority // 5')
  
  # Validiere erforderliche Felder
  if [ -z "$service_path" ] || [ -z "$build_command" ] || [ -z "$start_command" ]; then
    echo "  ⚠️  Missing required fields (path, buildCommand, or startCommand), skipping..."
    ((FAILED_COUNT++))
    continue
  fi
  
  # Generiere railway.json
  if generate_railway_config "$service_name" "$service_path" "$build_command" "$start_command" "$health_check_path" "$service_type" "$priority"; then
    ((GENERATED_COUNT++))
  else
    ((FAILED_COUNT++))
  fi
  
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "  ✅ Generated: $GENERATED_COUNT railway.json files"
echo "  ❌ Failed: $FAILED_COUNT services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED_COUNT -gt 0 ]; then
  echo ""
  echo "⚠️  Some services could not be processed. Check the errors above."
  exit 1
fi

echo ""
echo "✅ Railway configuration files generated successfully!"
echo ""
echo "💡 Next steps:"
echo "   1. Review generated railway.json files"
echo "   2. Run: ./scripts/validate-pre-deployment.sh"
echo "   3. Run: ./scripts/deploy-railway.sh <environment>"









