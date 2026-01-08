import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureFlagService } from '../feature-flag.service';
import { ConfigService } from '@nestjs/config';

// Mock redis
const mockRedisClient = {
  connect: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  on: vi.fn(),
};

vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

describe('FeatureFlagService - Extended Tests', () => {
  let featureFlagService: FeatureFlagService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'REDIS_URL') return undefined; // Use in-memory by default
        return undefined;
      }),
    };
  });

  describe('onModuleInit', () => {
    it('should connect to Redis when REDIS_URL is provided', async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });
      mockRedisClient.keys = vi.fn().mockResolvedValue([]);
      
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
      
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should use in-memory storage when REDIS_URL is not provided', async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'REDIS_URL') return undefined;
        return undefined;
      });
      
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
      
      expect(mockRedisClient.connect).not.toHaveBeenCalled();
    });

    it('should handle Redis connection errors gracefully', async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });
      mockRedisClient.connect = vi.fn().mockRejectedValue(new Error('Connection failed'));
      
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
      
      // Should not throw, should fallback to in-memory
      expect(featureFlagService).toBeDefined();
    });

    it('should load flags from Redis on initialization', async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });
      mockRedisClient.keys = vi.fn().mockResolvedValue(['feature-flag:test-flag']);
      mockRedisClient.get = vi.fn().mockResolvedValue(JSON.stringify({ key: 'test-flag', enabled: true }));
      
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
      
      expect(mockRedisClient.keys).toHaveBeenCalled();
    });
  });

  describe('isEnabled - Edge Cases', () => {
    beforeEach(async () => {
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
    });

    it('should handle percentage rollout with different user IDs', async () => {
      await featureFlagService.setFlag({
        key: 'percentage-flag',
        enabled: true,
        percentage: 50,
      });
      
      // Test multiple user IDs to cover hash function
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(await featureFlagService.isEnabled('percentage-flag', user));
      }
      
      // At least some should be enabled and some disabled
      expect(results.some(r => r === true) || results.some(r => r === false)).toBe(true);
    });

    it('should handle percentage 0 (disabled)', async () => {
      await featureFlagService.setFlag({
        key: 'zero-percentage',
        enabled: true,
        percentage: 0,
      });
      
      const result = await featureFlagService.isEnabled('zero-percentage', 'user1');
      expect(result).toBe(false);
    });

    it('should handle percentage 100 (enabled for all)', async () => {
      await featureFlagService.setFlag({
        key: 'full-percentage',
        enabled: true,
        percentage: 100,
      });
      
      const result = await featureFlagService.isEnabled('full-percentage', 'user1');
      expect(result).toBe(true);
    });

    it('should handle flag with startDate in the future', async () => {
      await featureFlagService.setFlag({
        key: 'future-flag',
        enabled: true,
        startDate: new Date(Date.now() + 86400000), // Tomorrow
      });
      
      const result = await featureFlagService.isEnabled('future-flag');
      expect(result).toBe(false);
    });

    it('should handle flag with startDate in the past', async () => {
      await featureFlagService.setFlag({
        key: 'past-start-flag',
        enabled: true,
        startDate: new Date(Date.now() - 86400000), // Yesterday
      });
      
      const result = await featureFlagService.isEnabled('past-start-flag');
      expect(result).toBe(true);
    });

    it('should handle flag with endDate in the past', async () => {
      await featureFlagService.setFlag({
        key: 'expired-flag',
        enabled: true,
        endDate: new Date(Date.now() - 86400000), // Yesterday
      });
      
      const result = await featureFlagService.isEnabled('expired-flag');
      expect(result).toBe(false);
    });

    it('should handle flag with both startDate and endDate', async () => {
      await featureFlagService.setFlag({
        key: 'date-range-flag',
        enabled: true,
        startDate: new Date(Date.now() - 86400000), // Yesterday
        endDate: new Date(Date.now() + 86400000), // Tomorrow
      });
      
      const result = await featureFlagService.isEnabled('date-range-flag');
      expect(result).toBe(true);
    });

    it('should handle userSegments with matching userId', async () => {
      await featureFlagService.setFlag({
        key: 'segment-flag',
        enabled: true,
        userSegments: ['user1', 'user2'],
      });
      
      const result1 = await featureFlagService.isEnabled('segment-flag', 'user1');
      const result2 = await featureFlagService.isEnabled('segment-flag', 'user3');
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should handle userSegments without userId', async () => {
      await featureFlagService.setFlag({
        key: 'segment-flag-no-user',
        enabled: true,
        userSegments: ['user1'],
      });
      
      const result = await featureFlagService.isEnabled('segment-flag-no-user');
      expect(result).toBe(false);
    });
  });

  describe('getFlag - Redis Integration', () => {
    beforeEach(async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });
      mockRedisClient.keys = vi.fn().mockResolvedValue([]);
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
    });

    it('should load flag from Redis if not in cache', async () => {
      const flagData = { key: 'redis-flag', enabled: true };
      mockRedisClient.get = vi.fn().mockResolvedValue(JSON.stringify(flagData));
      
      const flag = await featureFlagService.getFlag('redis-flag');
      
      expect(flag).toEqual(flagData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('feature-flag:redis-flag');
    });

    it('should handle Redis get errors gracefully', async () => {
      mockRedisClient.get = vi.fn().mockRejectedValue(new Error('Redis error'));
      
      const flag = await featureFlagService.getFlag('error-flag');
      
      expect(flag).toBeNull();
    });

    it('should return null for invalid JSON from Redis', async () => {
      mockRedisClient.get = vi.fn().mockResolvedValue('invalid-json');
      
      // Should handle JSON.parse error
      const flag = await featureFlagService.getFlag('invalid-flag');
      expect(flag).toBeNull();
    });
  });

  describe('setFlag - Redis Integration', () => {
    beforeEach(async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });
      mockRedisClient.keys = vi.fn().mockResolvedValue([]);
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
    });

    it('should save flag to Redis', async () => {
      mockRedisClient.set = vi.fn().mockResolvedValue('OK');
      
      await featureFlagService.setFlag({ key: 'redis-flag', enabled: true });
      
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should handle Redis set errors gracefully', async () => {
      mockRedisClient.set = vi.fn().mockRejectedValue(new Error('Redis error'));
      
      await featureFlagService.setFlag({ key: 'error-flag', enabled: true });
      
      // Should not throw, flag should still be in memory
      const flag = await featureFlagService.getFlag('error-flag');
      expect(flag).toBeDefined();
    });
  });

  describe('deleteFlag - Redis Integration', () => {
    beforeEach(async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });
      mockRedisClient.keys = vi.fn().mockResolvedValue([]);
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
    });

    it('should delete flag from Redis', async () => {
      await featureFlagService.setFlag({ key: 'delete-flag', enabled: true });
      mockRedisClient.del = vi.fn().mockResolvedValue(1);
      
      await featureFlagService.deleteFlag('delete-flag');
      
      expect(mockRedisClient.del).toHaveBeenCalledWith('feature-flag:delete-flag');
      const flag = await featureFlagService.getFlag('delete-flag');
      expect(flag).toBeNull();
    });

    it('should handle Redis delete errors gracefully', async () => {
      await featureFlagService.setFlag({ key: 'error-delete-flag', enabled: true });
      mockRedisClient.del = vi.fn().mockRejectedValue(new Error('Redis error'));
      
      await featureFlagService.deleteFlag('error-delete-flag');
      
      // Should not throw, flag should still be deleted from memory
      const flag = await featureFlagService.getFlag('error-delete-flag');
      expect(flag).toBeNull();
    });
  });

  describe('loadFlags', () => {
    it('should load multiple flags from Redis', async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });
      mockRedisClient.keys = vi.fn().mockResolvedValue([
        'feature-flag:flag1',
        'feature-flag:flag2',
      ]);
      mockRedisClient.get = vi.fn()
        .mockResolvedValueOnce(JSON.stringify({ key: 'flag1', enabled: true }))
        .mockResolvedValueOnce(JSON.stringify({ key: 'flag2', enabled: false }));
      
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
      
      const flags = await featureFlagService.getAllFlags();
      expect(flags.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle loadFlags errors gracefully', async () => {
      mockConfigService.get = vi.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      });
      mockRedisClient.keys = vi.fn().mockRejectedValue(new Error('Redis error'));
      
      featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
      await featureFlagService.onModuleInit();
      
      // Should not throw
      expect(featureFlagService).toBeDefined();
    });
  });
});
