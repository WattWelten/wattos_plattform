#!/usr/bin/env tsx
/**
 * Prüft und korrigiert Feedback-Tabelle
 */

import 'dotenv/config';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gesetzt');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function fixFeedbackTable() {
  console.log('🔧 Prüfe Feedback-Tabelle...\n');

  try {
    // Prüfe ob Feedback-Tabelle existiert
    const tableExists = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'Feedback'
    `);

    if (tableExists.rows.length === 0) {
      console.log('⚠️  Feedback-Tabelle existiert nicht - wird bei nächster Migration erstellt');
      return;
    }

    // Prüfe Spalten
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Feedback'
      ORDER BY ordinal_position
    `);
    
    const columnNames = columns.rows.map(r => r.column_name);
    console.log('Feedback Spalten:', columnNames.join(', '));

    // Füge tenantId hinzu falls fehlt
    if (!columnNames.includes('tenantId')) {
      console.log('📝 Füge tenantId Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Feedback" 
        ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
      `);
      console.log('✅ tenantId Spalte hinzugefügt');
      
      // Erstelle Index
      await pool.query(`
        CREATE INDEX IF NOT EXISTS "Feedback_tenantId_idx" ON "Feedback"("tenantId");
      `);
      console.log('✅ Index erstellt');
    } else {
      console.log('✅ tenantId Spalte bereits vorhanden');
    }

    // Füge queryId hinzu falls fehlt
    if (!columnNames.includes('queryId')) {
      console.log('📝 Füge queryId Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Feedback" 
        ADD COLUMN IF NOT EXISTS "queryId" TEXT;
      `);
      console.log('✅ queryId Spalte hinzugefügt');
    }

    console.log('\n🎉 Feedback-Tabelle korrigiert!');
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixFeedbackTable().catch((e) => {
  console.error(e);
  process.exit(1);
});
