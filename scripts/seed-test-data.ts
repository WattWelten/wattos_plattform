#!/usr/bin/env tsx
/**
 * Seed Script für Test-Daten (KPI-Tests)
 * 
 * Erstellt realistische Test-Daten für alle 4 Demo-Tenants:
 * - musterlandkreis (public)
 * - musterschule (public)
 * - musterkmu (kmu)
 * - musterklinik (health)
 * 
 * Für jeden Tenant:
 * - 50-100 Conversations mit Messages
 * - 30-50 Feedback-Einträge
 * - Zeitstempel verteilt über: heute, letzte 7 Tage, letzte 30 Tage
 * - Verschiedene Status, Channels, Topics
 */

// Lade .env Datei bevor PrismaClient instanziiert wird
import 'dotenv/config';

import { PrismaClient, Channel, FeedbackType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7.2.0+: DATABASE_URL wird aus .env geladen (via dotenv/config)
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required. Bitte .env Datei prüfen.');
}

// Prisma 7.2.0+: Erfordert Driver Adapter für PostgreSQL
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Topics für realistische Test-Daten
const TOPICS = [
  'Öffnungszeiten',
  'Anmeldung',
  'Gebühren',
  'Terminvereinbarung',
  'Dokumente',
  'Formulare',
  'Kontakt',
  'Standort',
  'Parkplätze',
  'Barrierefreiheit',
];

const CHANNELS: Channel[] = ['WEB', 'AVATAR', 'VIDEO', 'PHONE'];

/**
 * Generiert zufälliges Datum innerhalb eines Zeitraums
 */
function randomDateInRange(daysAgo: number): Date {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - daysAgo);
  const end = new Date(now);
  
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}

/**
 * Generiert zufällige Latenz (50-2000ms)
 */
function randomLatency(): number {
  return Math.floor(50 + Math.random() * 1950);
}

/**
 * Erstellt Test-Conversations und Messages für einen Tenant
 */
async function seedTenantTestData(tenantId: string, tenantName: string) {
  console.log(`\n📊 Erstelle Test-Daten für Tenant: ${tenantName} (${tenantId})`);

  // Hole Users für diesen Tenant
  const users = await prisma.user.findMany({
    where: { tenantId },
    take: 5, // Nutze bis zu 5 Users
  });

  if (users.length === 0) {
    console.log(`⚠️  Keine Users gefunden für Tenant ${tenantName}. Überspringe...`);
    return;
  }

  const conversations: any[] = [];
  const messages: any[] = [];
  const feedbacks: any[] = [];

  // Erstelle 50-100 Conversations
  const conversationCount = Math.floor(50 + Math.random() * 50);
  console.log(`  Erstelle ${conversationCount} Conversations...`);

  for (let i = 0; i < conversationCount; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];
    
    // Zeitstempel: 30% heute, 40% letzte 7 Tage, 30% letzte 30 Tage
    const rand = Math.random();
    let daysAgo: number;
    if (rand < 0.3) {
      daysAgo = 0; // Heute
    } else if (rand < 0.7) {
      daysAgo = Math.floor(Math.random() * 7); // Letzte 7 Tage
    } else {
      daysAgo = Math.floor(Math.random() * 30); // Letzte 30 Tage
    }

    const startedAt = randomDateInRange(daysAgo);
    const conversationId = crypto.randomUUID();

    conversations.push({
      id: conversationId,
      threadId: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      userId: user.id,
      tenantId,
      channel,
      startedAt,
      metadata: {
        topic: TOPICS[Math.floor(Math.random() * TOPICS.length)],
        source: 'test-seed',
      },
    });

    // Erstelle 2-5 Messages pro Conversation
    const messageCount = Math.floor(2 + Math.random() * 4);
    const solved = Math.random() > 0.3; // 70% gelöst

    for (let j = 0; j < messageCount; j++) {
      const isUser = j % 2 === 0;
      const createdAt = new Date(startedAt.getTime() + j * 1000 * 60); // 1 Minute Abstand

      messages.push({
        id: crypto.randomUUID(),
        conversationId,
        role: isUser ? 'user' : 'assistant',
        content: isUser
          ? `Frage ${j + 1} zu ${TOPICS[Math.floor(Math.random() * TOPICS.length)]}`
          : `Antwort ${j + 1} mit hilfreichen Informationen`,
        latencyMs: isUser ? null : randomLatency(),
        solved: !isUser && j === messageCount - 1 ? solved : false, // Letzte Assistant-Message
        lang: 'de',
        createdAt,
      });

      // Erstelle Feedback für 30% der Assistant-Messages
      if (!isUser && Math.random() < 0.3) {
        const feedbackType: FeedbackType = Math.random() > 0.2 
          ? ['STAR4', 'STAR5'][Math.floor(Math.random() * 2)] as FeedbackType
          : ['STAR1', 'STAR2', 'STAR3'][Math.floor(Math.random() * 3)] as FeedbackType;

        feedbacks.push({
          id: crypto.randomUUID(),
          userId: user.id,
          tenantId,
          queryId: messages[messages.length - 1].id,
          type: feedbackType,
          rating: feedbackType === 'STAR1' ? 1 : feedbackType === 'STAR2' ? 2 : feedbackType === 'STAR3' ? 3 : feedbackType === 'STAR4' ? 4 : 5,
          content: feedbackType.includes('STAR4') || feedbackType.includes('STAR5') 
            ? 'Sehr hilfreich!' 
            : 'Konnte nicht helfen',
          createdAt: new Date(createdAt.getTime() + 1000 * 60), // 1 Minute nach Message
        });
      }
    }
  }

  // Batch-Inserts für Performance
  console.log(`  Füge ${conversations.length} Conversations ein...`);
  await prisma.conversation.createMany({
    data: conversations,
    skipDuplicates: true,
  });

  console.log(`  Füge ${messages.length} Messages ein...`);
  await prisma.conversationMessage.createMany({
    data: messages,
    skipDuplicates: true,
  });

  console.log(`  Füge ${feedbacks.length} Feedback-Einträge ein...`);
  await prisma.feedback.createMany({
    data: feedbacks,
    skipDuplicates: true,
  });

  console.log(`✅ Test-Daten für ${tenantName} erstellt!`);
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log('🌱 Starte Test-Daten-Seeding...\n');

  try {
    // Hole alle Demo-Tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        slug: {
          in: ['musterlandkreis', 'musterschule', 'musterkmu', 'musterklinik'],
        },
      },
    });

    if (tenants.length === 0) {
      console.log('⚠️  Keine Demo-Tenants gefunden. Bitte zuerst seed:tenants ausführen.');
      process.exit(1);
    }

    console.log(`Gefunden: ${tenants.length} Tenants\n`);

    // Erstelle Test-Daten für jeden Tenant
    for (const tenant of tenants) {
      await seedTenantTestData(tenant.id, tenant.name);
    }

    console.log('\n🎉 Test-Daten-Seeding erfolgreich abgeschlossen!');
    console.log('\nNächste Schritte:');
    console.log('  1. Starte Services: pnpm dev:mvp');
    console.log('  2. Öffne Dashboard: http://localhost:3000/de/dashboard');
    console.log('  3. Prüfe KPIs für verschiedene Zeiträume');
  } catch (error) {
    console.error('❌ Fehler beim Seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
