#!/usr/bin/env tsx
/**
 * Fügt fehlende Spalten zu Role und Event Tabellen hinzu
 */

import 'dotenv/config';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gesetzt');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function fixMissingColumns() {
  console.log('🔧 Prüfe und füge fehlende Spalten hinzu...\n');

  try {
    // 1. Prüfe Role-Tabelle
    const roleColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Role'
    `);
    const roleColumnNames = roleColumns.rows.map(r => r.column_name);
    console.log('Role Spalten:', roleColumnNames.join(', '));

    if (!roleColumnNames.includes('roleType')) {
      console.log('📝 Füge roleType Spalte zu Role hinzu...');
      await pool.query(`
        ALTER TABLE "Role" 
        ADD COLUMN IF NOT EXISTS "roleType" TEXT;
      `);
      console.log('✅ roleType Spalte hinzugefügt\n');
    } else {
      console.log('✅ roleType Spalte bereits vorhanden\n');
    }

    // 2. Prüfe Event-Tabelle
    const eventColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Event'
    `);
    const eventColumnNames = eventColumns.rows.map(r => r.column_name);
    console.log('Event Spalten:', eventColumnNames.join(', '));

    if (!eventColumnNames.includes('payloadJsonb')) {
      console.log('📝 Füge payloadJsonb Spalte zu Event hinzu...');
      await pool.query(`
        ALTER TABLE "Event" 
        ADD COLUMN IF NOT EXISTS "payloadJsonb" JSONB DEFAULT '{}';
      `);
      console.log('✅ payloadJsonb Spalte hinzugefügt\n');
    } else {
      console.log('✅ payloadJsonb Spalte bereits vorhanden\n');
    }

    // 3. Prüfe ob Event-Tabelle existiert
    if (eventColumnNames.length === 0) {
      console.log('⚠️  Event-Tabelle existiert nicht - wird bei nächster Migration erstellt');
    }

    console.log('🎉 Fehlende Spalten korrigiert!');
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixMissingColumns().catch((e) => {
  console.error(e);
  process.exit(1);
});
