#!/bin/bash
# Quick Check Script für Railway Failures
# Prüft die häufigsten Probleme bei fehlgeschlagenen Deployments

set -euo pipefail

echo "🔍 Railway Failure Quick Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prüfe Railway Link
if ! railway status &> /dev/null; then
  echo "❌ Railway Projekt nicht verlinkt"
  echo "   Führe aus: railway link"
  echo ""
  exit 1
fi

echo "✅ Railway Projekt verlinkt"
echo ""

# Liste Services
echo "📋 Services:"
railway service list
echo ""

# Prüfe einen kritischen Service (Gateway)
SERVICE="gateway"
echo "🔍 Analysiere $SERVICE Service..."
echo ""

# Prüfe Logs auf häufige Fehler
echo "📄 Letzte Logs (nach Fehlern):"
railway logs --service "$SERVICE" --tail 50 | grep -i "error\|failed\|exception\|fatal" | tail -10 || echo "Keine Fehler gefunden"
echo ""

# Prüfe Build-Fehler
echo "🔨 Build-Logs:"
railway logs --service "$SERVICE" --tail 100 | grep -i "build\|compile\|npm\|pnpm" | tail -10 || echo "Keine Build-Logs gefunden"
echo ""

# Prüfe Start-Fehler
echo "🚀 Start-Logs:"
railway logs --service "$SERVICE" --tail 100 | grep -i "start\|listen\|port\|cannot.*start" | tail -10 || echo "Keine Start-Logs gefunden"
echo ""

# Prüfe Environment Variables
echo "🔐 Environment Variables:"
railway variables --service "$SERVICE" | grep -E "DATABASE_URL|REDIS_URL|DEPLOYMENT_PLATFORM|PORT" || echo "Kritische Variablen nicht gefunden"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Tipp: Führe './scripts/analyze-railway-deployment.sh production' für vollständige Analyse aus"
echo ""









