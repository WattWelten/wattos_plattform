#!/bin/bash
# Bash Script für automatisiertes Multi-Tenant Setup
# Prüft Environment, führt Migration und Seeds aus

set -e

echo "🚀 Multi-Tenant Setup Script"
echo ""

# 1. Prüfe DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL nicht gesetzt!"
    echo "Bitte setze DATABASE_URL Environment Variable:"
    echo "  export DATABASE_URL='postgresql://user:password@localhost:5432/wattweiser'"
    exit 1
fi

echo "✅ DATABASE_URL gefunden"
echo ""

# 2. Prüfe Datenbank-Verbindung
echo "🔍 Prüfe Datenbank-Verbindung..."
if ! node --import tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.\$connect().then(() => { console.log('✅ Verbindung erfolgreich'); process.exit(0); }).catch((e) => { console.error('❌ Verbindung fehlgeschlagen:', e.message); process.exit(1); });"; then
    echo "❌ Datenbank-Verbindung fehlgeschlagen"
    exit 1
fi
echo "✅ Datenbank-Verbindung erfolgreich"
echo ""

# 3. Führe Migration aus
echo "📝 Führe Migration aus..."
if ! pnpm migrate:manual; then
    echo "❌ Migration fehlgeschlagen"
    exit 1
fi
echo "✅ Migration erfolgreich"
echo ""

# 4. Führe Seeds aus
echo "🌱 Führe Seeds aus..."
if ! pnpm seed:tenants; then
    echo "❌ Seeds fehlgeschlagen"
    exit 1
fi
echo "✅ Seeds erfolgreich"
echo ""

# 5. Verifiziere Setup
echo "🔍 Verifiziere Setup..."
TENANT_COUNT=$(node --import tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.tenant.count().then(count => { console.log(count); process.exit(0); });")
if [ "$TENANT_COUNT" -ge 4 ]; then
    echo "✅ $TENANT_COUNT Tenants gefunden"
    echo "✅ Setup-Verifikation erfolgreich"
else
    echo "⚠️  Erwartet: 4 Tenants, gefunden: $TENANT_COUNT"
    exit 1
fi
echo ""

echo "🎉 Multi-Tenant Setup erfolgreich abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "  1. Starte die Anwendung: pnpm dev:mvp"
echo "  2. Öffne Dashboard: http://localhost:3000"
echo "  3. Führe Tests aus: pnpm test:all"
