/**
 * KPI Cache Service Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { KpiCacheService } from './kpi-cache.service';
import { CacheService } from '@wattweiser/shared';

describe('KpiCacheService', () => {
  let service: KpiCacheService;
  let mockCacheService: {
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockCacheService = {
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KpiCacheService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<KpiCacheService>(KpiCacheService);
  });

  describe('invalidateTenantCache', () => {
    it('should invalidate cache for all ranges', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';

      await service.invalidateTenantCache(tenantId);

      expect(mockCacheService.delete).toHaveBeenCalledTimes(3);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`kpi:${tenantId}:today`);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`kpi:${tenantId}:7d`);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`kpi:${tenantId}:30d`);
    });

    it('should handle errors gracefully', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      mockCacheService.delete.mockRejectedValueOnce(new Error('Cache error'));

      await expect(service.invalidateTenantCache(tenantId)).resolves.not.toThrow();
    });
  });

  describe('invalidateTenantRangeCache', () => {
    it('should invalidate cache for specific range', async () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      const range = '7d' as const;

      await service.invalidateTenantRangeCache(tenantId, range);

      expect(mockCacheService.delete).toHaveBeenCalledWith(`kpi:${tenantId}:${range}`);
    });
  });
});
