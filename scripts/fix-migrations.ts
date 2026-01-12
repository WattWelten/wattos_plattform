#!/usr/bin/env tsx
/**
 * Korrigiert fehlende Migrationen
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL nicht gesetzt');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixMigrations() {
  console.log('🔧 Korrigiere fehlende Migrationen...\n');

  try {
    // 1. Prüfe und füge startedAt hinzu
    const hasStartedAt = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Conversation' AND column_name = 'startedAt'
    `);

    if (hasStartedAt.rows.length === 0) {
      console.log('📝 Füge startedAt Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Conversation" 
        ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ startedAt Spalte hinzugefügt\n');
    } else {
      console.log('✅ startedAt Spalte bereits vorhanden\n');
    }

    // 2. Prüfe und füge sessionId hinzu
    const hasSessionId = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Conversation' AND column_name = 'sessionId'
    `);

    if (hasSessionId.rows.length === 0) {
      console.log('📝 Füge sessionId Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Conversation" 
        ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
      `);
      console.log('✅ sessionId Spalte hinzugefügt\n');
    }

    // 3. Prüfe und füge userAgent hinzu
    const hasUserAgent = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Conversation' AND column_name = 'userAgent'
    `);

    if (hasUserAgent.rows.length === 0) {
      console.log('📝 Füge userAgent Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Conversation" 
        ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
      `);
      console.log('✅ userAgent Spalte hinzugefügt\n');
    }

    // 4. Prüfe und füge channel hinzu
    const hasChannel = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Conversation' AND column_name = 'channel'
    `);

    if (hasChannel.rows.length === 0) {
      console.log('📝 Füge channel Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Conversation" 
        ADD COLUMN IF NOT EXISTS "channel" TEXT;
      `);
      console.log('✅ channel Spalte hinzugefügt\n');
    }

    // 5. Prüfe und füge assistantId hinzu
    const hasAssistantId = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Conversation' AND column_name = 'assistantId'
    `);

    if (hasAssistantId.rows.length === 0) {
      console.log('📝 Füge assistantId Spalte hinzu...');
      await pool.query(`
        ALTER TABLE "Conversation" 
        ADD COLUMN IF NOT EXISTS "assistantId" TEXT;
      `);
      console.log('✅ assistantId Spalte hinzugefügt\n');
    }

    // 6. Erstelle Index für startedAt
    console.log('📝 Erstelle Index für startedAt...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "Conversation_startedAt_idx" ON "Conversation"("startedAt");
    `);
    console.log('✅ Index erstellt\n');

    // 7. Prüfe und füge solved Spalte zu ConversationMessage hinzu
    const hasSolved = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ConversationMessage' AND column_name = 'solved'
    `);

    if (hasSolved.rows.length === 0) {
      console.log('📝 Füge solved Spalte zu ConversationMessage hinzu...');
      await pool.query(`
        ALTER TABLE "ConversationMessage" 
        ADD COLUMN IF NOT EXISTS "solved" BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('✅ solved Spalte hinzugefügt\n');
    }

    // 8. Prüfe weitere ConversationMessage Spalten
    const messageColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ConversationMessage'
    `);
    const messageColumnNames = messageColumns.rows.map(r => r.column_name);

    const requiredColumns = [
      { name: 'latencyMs', type: 'INTEGER' },
      { name: 'sourcesJsonb', type: 'JSONB' },
      { name: 'lang', type: 'TEXT' },
      { name: 'meta', type: 'JSONB' },
      { name: 'tokensIn', type: 'INTEGER' },
      { name: 'tokensOut', type: 'INTEGER' },
      { name: 'costCents', type: 'INTEGER' },
      { name: 'model', type: 'TEXT' },
    ];

    for (const col of requiredColumns) {
      if (!messageColumnNames.includes(col.name)) {
        console.log(`📝 Füge ${col.name} Spalte hinzu...`);
        await pool.query(`
          ALTER TABLE "ConversationMessage" 
          ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};
        `);
        console.log(`✅ ${col.name} Spalte hinzugefügt`);
      }
    }
    console.log('');

    // 9. Prüfe ob Feedback und Event Tabellen existieren
    const feedbackTable = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'Feedback'
    `);
    
    const eventTable = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'Event'
    `);

    // 10. Erstelle nur die Views, die funktionieren
    const views = await pool.query(`
      SELECT viewname
      FROM pg_views
      WHERE viewname LIKE 'vw_kpi_%'
    `);

    if (views.rows.length === 0) {
      console.log('📊 Erstelle KPI Views (vereinfacht)...');
      
      // View 1: vw_kpi_answered
      await pool.query(`
        CREATE OR REPLACE VIEW vw_kpi_answered AS
        SELECT 
          i."tenantId" AS tenant_id,
          date_trunc('day', a."createdAt") AS d,
          count(*) AS answered
        FROM "ConversationMessage" a
        JOIN "Conversation" i ON i.id = a."conversationId"
        WHERE a.role = 'assistant'
        GROUP BY 1, 2;
      `);
      console.log('✅ vw_kpi_answered erstellt');

      // View 2: vw_kpi_self_service (nur wenn solved existiert)
      await pool.query(`
        CREATE OR REPLACE VIEW vw_kpi_self_service AS
        SELECT 
          i."tenantId" AS tenant_id,
          date_trunc('day', a."createdAt") AS d,
          avg(CASE WHEN a.solved THEN 1.0 ELSE 0.0 END) AS self_service_rate,
          count(*) AS total_answers,
          sum(CASE WHEN a.solved THEN 1 ELSE 0 END) AS solved_count
        FROM "ConversationMessage" a
        JOIN "Conversation" i ON i.id = a."conversationId"
        WHERE a.role = 'assistant'
        GROUP BY 1, 2;
      `);
      console.log('✅ vw_kpi_self_service erstellt');

      // View 3: vw_kpi_p95_latency (nur wenn latencyMs existiert)
      await pool.query(`
        CREATE OR REPLACE VIEW vw_kpi_p95_latency AS
        SELECT 
          i."tenantId" AS tenant_id,
          date_trunc('day', a."createdAt") AS d,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY a."latencyMs") AS p95_latency,
          avg(a."latencyMs") AS avg_latency,
          min(a."latencyMs") AS min_latency,
          max(a."latencyMs") AS max_latency
        FROM "ConversationMessage" a
        JOIN "Conversation" i ON i.id = a."conversationId"
        WHERE a.role = 'assistant' AND a."latencyMs" IS NOT NULL
        GROUP BY 1, 2;
      `);
      console.log('✅ vw_kpi_p95_latency erstellt');

      // Weitere Views nur wenn Tabellen existieren
      if (feedbackTable.rows.length > 0) {
        // Prüfe ob Feedback tenantId hat
        const feedbackColumns = await pool.query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'Feedback'
        `);
        const hasTenantId = feedbackColumns.rows.some(r => r.column_name === 'tenantId');
        
        if (hasTenantId) {
          await pool.query(`
            CREATE OR REPLACE VIEW vw_kpi_csat AS
            SELECT 
              "tenantId" AS tenant_id,
              date_trunc('day', "createdAt") AS d,
              round(avg(CASE
                WHEN type IN ('STAR5', 'UP') THEN 5
                WHEN type = 'STAR4' THEN 4
                WHEN type = 'STAR3' THEN 3
                WHEN type = 'STAR2' THEN 2
                WHEN type IN ('STAR1', 'DOWN') THEN 1
                ELSE NULL
              END)::numeric, 2) AS csat,
              count(*) AS feedback_count
            FROM "Feedback"
            WHERE type IS NOT NULL
            GROUP BY 1, 2;
          `);
          console.log('✅ vw_kpi_csat erstellt');
        }
      }

      console.log('\n✅ KPI Views erstellt\n');
    } else {
      console.log(`✅ ${views.rows.length} KPI Views bereits vorhanden\n`);
    }

    // 8. Prüfe Enums
    const enums = await pool.query(`
      SELECT typname
      FROM pg_type
      WHERE typname IN ('RoleType', 'FeedbackType', 'SourceType', 'Channel')
    `);

    console.log(`📊 Enums: ${enums.rows.length} gefunden`);
    if (enums.rows.length < 4) {
      console.log('⚠️  Einige Enums fehlen - werden bei nächster Migration erstellt');
    }

    console.log('\n🎉 Migrationen korrigiert!');
    
  } catch (error: any) {
    console.error('❌ Fehler:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

fixMigrations().catch((e) => {
  console.error(e);
  process.exit(1);
});
