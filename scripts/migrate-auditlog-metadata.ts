#!/usr/bin/env tsx
/**
 * Migration: Add metadata column to AuditLog table
 * 
 * Workaround für Prisma 7.2.0 Format-Problem
 * Führt SQL-Migration direkt aus
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
  console.log('🚀 Starte Migration: Add metadata column to AuditLog...\n');

  try {
    // Prüfe ob Spalte bereits existiert
    const checkColumn = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'AuditLog' AND column_name = 'metadata';
    `);
    
    if (Array.isArray(checkColumn) && checkColumn.length > 0) {
      console.log('✅ Spalte "metadata" existiert bereits in AuditLog Tabelle\n');
      return;
    }

    // Migration ausführen
    const migrationPath = path.resolve(
      'packages/db/migrations/20260112000000_add_auditlog_metadata/migration.sql',
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Führe Migration aus...');
    await prisma.$executeRawUnsafe(migrationSQL);
    console.log('✅ Migration erfolgreich abgeschlossen\n');

    console.log('🎉 Migration abgeschlossen!');
  } catch (error) {
    console.error('❌ Fehler bei Migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

runMigration().catch((e) => {
  console.error(e);
  process.exit(1);
});
