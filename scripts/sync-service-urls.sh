#!/bin/bash
set -euo pipefail

ENVIRONMENT=${1:-production}

echo "🔄 Syncing service URLs for environment: $ENVIRONMENT"

if ! command -v railway &> /dev/null; then
  echo "❌ Railway CLI is not installed. Install with: npm i -g @railway/cli"
  exit 1
fi

# Service-Name zu ENV-Variable Mapping
# Format: "service-name:ENV_VAR_NAME:port"
SERVICES=(
  "api-gateway:API_GATEWAY_URL:3001"
  "chat-service:CHAT_SERVICE_URL:3006"
  "rag-service:RAG_SERVICE_URL:3007"
  "agent-service:AGENT_SERVICE_URL:3008"
  "llm-gateway:LLM_GATEWAY_URL:3009"
  "tool-service:TOOL_SERVICE_URL:3005"
  "admin-service:ADMIN_SERVICE_URL:3008"
  "customer-intelligence-service:CUSTOMER_INTELLIGENCE_SERVICE_URL:3014"
  "crawler-service:CRAWLER_SERVICE_URL:3015"
  "voice-service:VOICE_SERVICE_URL:3016"
  "avatar-service:AVATAR_SERVICE_URL:3009"
  "character-service:CHARACTER_SERVICE_URL:3013"
  "ingestion-service:INGESTION_SERVICE_URL:8001"
  "summary-service:SUMMARY_SERVICE_URL:3006"
  "feedback-service:FEEDBACK_SERVICE_URL:3007"
  "metaverse-service:METAVERSE_SERVICE_URL:3010"
)

echo ""
echo "📋 Services to sync:"
for service_mapping in "${SERVICES[@]}"; do
  SERVICE_NAME="${service_mapping%%:*}"
  echo "  - $SERVICE_NAME"
done
echo ""

SYNCED_COUNT=0
FAILED_COUNT=0

for service_mapping in "${SERVICES[@]}"; do
  IFS=':' read -r SERVICE_NAME ENV_VAR_NAME PORT <<< "$service_mapping"
  
  echo "🔍 Getting URL for $SERVICE_NAME..."
  
  # Railway Service URL abrufen
  # Railway CLI gibt die URL im Format: https://service-name-production.up.railway.app
  SERVICE_URL=$(railway service "$SERVICE_NAME" --json 2>/dev/null | jq -r '.url // .domain // empty' || echo "")
  
  if [ -z "$SERVICE_URL" ]; then
    # Alternative: Versuche über Railway Variables
    SERVICE_URL=$(railway variables --service "$SERVICE_NAME" 2>/dev/null | grep -i "url" | head -1 | awk '{print $2}' || echo "")
  fi
  
  if [ -n "$SERVICE_URL" ] && [ "$SERVICE_URL" != "null" ]; then
    echo "  ✅ Found URL: $SERVICE_URL"
    
    # Setze ENV-Variable für alle Services, die diesen Service benötigen
    # Railway Shared Variables verwenden
    echo "  📝 Setting $ENV_VAR_NAME=$SERVICE_URL (shared variable)..."
    
    if railway variables set "$ENV_VAR_NAME=$SERVICE_URL" --service "$SERVICE_NAME" 2>/dev/null; then
      echo "  ✅ Set $ENV_VAR_NAME for $SERVICE_NAME"
      ((SYNCED_COUNT++))
    else
      echo "  ⚠️  Failed to set $ENV_VAR_NAME for $SERVICE_NAME"
      ((FAILED_COUNT++))
    fi
  else
    echo "  ⚠️  Could not get URL for $SERVICE_NAME (service may not exist or not deployed)"
    ((FAILED_COUNT++))
  fi
  
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "  ✅ Synced: $SYNCED_COUNT services"
echo "  ❌ Failed: $FAILED_COUNT services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILED_COUNT -gt 0 ]; then
  echo ""
  echo "⚠️  Some services could not be synced. This is normal if:"
  echo "   - Services are not yet deployed"
  echo "   - Services don't have public URLs"
  echo "   - Railway CLI is not authenticated"
  echo ""
  exit 0  # Exit with success, as partial sync is acceptable
fi

echo ""
echo "✅ Service URLs synced successfully!"
echo ""
echo "💡 Tip: Run this script after deploying new services or when service URLs change."
