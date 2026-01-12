/**
 * KPI Service Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { KpiService } from './kpi.service';
import { PrismaService } from '@wattweiser/db';

describe('KpiService', () => {
  let service: KpiService;
  let prisma: PrismaService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  const mockPrismaClient = {
    conversation: {
      count: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    conversationMessage: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    feedback: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    },
    answerSource: {
      findMany: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
  };

  // Erstelle Mock als vollständiges PrismaService-ähnliches Objekt
  const createMockPrismaService = () => ({
    client: mockPrismaClient,
    get prisma() {
      return mockPrismaClient;
    },
  });

  beforeEach(async () => {
    mockPrismaService = createMockPrismaService();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<KpiService>(KpiService);
    prisma = module.get<PrismaService>(PrismaService);
    
    // Stelle sicher, dass PrismaService korrekt injiziert wurde
    if (!service['prisma']) {
      service['prisma'] = mockPrismaService as any;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getKpis', () => {
    it('should calculate all KPIs for a tenant', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      const range = '7d' as const;

      // Mock Prisma responses - Reihenfolge der Aufrufe:
      // 1. getAnsweredCount
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ answered: 100n }]);
      // 2. getSelfServiceRate
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ rate: 0.85 }]);
      // 3. getFullySolvedCount
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ solved: 80n }]);
      // 4. getTimeSaved - benötigt tenant config (wird 2x aufgerufen)
      vi.mocked(mockPrismaClient.tenant.findUnique)
        .mockResolvedValueOnce({
          id: tenantId,
          officeHoursOpen: 8,
          officeHoursClose: 17,
          avgHandleTimeMin: 15,
        } as any)
        .mockResolvedValueOnce({
          id: tenantId,
          officeHoursOpen: 8,
          officeHoursClose: 17,
          avgHandleTimeMin: 15,
        } as any);
      // 5. getAfterHoursPercent
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ after_hours_pct: 25 }]);
      // 6. getTopTopics
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([
        { topic: 'test', count: 10n },
        { topic: 'other', count: 5n },
      ]);
      // 7. getCoverageRate
      vi.mocked(mockPrismaClient.$queryRawUnsafe).mockResolvedValueOnce([
        { good_count: 90n, total_count: 100n },
      ]);
      // 8. getP95Latency
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ p95: 500 }]);
      // 9. getCsat
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ csat: 4.5 }]);

      const result = await service.getKpis(tenantId, range);

      expect(result).toBeDefined();
      expect(result.answered).toBeGreaterThanOrEqual(0);
      expect(result.selfServiceRate).toBeGreaterThanOrEqual(0);
      expect(result.fullySolved).toBeGreaterThanOrEqual(0);
      expect(result.timeSavedHours).toBeGreaterThanOrEqual(0);
      expect(result.fteSaved).toBeGreaterThanOrEqual(0);
      expect(result.afterHoursPercent).toBeGreaterThanOrEqual(0);
      expect(result.topTopics).toBeInstanceOf(Array);
      expect(result.coverageRate).toBeGreaterThanOrEqual(0);
      expect(result.p95LatencyMs).toBeGreaterThanOrEqual(0);
      expect(result.csat).toBeGreaterThanOrEqual(0);
    });

    it('should validate tenant ID format', async () => {
      const invalidTenantId = 'invalid-uuid';

      await expect(service.getKpis(invalidTenantId, '7d')).rejects.toThrow();
    });
  });

  describe('rangeToDates', () => {
    it('should handle today range', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock Prisma responses für "today" range
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ answered: 0n }]);
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ rate: 0 }]);
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ solved: 0n }]);
      vi.mocked(mockPrismaClient.tenant.findUnique)
        .mockResolvedValueOnce({
          id: tenantId,
          officeHoursOpen: 8,
          officeHoursClose: 17,
          avgHandleTimeMin: 15,
        } as any)
        .mockResolvedValueOnce({
          id: tenantId,
          officeHoursOpen: 8,
          officeHoursClose: 17,
          avgHandleTimeMin: 15,
        } as any);
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ after_hours_pct: 0 }]);
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([]);
      vi.mocked(mockPrismaClient.$queryRawUnsafe).mockResolvedValueOnce([
        { good_count: 0n, total_count: 0n },
      ]);
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ p95: 0 }]);
      vi.mocked(mockPrismaClient.$queryRaw).mockResolvedValueOnce([{ csat: 0 }]);

      await service.getKpis(tenantId, 'today');

      // Verify that $queryRaw was called (for getAnsweredCount)
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    });
  });
});
