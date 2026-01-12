/**
 * KPI Metrics Service Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { KpiMetricsService } from './kpi-metrics.service';
import { KpiService } from './kpi.service';
import { PrismaService } from '@wattweiser/db';

describe('KpiMetricsService', () => {
  let service: KpiMetricsService;
  let mockKpiService: {
    getKpis: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockKpiService = {
      getKpis: jest.fn().mockResolvedValue({
        answered: 100,
        selfServiceRate: 0.85,
        fullySolved: 80,
        timeSavedHours: 20,
        fteSaved: 0.125,
        afterHoursPercent: 25,
        topTopics: [],
        coverageRate: 80,
        p95LatencyMs: 500,
        csat: 4.5,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiMetricsService,
        {
          provide: KpiService,
          useValue: mockKpiService,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<KpiMetricsService>(KpiMetricsService);
  });

  describe('exportKpiMetrics', () => {
    it('should export KPI metrics', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      const range = '7d' as const;

      const result = await service.exportKpiMetrics(tenantId, range);

      expect(result).toBeDefined();
      expect(result['kpi.answered']).toBe(100);
      expect(result['kpi.self_service_rate']).toBe(0.85);
      expect(result['kpi.csat']).toBe(4.5);
    });
  });

  describe('checkAlerts', () => {
    it('should return alerts for low CSAT', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      mockKpiService.getKpis.mockResolvedValueOnce({
        answered: 100,
        selfServiceRate: 0.85,
        fullySolved: 80,
        timeSavedHours: 20,
        fteSaved: 0.125,
        afterHoursPercent: 25,
        topTopics: [],
        coverageRate: 80,
        p95LatencyMs: 500,
        csat: 2.5, // Low CSAT
      });

      const alerts = await service.checkAlerts(tenantId);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toContain('CSAT kritisch');
    });

    it('should return alerts for high latency', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      mockKpiService.getKpis.mockResolvedValueOnce({
        answered: 100,
        selfServiceRate: 0.85,
        fullySolved: 80,
        timeSavedHours: 20,
        fteSaved: 0.125,
        afterHoursPercent: 25,
        topTopics: [],
        coverageRate: 80,
        p95LatencyMs: 6000, // High latency
        csat: 4.5,
      });

      const alerts = await service.checkAlerts(tenantId);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toContain('P95 Latenz');
    });
  });
});
