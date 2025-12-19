#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-production}

echo "Setting environment variables for: $ENVIRONMENT"

if ! command -v railway &> /dev/null; then
  echo "❌ Railway CLI is not installed"
  exit 1
fi

# Validate required variables
REQUIRED_VARS=(
  "DATABASE_URL"
  "REDIS_URL"
  "JWT_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "❌ Required variable $var is not set"
    exit 1
  fi
done

# Set shared variables (available to all services)
echo "Setting shared variables..."
railway variables set "DATABASE_URL=${DATABASE_URL}" --shared || true
railway variables set "REDIS_URL=${REDIS_URL}" --shared || true
railway variables set "NODE_ENV=production" --shared || true

# Set service-specific variables
SERVICES=(
  "api-gateway"
  "chat-service"
  "rag-service"
  "agent-service"
  "llm-gateway"
)

for service in "${SERVICES[@]}"; do
  echo "Setting variables for $service..."
  
  # Set JWT_SECRET for services that need it
  if [ "$service" = "api-gateway" ] || [ "$service" = "chat-service" ]; then
    railway variables set "JWT_SECRET=${JWT_SECRET}" --service "$service" || true
  fi
  
  # Set CORS_ORIGIN if provided
  if [ -n "${CORS_ORIGIN:-}" ]; then
    railway variables set "CORS_ORIGIN=${CORS_ORIGIN}" --service "$service" || true
  fi
done

echo "✅ Environment variables set"












