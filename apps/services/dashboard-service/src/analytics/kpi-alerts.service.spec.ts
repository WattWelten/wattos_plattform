/**
 * KPI Alerts Service Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { KpiAlertsService } from './kpi-alerts.service';
import { KpiMetricsService } from './kpi-metrics.service';
import { PrismaService } from '@wattweiser/db';

describe('KpiAlertsService', () => {
  let service: KpiAlertsService;
  let mockKpiMetricsService: {
    checkAlerts: ReturnType<typeof vi.fn>;
  };
  let mockPrismaService: {
    client: {
      tenant: {
        findUnique: ReturnType<typeof vi.fn>;
        findMany: ReturnType<typeof vi.fn>;
      };
    };
  };

  beforeEach(async () => {
    mockKpiMetricsService = {
      checkAlerts: jest.fn().mockResolvedValue([]),
    };

    mockPrismaService = {
      client: {
        tenant: {
          findUnique: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiAlertsService,
        {
          provide: KpiMetricsService,
          useValue: mockKpiMetricsService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<KpiAlertsService>(KpiAlertsService);
  });

  describe('checkTenantAlerts', () => {
    it('should return alerts for tenant', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.client.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        name: 'Test Tenant',
      });
      mockKpiMetricsService.checkAlerts.mockResolvedValue(['CSAT kritisch']);

      const result = await service.checkTenantAlerts(tenantId);

      expect(result).toBeDefined();
      expect(result.tenantId).toBe(tenantId);
      expect(result.alerts).toEqual(['CSAT kritisch']);
    });

    it('should throw error if tenant not found', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      mockPrismaService.client.tenant.findUnique.mockResolvedValue(null);

      await expect(service.checkTenantAlerts(tenantId)).rejects.toThrow('Tenant not found');
    });
  });
});
