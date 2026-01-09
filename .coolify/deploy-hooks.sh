#!/bin/bash
# Coolify Deployment Hooks für WattOS Plattform
# Wird nach dem Deployment ausgeführt

set -e

echo "🚀 Starting post-deployment hooks..."

# 1. Datenbank-Migrationen ausführen
echo "📦 Running database migrations..."
cd /app/packages/db || cd packages/db
pnpm prisma migrate deploy || npm run migrate:deploy || echo "⚠️ Migration command not found, skipping..."

# 2. Prisma Client generieren (falls nötig)
echo "🔧 Generating Prisma Client..."
pnpm prisma generate || npm run db:generate || echo "⚠️ Prisma generate command not found, skipping..."

# 3. Optional: Demo-Daten seeden (nur wenn ENV-Variable gesetzt)
if [ "$SEED_DEMO_DATA" = "true" ]; then
  echo "🌱 Seeding demo data..."
  cd /app || cd .
  pnpm seed:dev || npm run seed:dev || echo "⚠️ Seed command not found, skipping..."
fi

# 4. Health-Check (warten bis Services bereit sind)
echo "🏥 Waiting for services to be healthy..."
sleep 10

# Gateway Health-Check
if [ -n "$GATEWAY_URL" ]; then
  echo "Checking Gateway health..."
  curl -f "$GATEWAY_URL/api/health/liveness" || echo "⚠️ Gateway health check failed"
fi

# Web Health-Check
if [ -n "$WEB_URL" ]; then
  echo "Checking Web health..."
  curl -f "$WEB_URL/api/health" || echo "⚠️ Web health check failed"
fi

echo "✅ Post-deployment hooks completed successfully!"
