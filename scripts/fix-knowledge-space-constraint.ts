#!/usr/bin/env tsx
/**
 * Erstellt Unique Constraint für KnowledgeSpace-Tabelle
 */

import 'dotenv/config';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gesetzt');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function fixKnowledgeSpaceConstraint() {
  console.log('🔧 Prüfe KnowledgeSpace-Tabelle Unique Constraint...\n');

  try {
    // Prüfe vorhandene Constraints
    const constraints = await pool.query(`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'KnowledgeSpace')
    `);
    
    const constraintNames = constraints.rows.map(r => r.conname);
    console.log('Vorhandene Constraints:', constraintNames.join(', ') || 'Keine');

    // Prüfe ob tenantId_name Constraint existiert
    const hasTenantIdNameConstraint = constraintNames.some(name => 
      name.includes('tenantId') && name.includes('name')
    );

    if (!hasTenantIdNameConstraint) {
      console.log('📝 Erstelle Unique Constraint für (tenantId, name)...');
      await pool.query(`
        ALTER TABLE "KnowledgeSpace"
        ADD CONSTRAINT "KnowledgeSpace_tenantId_name_key" UNIQUE ("tenantId", "name");
      `);
      console.log('✅ Unique Constraint erstellt');
    } else {
      console.log('✅ Unique Constraint bereits vorhanden');
    }

    console.log('\n🎉 KnowledgeSpace-Tabelle Constraint korrigiert!');
    
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('✅ Constraint bereits vorhanden');
    } else {
      console.error('❌ Fehler:', error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

fixKnowledgeSpaceConstraint().catch((e) => {
  console.error(e);
  process.exit(1);
});
