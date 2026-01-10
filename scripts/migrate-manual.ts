#!/usr/bin/env tsx
/**
 * Manuelle Migration für Multi-Tenant KPI System
 * 
 * Workaround für Prisma 7.2.0 Format-Problem
 * Führt SQL-Migrationen direkt aus
 */

// Lade .env Datei bevor PrismaClient instanziiert wird
import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

// Prisma 7.2.0+: DATABASE_URL wird aus .env geladen (via dotenv/config)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required. Bitte .env Datei prüfen.');
}

// Prisma 7.2.0+: Erfordert Driver Adapter für PostgreSQL
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runMigration() {
  console.log('🚀 Starte manuelle Migration...\n');

  try {
    // 1. Haupt-Migration
    const migrationPath = path.resolve(
      'packages/db/migrations/20250130000000_add_multi_tenant_kpi/migration.sql',
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Führe Haupt-Migration aus...');
    await prisma.$executeRawUnsafe(migrationSQL);
    console.log('✅ Haupt-Migration erfolgreich\n');

    // 2. KPI Views
    const viewsPath = path.resolve(
      'packages/db/migrations/20250130000001_add_kpi_views.sql',
    );
    const viewsSQL = fs.readFileSync(viewsPath, 'utf8');

    console.log('📊 Erstelle KPI Views...');
    await prisma.$executeRawUnsafe(viewsSQL);
    console.log('✅ KPI Views erfolgreich erstellt\n');

    console.log('🎉 Migration abgeschlossen!');
  } catch (error) {
    console.error('❌ Fehler bei Migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration().catch((e) => {
  console.error(e);
  process.exit(1);
});
