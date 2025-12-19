#!/bin/bash
set -euo pipefail

# Railway Setup Script
# Setzt alle notwendigen Environment Variables in Railway

PROJECT_ID="${RAILWAY_PROJECT_ID:-a97f01bc-dc80-4941-b911-ed7ebb3efa7a}"
ENVIRONMENT="${1:-production}"

echo "Setting up Railway environment: $ENVIRONMENT"
echo "Project ID: $PROJECT_ID"

if ! command -v railway &> /dev/null; then
  echo "❌ Railway CLI is not installed"
  echo "Install with: npm install -g @railway/cli"
  exit 1
fi

# Login to Railway
echo "Logging in to Railway..."
if [ -n "${RAILWAY_TOKEN:-}" ]; then
  echo "$RAILWAY_TOKEN" | railway login
else
  railway login
fi

# Link to project
echo "Linking to project: $PROJECT_ID"
railway link "$PROJECT_ID" || railway link

# Set shared variables
echo "Setting shared variables..."
railway variables set "NODE_ENV=production" --shared || true

# Set service-specific variables
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

for service in "${SERVICES[@]}"; do
  echo "Setting variables for $service..."
  
  # Select service
  railway service "$service" || echo "Service $service not found, skipping..."
  
  # Set common variables
  if [ -n "${JWT_SECRET:-}" ] && [ "$service" = "api-gateway" ]; then
    railway variables set "JWT_SECRET=$JWT_SECRET" || true
  fi
  
  if [ -n "${CORS_ORIGIN:-}" ] && [ "$service" = "api-gateway" ]; then
    railway variables set "CORS_ORIGIN=$CORS_ORIGIN" || true
  fi
  
  # Set LLM Gateway variables
  if [ "$service" = "llm-gateway" ]; then
    if [ -n "${OPENAI_API_KEY:-}" ]; then
      railway variables set "OPENAI_API_KEY=$OPENAI_API_KEY" || true
    fi
    if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
      railway variables set "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" || true
    fi
  fi
  
  # Set Voice Service variables
  if [ "$service" = "voice-service" ]; then
    if [ -n "${ELEVENLABS_API_KEY:-}" ]; then
      railway variables set "ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY" || true
    fi
    if [ -n "${ELEVENLABS_VOICE_ID:-}" ]; then
      railway variables set "ELEVENLABS_VOICE_ID=$ELEVENLABS_VOICE_ID" || true
    fi
  fi
done

echo "✅ Railway setup completed!"












