#!/bin/bash
# Database Migration Script für Railway
# Wird als Build Hook oder separater Service ausgeführt

set -e

echo "Starting database migration..."

# Prisma Client generieren
echo "Generating Prisma Client..."
npx prisma generate

# Migrationen ausführen
echo "Running migrations..."
npx prisma migrate deploy

echo "Database migration completed successfully!"














