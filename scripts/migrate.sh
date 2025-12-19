#!/bin/bash
set -euo pipefail

COMMAND=${1:-deploy}
ENVIRONMENT=${2:-production}

echo "Running database migration: $COMMAND for environment: $ENVIRONMENT"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

case "$COMMAND" in
  "deploy")
    echo "Deploying migrations..."
    cd packages/db || cd apps/services/api-gateway || exit 1
    npx prisma migrate deploy
    echo "✅ Migrations deployed successfully"
    ;;
  "status")
    echo "Checking migration status..."
    cd packages/db || cd apps/services/api-gateway || exit 1
    npx prisma migrate status
    ;;
  "verify")
    echo "Verifying migrations..."
    cd packages/db || cd apps/services/api-gateway || exit 1
    npx prisma migrate status
    if [ $? -eq 0 ]; then
      echo "✅ All migrations are applied"
    else
      echo "❌ Migration verification failed"
      exit 1
    fi
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Usage: $0 [deploy|status|verify] [environment]"
    exit 1
    ;;
esac












