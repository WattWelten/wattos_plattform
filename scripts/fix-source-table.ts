#!/usr/bin/env tsx
/**
 * Prüft und korrigiert Source-Tabelle
 */

import 'dotenv/config';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gesetzt');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function fixSourceTable() {
  console.log('🔧 Prüfe Source-Tabelle...\n');

  try {
    // Prüfe Spalten
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Source'
      ORDER BY ordinal_position
    `);
    
    const columnNames = columns.rows.map(r => r.column_name);
    console.log('Source Spalten:', columnNames.join(', '));

    // Füge spaceId hinzu falls fehlt
    if (!columnNames.includes('spaceId')) {
      console.log('📝 Füge spaceId Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Source" 
        ADD COLUMN IF NOT EXISTS "spaceId" TEXT;
      `);
      console.log('✅ spaceId Spalte hinzugefügt');
      
      // Erstelle Index
      await pool.query(`
        CREATE INDEX IF NOT EXISTS "Source_spaceId_idx" ON "Source"("spaceId");
      `);
      console.log('✅ Index erstellt');
    } else {
      console.log('✅ spaceId Spalte bereits vorhanden');
    }

    // Füge config hinzu falls fehlt
    if (!columnNames.includes('config')) {
      console.log('📝 Füge config Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Source" 
        ADD COLUMN IF NOT EXISTS "config" JSONB DEFAULT '{}';
      `);
      console.log('✅ config Spalte hinzugefügt');
    } else {
      console.log('✅ config Spalte bereits vorhanden');
    }

    // Füge status hinzu falls fehlt
    if (!columnNames.includes('status')) {
      console.log('📝 Füge status Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Source" 
        ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
      `);
      console.log('✅ status Spalte hinzugefügt');
    }

    console.log('\n🎉 Source-Tabelle korrigiert!');
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixSourceTable().catch((e) => {
  console.error(e);
  process.exit(1);
});
