#!/bin/bash
set -euo pipefail

# Environment Variables Validator
# Validiert Environment Variables gegen Schema aus services-config.json

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
  echo "Installation: brew install jq (macOS) or sudo apt-get install jq (Linux)"
  exit 1
fi

echo "Validating environment variables for environment: $ENVIRONMENT"
echo ""

FAILED_VALIDATIONS=0
WARNINGS=0

# Funktion zum Validieren einer Environment Variable
validate_env_var() {
  local service_name=$1
  local var_name=$2
  local required=$3
  local var_value="${!var_name:-}"
  
  if [ "$required" = "true" ]; then
    if [ -z "$var_value" ]; then
      echo "❌ $service_name: Required environment variable '$var_name' is not set"
      return 1
    else
      echo "✅ $service_name: Required environment variable '$var_name' is set"
      return 0
    fi
  else
    if [ -z "$var_value" ]; then
      echo "⚠️  $service_name: Optional environment variable '$var_name' is not set (using default if available)"
      return 0
    else
      echo "✅ $service_name: Optional environment variable '$var_name' is set"
      return 0
    fi
  fi
}

# Funktion zum Validieren des Formats einer Variable
validate_format() {
  local var_name=$1
  local var_value="${!var_name:-}"
  local expected_format=$2
  
  if [ -z "$var_value" ]; then
    return 0 # Skip if not set
  fi
  
  case "$expected_format" in
    "url")
      if [[ ! "$var_value" =~ ^https?:// ]]; then
        echo "❌ Format validation failed: '$var_name' should be a valid URL (starting with http:// or https://)"
        return 1
      fi
      ;;
    "database_url")
      if [[ ! "$var_value" =~ ^postgresql:// ]]; then
        echo "❌ Format validation failed: '$var_name' should be a PostgreSQL connection string (starting with postgresql://)"
        return 1
      fi
      ;;
    "redis_url")
      if [[ ! "$var_value" =~ ^redis:// ]]; then
        echo "❌ Format validation failed: '$var_name' should be a Redis connection string (starting with redis://)"
        return 1
      fi
      ;;
    "jwt_secret")
      if [ ${#var_value} -lt 32 ]; then
        echo "⚠️  Format validation warning: '$var_name' should be at least 32 characters long for security"
        return 0 # Warning, not error
      fi
      ;;
    "port")
      if ! [[ "$var_value" =~ ^[0-9]+$ ]] || [ "$var_value" -lt 1 ] || [ "$var_value" -gt 65535 ]; then
        echo "❌ Format validation failed: '$var_name' should be a valid port number (1-65535)"
        return 1
      fi
      ;;
    "boolean")
      if [[ ! "$var_value" =~ ^(true|false|TRUE|FALSE)$ ]]; then
        echo "❌ Format validation failed: '$var_name' should be 'true' or 'false'"
        return 1
      fi
      ;;
  esac
  
  return 0
}

# Validiere Shared Environment Variables
echo "=== Shared Environment Variables ==="
echo ""

# NODE_ENV
if [ -z "${NODE_ENV:-}" ]; then
  echo "⚠️  NODE_ENV is not set (defaulting to 'development')"
  ((WARNINGS++))
else
  if [[ ! "$NODE_ENV" =~ ^(development|production|staging|test)$ ]]; then
    echo "❌ NODE_ENV has invalid value: '$NODE_ENV' (should be: development, production, staging, or test)"
    ((FAILED_VALIDATIONS++))
  else
    echo "✅ NODE_ENV is set to: $NODE_ENV"
  fi
fi

# DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is not set (required for all services)"
  ((FAILED_VALIDATIONS++))
else
  validate_format "DATABASE_URL" "database_url" || ((FAILED_VALIDATIONS++))
  echo "✅ DATABASE_URL is set"
fi

# REDIS_URL
if [ -z "${REDIS_URL:-}" ]; then
  echo "⚠️  REDIS_URL is not set (some services may not work without Redis)"
  ((WARNINGS++))
else
  validate_format "REDIS_URL" "redis_url" || ((FAILED_VALIDATIONS++))
  echo "✅ REDIS_URL is set"
fi

echo ""

# Validiere Service-spezifische Environment Variables
echo "=== Service-specific Environment Variables ==="
echo ""

SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE")

while IFS= read -r service_key; do
  SERVICE_NAME=$(jq -r ".services[\"$service_key\"].displayName" "$CONFIG_FILE")
  ENV_VARS=$(jq -r ".services[\"$service_key\"].environmentVariables[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
  
  if [ -z "$ENV_VARS" ]; then
    continue
  fi
  
  echo "--- $SERVICE_NAME ($service_key) ---"
  
  while IFS= read -r env_var_json; do
    VAR_NAME=$(echo "$env_var_json" | jq -r '.name')
    REQUIRED=$(echo "$env_var_json" | jq -r '.required // false')
    
    # Prüfe ob Variable gesetzt ist
    if ! validate_env_var "$SERVICE_NAME" "$VAR_NAME" "$REQUIRED"; then
      ((FAILED_VALIDATIONS++))
    fi
    
    # Format-Validierung basierend auf Variable-Name
    if [ -n "${!VAR_NAME:-}" ]; then
      case "$VAR_NAME" in
        *_URL|*_SERVICE_URL|*_GATEWAY_URL)
          validate_format "$VAR_NAME" "url" || ((FAILED_VALIDATIONS++))
          ;;
        DATABASE_URL)
          validate_format "$VAR_NAME" "database_url" || ((FAILED_VALIDATIONS++))
          ;;
        REDIS_URL)
          validate_format "$VAR_NAME" "redis_url" || ((FAILED_VALIDATIONS++))
          ;;
        JWT_SECRET)
          validate_format "$VAR_NAME" "jwt_secret" || ((WARNINGS++))
          ;;
        *_PORT|PORT)
          validate_format "$VAR_NAME" "port" || ((FAILED_VALIDATIONS++))
          ;;
        *_ENABLED|*_ENABLED)
          validate_format "$VAR_NAME" "boolean" || ((FAILED_VALIDATIONS++))
          ;;
      esac
    fi
  done <<< "$ENV_VARS"
  
  echo ""
done <<< "$SERVICES"

# Zusammenfassung
echo "=== Validation Summary ==="
echo ""

if [ $FAILED_VALIDATIONS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo "✅ All environment variables are valid!"
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












