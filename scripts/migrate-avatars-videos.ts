#!/usr/bin/env tsx
/**
 * Migration Script für Avatar und Video Tabellen
 * 
 * Führt die Migration 20250131000000_add_avatars_videos aus
 */

// Lade .env Datei bevor PrismaClient instanziiert wird
import 'dotenv/config';

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gesetzt. Bitte .env Datei prüfen.');
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({ 
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });
  
  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Verbindung zur Datenbank fehlgeschlagen!');
    console.error(`   Fehler: ${errorMessage}`);
    console.error('\n💡 Mögliche Lösungen:');
    console.error('   1. Starte PostgreSQL: docker compose up -d postgres');
    console.error('   2. Oder starte lokalen PostgreSQL Service');
    console.error('   3. Prüfe DATABASE_URL in .env Datei');
    process.exit(1);
  }

  try {
    console.log('🔄 Starte Migration: Avatar und Video Tabellen...\n');

    // Lese Migration-Datei
    const migrationPath = path.join(
      __dirname,
      '..',
      'packages',
      'db',
      'migrations',
      '20250131000000_add_avatars_videos',
      'migration.sql',
    );

    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration-Datei nicht gefunden: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Prüfe ob Tabellen bereits existieren
    const checkAvatar = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Avatar')",
    );
    const checkVideo = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Video')",
    );

    if (checkAvatar.rows[0].exists && checkVideo.rows[0].exists) {
      console.log('✅ Tabellen Avatar und Video existieren bereits. Migration übersprungen.');
      return;
    }

    // Führe Migration aus
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');

    console.log('✅ Migration erfolgreich ausgeführt!');
    console.log('   - Tabelle "Avatar" erstellt');
    console.log('   - Tabelle "Video" erstellt');
    console.log('   - Indizes erstellt');
    console.log('   - Foreign Keys erstellt\n');

    // Verifiziere Tabellen
    const verifyAvatar = await client.query(
      "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_name = 'Avatar'",
    );
    const verifyVideo = await client.query(
      "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_name = 'Video'",
    );

    console.log(`📊 Avatar Tabelle: ${verifyAvatar.rows[0].count} Spalten`);
    console.log(`📊 Video Tabelle: ${verifyVideo.rows[0].count} Spalten\n`);

    console.log('✅ Migration abgeschlossen!');
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        // Ignore rollback errors
      }
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Migration fehlgeschlagen: ${errorMessage}`);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 Fertig!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unerwarteter Fehler:', error);
    process.exit(1);
  });
