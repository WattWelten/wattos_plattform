#!/usr/bin/env tsx
/**
 * Erstellt fehlende Enums in der Datenbank
 */

import 'dotenv/config';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gesetzt');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function createEnums() {
  console.log('🔧 Erstelle fehlende Enums...\n');

  try {
    // Prüfe welche Enums existieren
    const existingEnums = await pool.query(`
      SELECT typname
      FROM pg_type
      WHERE typname IN ('RoleType', 'FeedbackType', 'SourceType', 'Channel')
    `);
    const existingEnumNames = existingEnums.rows.map(r => r.typname);
    console.log('Vorhandene Enums:', existingEnumNames.join(', ') || 'Keine');

    // Erstelle RoleType Enum
    if (!existingEnumNames.includes('RoleType')) {
      console.log('📝 Erstelle RoleType Enum...');
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE "RoleType" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✅ RoleType Enum erstellt');
    }

    // Erstelle FeedbackType Enum
    if (!existingEnumNames.includes('FeedbackType')) {
      console.log('📝 Erstelle FeedbackType Enum...');
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE "FeedbackType" AS ENUM ('STAR1', 'STAR2', 'STAR3', 'STAR4', 'STAR5', 'UP', 'DOWN');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✅ FeedbackType Enum erstellt');
    }

    // Erstelle SourceType Enum
    if (!existingEnumNames.includes('SourceType')) {
      console.log('📝 Erstelle SourceType Enum...');
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE "SourceType" AS ENUM ('FILE', 'WEBSITE', 'WEBDAV', 'SHAREPOINT', 'ONEDRIVE', 'GDRIVE', 'POSTGRES');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✅ SourceType Enum erstellt');
    }

    // Erstelle Channel Enum
    if (!existingEnumNames.includes('Channel')) {
      console.log('📝 Erstelle Channel Enum...');
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE "Channel" AS ENUM ('WEB', 'AVATAR', 'VIDEO', 'PHONE');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      console.log('✅ Channel Enum erstellt');
    }

    console.log('\n🎉 Enums erstellt!');
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

createEnums().catch((e) => {
  console.error(e);
  process.exit(1);
});
