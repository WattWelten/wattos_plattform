#!/bin/bash
# Script zur Analyse eines Railway Services
# Usage: ./scripts/analyze-railway-service.sh <service-name>

set -euo pipefail

SERVICE_NAME="${1:-llm-gateway}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Railway Service Analyse: $SERVICE_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prüfe Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI nicht installiert"
    exit 1
fi

# Prüfe Authentifizierung
if ! railway whoami &> /dev/null; then
    echo "❌ Nicht bei Railway authentifiziert"
    echo "   Führe aus: railway login"
    exit 1
fi

echo "✅ Railway CLI installiert und authentifiziert"
echo ""

# Service-Status
echo "📊 Service-Status:"
railway service "$SERVICE_NAME" --json 2>/dev/null | jq '.' || echo "⚠️ Konnte Service-Status nicht abrufen"
echo ""

# Service-Konfiguration
echo "⚙️ Service-Konfiguration:"
railway service "$SERVICE_NAME" --json 2>/dev/null | jq '{
  name: .name,
  status: .status,
  url: .url,
  rootDirectory: .rootDirectory,
  buildCommand: .buildCommand,
  startCommand: .startCommand,
  healthcheckPath: .healthcheckPath
}' || echo "⚠️ Konnte Service-Konfiguration nicht abrufen"
echo ""

# Environment Variables
echo "🔐 Environment Variables:"
railway variables --service "$SERVICE_NAME" 2>/dev/null | head -20 || echo "⚠️ Konnte Environment Variables nicht abrufen"
echo ""

# Logs (letzte 30 Zeilen)
echo "📋 Letzte Logs (30 Zeilen):"
railway logs --service "$SERVICE_NAME" --tail 30 2>/dev/null || echo "⚠️ Konnte Logs nicht abrufen"
echo ""

# Build-Status
echo "🔨 Build-Status:"
railway logs --service "$SERVICE_NAME" --tail 100 2>/dev/null | grep -i "build\|compile\|error" | tail -10 || echo "⚠️ Keine Build-Logs gefunden"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Analyse abgeschlossen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"





