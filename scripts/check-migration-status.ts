#!/usr/bin/env tsx
/**
 * Prüft Migrationsstatus und DB-Struktur
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gesetzt');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkMigrationStatus() {
  console.log('🔍 Prüfe Migrationsstatus...\n');

  try {
    // 1. Prüfe Conversation-Tabelle
    const conversationColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Conversation'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Conversation-Tabelle Spalten:');
    const columnNames = conversationColumns.rows.map(r => r.column_name);
    console.log(`   Gefunden: ${columnNames.join(', ')}`);
    
    const hasStartedAt = columnNames.includes('startedAt');
    console.log(`   startedAt: ${hasStartedAt ? '✅ Vorhanden' : '❌ Fehlt'}`);
    
    const hasThreadId = columnNames.includes('threadId');
    console.log(`   threadId: ${hasThreadId ? '✅ Vorhanden' : '❌ Fehlt'}`);
    
    // 2. Prüfe Tenant-Tabelle
    const tenantColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Tenant'
    `);
    console.log(`\n📊 Tenant-Tabelle: ${tenantColumns.rows.length} Spalten`);
    
    // 3. Prüfe KPI Views
    const views = await pool.query(`
      SELECT viewname
      FROM pg_views
      WHERE viewname LIKE 'vw_kpi_%'
    `);
    console.log(`\n📊 KPI Views: ${views.rows.length} gefunden`);
    views.rows.forEach(v => console.log(`   - ${v.viewname}`));
    
    // 4. Prüfe Enums
    const enums = await pool.query(`
      SELECT typname
      FROM pg_type
      WHERE typname IN ('RoleType', 'FeedbackType', 'SourceType', 'Channel')
    `);
    console.log(`\n📊 Enums: ${enums.rows.length} gefunden`);
    enums.rows.forEach(e => console.log(`   - ${e.typname}`));
    
    // 5. Prüfe _prisma_migrations Tabelle
    const migrations = await pool.query(`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at DESC
      LIMIT 10
    `);
    console.log(`\n📊 Letzte Migrationen: ${migrations.rows.length} gefunden`);
    migrations.rows.forEach(m => {
      console.log(`   - ${m.migration_name} (${m.finished_at})`);
    });
    
    // 6. Zusammenfassung
    console.log('\n📋 Zusammenfassung:');
    if (!hasStartedAt) {
      console.log('   ⚠️  startedAt Spalte fehlt - Migration 20250122000000_add_mvp_models nicht angewendet?');
    }
    if (views.rows.length === 0) {
      console.log('   ⚠️  KPI Views fehlen - Migration 20250130000001_add_kpi_views nicht angewendet?');
    }
    
    if (hasStartedAt && views.rows.length > 0) {
      console.log('   ✅ Alle wichtigen Migrationen scheinen angewendet zu sein');
    }
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkMigrationStatus().catch((e) => {
  console.error(e);
  process.exit(1);
});
