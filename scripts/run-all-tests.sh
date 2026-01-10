#!/bin/bash
# Automatisierter Test-Runner für Multi-Tenant KPI System

set -e

echo "🚀 Starte alle Tests für Multi-Tenant KPI System..."
echo ""

# 1. Unit Tests
echo "📝 Unit Tests..."
pnpm test:kpi
pnpm test:tenant
pnpm test:rbac
pnpm test:config
echo "✅ Unit Tests abgeschlossen"
echo ""

# 2. Integration Tests
echo "🔗 Integration Tests..."
pnpm test:integration
echo "✅ Integration Tests abgeschlossen"
echo ""

# 3. E2E Tests
echo "🌐 E2E Tests..."
pnpm test:e2e:kpi
echo "✅ E2E Tests abgeschlossen"
echo ""

# 4. Performance Tests
echo "⚡ Performance Tests..."
pnpm test:performance
echo "✅ Performance Tests abgeschlossen"
echo ""

echo "🎉 Alle Tests erfolgreich abgeschlossen!"
