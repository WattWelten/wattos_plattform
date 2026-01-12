/**
 * KPI Service Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { KpiService } from './kpi.service';
import { PrismaService } from '@wattweiser/db';

describe('KpiService', () => {
  let service: KpiService;
  let prisma: PrismaService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  const mockPrismaClient = {
    conversation: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    conversationMessage: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    feedback: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    answerSource: {
      findMany: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
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
    
    // Mock ist bereits über DI gesetzt, keine manuelle Zuweisung nötig
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getKpis', () => {
    it('should calculate all KPIs for a tenant', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      const range = '7d' as const;

      // Mock Prisma responses - Reihenfolge der Aufrufe:
      // 1. getAnsweredCount
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ answered: 100n }]);
      // 2. getSelfServiceRate
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ rate: 0.85 }]);
      // 3. getFullySolvedCount
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ solved: 80n }]);
      // 4. getTimeSaved - benötigt tenant config (wird 2x aufgerufen)
      mockPrismaClient.tenant.findUnique
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
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ after_hours_pct: 25 }]);
      // 6. getTopTopics
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([
        { topic: 'test', count: 10n },
        { topic: 'other', count: 5n },
      ]);
      // 7. getCoverageRate
      mockPrismaClient.$queryRawUnsafe.mockResolvedValueOnce([
        { good_count: 90n, total_count: 100n },
      ]);
      // 8. getP95Latency
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ p95: 500 }]);
      // 9. getCsat
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ csat: 4.5 }]);

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
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ answered: 0n }]);
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ rate: 0 }]);
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ solved: 0n }]);
      mockPrismaClient.tenant.findUnique
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
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ after_hours_pct: 0 }]);
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([]);
      mockPrismaClient.$queryRawUnsafe.mockResolvedValueOnce([
        { good_count: 0n, total_count: 0n },
      ]);
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ p95: 0 }]);
      mockPrismaClient.$queryRaw.mockResolvedValueOnce([{ csat: 0 }]);

      await service.getKpis(tenantId, 'today');

      // Verify that $queryRaw was called (for getAnsweredCount)
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    });
  });
});
