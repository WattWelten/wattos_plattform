#!/usr/bin/env tsx
/**
 * Performance-Test für KPI-Queries
 * 
 * Misst Latenz und Durchsatz der KPI-Berechnungen
 */

import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Prisma 7.2.0+: URL wird aus DATABASE_URL oder prisma.config.js gelesen
const prisma = new PrismaClient();

async function testKpiPerformance() {
  console.log('🚀 Starte KPI Performance-Test...\n');

  const tenantId = process.env.TEST_TENANT_ID || 'musterlandkreis';
  const iterations = 10;

  const results = {
    answered: [] as number[],
    selfService: [] as number[],
    p95Latency: [] as number[],
    csat: [] as number[],
  };

  for (let i = 0; i < iterations; i++) {
    // Test: Anzahl beantworteter Anfragen
    const start1 = Date.now();
    await prisma.$queryRaw`
      SELECT count(*)::int AS answered 
      FROM "ConversationMessage" a 
      JOIN "Conversation" i ON i.id = a."conversationId"
      WHERE i."tenantId" = ${tenantId}::uuid
        AND a.role = 'assistant'
    `;
    results.answered.push(Date.now() - start1);

    // Test: Self-Service-Quote
    const start2 = Date.now();
    await prisma.$queryRaw`
      SELECT coalesce(avg(CASE WHEN a.solved THEN 1 ELSE 0 END), 0) AS rate
      FROM "ConversationMessage" a 
      JOIN "Conversation" i ON i.id = a."conversationId"
      WHERE i."tenantId" = ${tenantId}::uuid
        AND a.role = 'assistant'
    `;
    results.selfService.push(Date.now() - start2);

    // Test: P95 Latenz
    const start3 = Date.now();
    await prisma.$queryRaw`
      SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY a."latencyMs") AS p95
      FROM "ConversationMessage" a 
      JOIN "Conversation" i ON i.id = a."conversationId"
      WHERE i."tenantId" = ${tenantId}::uuid
        AND a.role = 'assistant'
    `;
    results.p95Latency.push(Date.now() - start3);

    // Test: CSAT
    const start4 = Date.now();
    await prisma.$queryRaw`
      SELECT round(avg(CASE
        WHEN type IN ('STAR5', 'UP') THEN 5
        WHEN type = 'STAR4' THEN 4
        WHEN type = 'STAR3' THEN 3
        WHEN type = 'STAR2' THEN 2
        WHEN type IN ('STAR1', 'DOWN') THEN 1
      END)::numeric, 2) AS csat
      FROM "Feedback"
      WHERE "tenantId" = ${tenantId}::uuid
    `;
    results.csat.push(Date.now() - start4);
  }

  // Berechne Statistiken
  const calculateStats = (values: number[]) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const p95 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)];

    return { avg, min, max, p95 };
  };

  console.log('📊 Performance-Ergebnisse:\n');
  console.log('Anzahl beantworteter Anfragen:');
  console.log(calculateStats(results.answered));
  console.log('\nSelf-Service-Quote:');
  console.log(calculateStats(results.selfService));
  console.log('\nP95 Latenz:');
  console.log(calculateStats(results.p95Latency));
  console.log('\nCSAT:');
  console.log(calculateStats(results.csat));

  await prisma.$disconnect();
}

testKpiPerformance().catch((e) => {
  console.error(e);
  process.exit(1);
});
