/**
 * KPI Event Handler Service Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { KpiEventHandlerService } from './kpi-event-handler.service';
import { PrismaService } from '@wattweiser/db';
import { KpiCacheService } from './kpi-cache.service';

describe('KpiEventHandlerService', () => {
  let service: KpiEventHandlerService;
  let mockPrismaService: {
    client: {
      conversation: {
        findUnique: ReturnType<typeof vi.fn>;
      };
    };
  };
  let mockKpiCacheService: {
    invalidateTenantCache: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockPrismaService = {
      client: {
        conversation: {
          findUnique: jest.fn(),
        },
      },
    };

    mockKpiCacheService = {
      invalidateTenantCache: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiEventHandlerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: KpiCacheService,
          useValue: mockKpiCacheService,
        },
      ],
    }).compile();

    service = module.get<KpiEventHandlerService>(KpiEventHandlerService);
  });

  describe('invalidateCacheForTenant', () => {
    it('should invalidate cache for tenant', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';

      await service.invalidateCacheForTenant(tenantId);

      expect(mockKpiCacheService.invalidateTenantCache).toHaveBeenCalledWith(tenantId);
    });

    it('should handle errors gracefully', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      mockKpiCacheService.invalidateTenantCache.mockRejectedValueOnce(new Error('Cache error'));

      await expect(service.invalidateCacheForTenant(tenantId)).resolves.not.toThrow();
    });
  });
});
