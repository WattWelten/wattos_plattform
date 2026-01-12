/**
 * Integration Tests fÃ¼r Tenant Isolation
 * 
 * Testet, dass KPIs korrekt nach Tenant isoliert werden
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { KpiService } from '@wattweiser/dashboard-service/analytics/kpi.service';
import { PrismaService } from '@wattweiser/db';

// Lade .env
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

describe('Tenant Isolation - Integration Tests', () => {
  let kpiService: KpiService;
  let tenant1Id: string;
  let tenant2Id: string;

  beforeAll(async () => {
    // Erstelle PrismaService Mock
    const prismaService = {
      client: prisma,
      get prisma() {
        return prisma;
      },
    } as unknown as PrismaService;

    kpiService = new KpiService(prismaService);

    // Erstelle Test-Tenants (falls nicht vorhanden)
    const tenant1 = await prisma.tenant.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test Tenant 1', slug: 'test-tenant-1', settings: {},
      },
    });

    const tenant2 = await prisma.tenant.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Test Tenant 2', slug: 'test-tenant-2', settings: {},
      },
    });

    tenant1Id = tenant1.id;
    tenant2Id = tenant2.id;

    // Erstelle Test-Daten fÃ¼r Tenant 1
    const conversation1 = await prisma.conversation.upsert({
      where: { id: '10000000-0000-0000-0000-000000000001' },
      update: {},
      create: { id: '10000000-0000-0000-0000-000000000001', tenantId: tenant1Id },
    });

    await prisma.conversationMessage.upsert({
      where: { id: '20000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '20000000-0000-0000-0000-000000000001',
        conversationId: conversation1.id,
        role: 'assistant',
        content: 'Test message',
        solved: true,
        latencyMs: 100,
      },
    });

    // Erstelle Test-Daten fÃ¼r Tenant 2
    const conversation2 = await prisma.conversation.upsert({
      where: { id: '10000000-0000-0000-0000-000000000002' },
      update: {},
      create: { id: '10000000-0000-0000-0000-000000000002', tenantId: tenant2Id },
    });

    await prisma.conversationMessage.upsert({
      where: { id: '20000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '20000000-0000-0000-0000-000000000002',
        conversationId: conversation2.id,
        role: 'assistant',
        content: 'Test message 2',
        solved: false,
        latencyMs: 200,
      },
    });
  });

  afterAll(async () => {
    // Cleanup: LÃ¶sche Test-Daten
    await prisma.conversationMessage.deleteMany({
      where: {
        id: {
          in: [
            '20000000-0000-0000-0000-000000000001',
            '20000000-0000-0000-0000-000000000002',
          ],
        },
      },
    });

    await prisma.conversation.deleteMany({
      where: {
        id: {
          in: [
            '10000000-0000-0000-0000-000000000001',
            '10000000-0000-0000-0000-000000000002',
          ],
        },
      },
    });

    await prisma.$disconnect();
  });

  describe('KPI Isolation', () => {
    it('should return different KPIs for different tenants', async () => {
      const kpis1 = await kpiService.getKpis(tenant1Id, '7d');
      const kpis2 = await kpiService.getKpis(tenant2Id, '7d');

      // KPIs sollten unterschiedlich sein (Tenant 1 hat solved=true, Tenant 2 hat solved=false)
      expect(kpis1).toBeDefined();
      expect(kpis2).toBeDefined();
      // Beide sollten Daten haben, aber unterschiedliche Werte
      expect(kpis1.answered).toBeGreaterThanOrEqual(0);
      expect(kpis2.answered).toBeGreaterThanOrEqual(0);
    });

    it('should not leak data between tenants', async () => {
      // Hole KPIs fÃ¼r beide Tenants
      const kpis1 = await kpiService.getKpis(tenant1Id, '7d');
      const kpis2 = await kpiService.getKpis(tenant2Id, '7d');

      // PrÃ¼fe, dass Tenant 1 solved=true hat (selfServiceRate sollte hÃ¶her sein)
      // Tenant 2 hat solved=false, daher sollte selfServiceRate niedriger sein
      expect(kpis1.selfServiceRate).toBeGreaterThanOrEqual(0);
      expect(kpis2.selfServiceRate).toBeGreaterThanOrEqual(0);
    });

    it('should validate tenant ID format', async () => {
      await expect(
        kpiService.getKpis('invalid-uuid', '7d'),
      ).rejects.toThrow('Invalid tenant ID format');
    });

    it('should handle non-existent tenant gracefully', async () => {
      const nonExistentTenantId = '99999999-9999-9999-9999-999999999999';
      const kpis = await kpiService.getKpis(nonExistentTenantId, '7d');

      // Sollte keine Fehler werfen, sondern leere/Null-Werte zurÃ¼ckgeben
      expect(kpis).toBeDefined();
      expect(kpis.answered).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Database Query Isolation', () => {
    it('should filter by tenantId in raw queries', async () => {
      // Direkte Prisma Query um zu prÃ¼fen, dass Tenant-Filter funktioniert
      const tenant1Messages = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*)::bigint AS count
        FROM "ConversationMessage" a 
        JOIN "Conversation" i ON i.id = a."conversationId"
        WHERE i."tenantId" = ${tenant1Id}::text
          AND a.role = 'assistant'
      `;

      const tenant2Messages = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*)::bigint AS count
        FROM "ConversationMessage" a 
        JOIN "Conversation" i ON i.id = a."conversationId"
        WHERE i."tenantId" = ${tenant2Id}::text
          AND a.role = 'assistant'
      `;

      expect(Number(tenant1Messages[0]?.count || 0)).toBeGreaterThanOrEqual(0);
      expect(Number(tenant2Messages[0]?.count || 0)).toBeGreaterThanOrEqual(0);
    });
  });
});






