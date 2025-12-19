#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-staging}
BASE_URL=""

if [ "$ENVIRONMENT" = "production" ]; then
  BASE_URL="${PRODUCTION_API_URL:-https://api.production.railway.app}"
elif [ "$ENVIRONMENT" = "staging" ]; then
  BASE_URL="${STAGING_API_URL:-https://api.staging.railway.app}"
else
  BASE_URL="${LOCAL_API_URL:-http://localhost:3001}"
fi

echo "Running health checks for environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"

# Health check endpoints
SERVICES=(
  "api-gateway"
  "chat-service"
  "rag-service"
  "agent-service"
  "llm-gateway"
  "customer-intelligence-service"
  "crawler-service"
  "voice-service"
  "avatar-service"
)

FAILED_SERVICES=()

for service in "${SERVICES[@]}"; do
  echo "Checking $service..."
  
  # Try to get service URL from environment or construct it
  SERVICE_URL="${BASE_URL}/health"
  
  if [ "$service" != "api-gateway" ]; then
    # For other services, try service-specific URL
    SERVICE_VAR=$(echo "$service" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
    SERVICE_URL="${!SERVICE_VAR:-${BASE_URL}/health}"
  fi
  
  if curl -f -s "${SERVICE_URL}" > /dev/null; then
    echo "✅ $service is healthy"
  else
    echo "❌ $service health check failed"
    FAILED_SERVICES+=("$service")
  fi
done

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
  echo "Failed services: ${FAILED_SERVICES[*]}"
  exit 1
fi

echo "All services are healthy!"












