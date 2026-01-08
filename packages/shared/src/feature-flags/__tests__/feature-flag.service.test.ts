import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureFlagService } from '../feature-flag.service';
import { ConfigService } from '@nestjs/config';

// Mock redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  })),
}));

describe('FeatureFlagService', () => {
  let featureFlagService: FeatureFlagService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'REDIS_URL') return undefined; // Use in-memory
        return undefined;
      }),
    };

    featureFlagService = new FeatureFlagService(mockConfigService as ConfigService);
  });

  describe('isEnabled', () => {
    it('should return false for non-existent flag', async () => {
      const result = await featureFlagService.isEnabled('non-existent-flag');
      expect(result).toBe(false);
    });

    it('should return true for enabled flag', async () => {
      await featureFlagService.setFlag({
        key: 'test-flag',
        enabled: true,
      });
      const result = await featureFlagService.isEnabled('test-flag');
      expect(result).toBe(true);
    });

    it('should return false for disabled flag', async () => {
      await featureFlagService.setFlag({
        key: 'test-flag',
        enabled: false,
      });
      const result = await featureFlagService.isEnabled('test-flag');
      expect(result).toBe(false);
    });

    it('should respect date range - before start date', async () => {
      await featureFlagService.setFlag({
        key: 'test-flag',
        enabled: true,
        startDate: new Date(Date.now() + 86400000), // Tomorrow
      });
      const result = await featureFlagService.isEnabled('test-flag');
      expect(result).toBe(false);
    });

    it('should respect date range - after end date', async () => {
      await featureFlagService.setFlag({
        key: 'test-flag',
        enabled: true,
        endDate: new Date(Date.now() - 86400000), // Yesterday
      });
      const result = await featureFlagService.isEnabled('test-flag');
      expect(result).toBe(false);
    });

    it('should respect user segments', async () => {
      await featureFlagService.setFlag({
        key: 'test-flag',
        enabled: true,
        userSegments: ['user1', 'user2'],
      });
      const result1 = await featureFlagService.isEnabled('test-flag', 'user1');
      const result2 = await featureFlagService.isEnabled('test-flag', 'user3');
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should respect percentage rollout', async () => {
      await featureFlagService.setFlag({
        key: 'test-flag',
        enabled: true,
        percentage: 50,
      });
      // Percentage rollout requires userId
      const result = await featureFlagService.isEnabled('test-flag');
      expect(result).toBe(false);
    });
  });

  describe('getFlag', () => {
    it('should return flag from cache', async () => {
      await featureFlagService.setFlag({
        key: 'test-flag',
        enabled: true,
      });
      const flag = await featureFlagService.getFlag('test-flag');
      expect(flag).toHaveProperty('key', 'test-flag');
      expect(flag).toHaveProperty('enabled', true);
    });

    it('should return null for non-existent flag', async () => {
      const flag = await featureFlagService.getFlag('non-existent');
      expect(flag).toBeNull();
    });
  });

  describe('setFlag', () => {
    it('should set feature flag', async () => {
      await featureFlagService.setFlag({
        key: 'test-flag',
        enabled: true,
      });
      const flag = await featureFlagService.getFlag('test-flag');
      expect(flag).toHaveProperty('enabled', true);
    });
  });

  describe('deleteFlag', () => {
    it('should delete feature flag', async () => {
      await featureFlagService.setFlag({
        key: 'test-flag',
        enabled: true,
      });
      await featureFlagService.deleteFlag('test-flag');
      const flag = await featureFlagService.getFlag('test-flag');
      expect(flag).toBeNull();
    });
  });

  describe('getAllFlags', () => {
    it('should return all flags', async () => {
      await featureFlagService.setFlag({ key: 'flag1', enabled: true });
      await featureFlagService.setFlag({ key: 'flag2', enabled: false });
      const flags = await featureFlagService.getAllFlags();
      expect(flags).toHaveLength(2);
    });
  });

  describe('emergencyDisable', () => {
    it('should disable all flags', async () => {
      await featureFlagService.setFlag({ key: 'flag1', enabled: true });
      await featureFlagService.setFlag({ key: 'flag2', enabled: true });
      await featureFlagService.emergencyDisable();
      const flag1 = await featureFlagService.isEnabled('flag1');
      const flag2 = await featureFlagService.isEnabled('flag2');
      expect(flag1).toBe(false);
      expect(flag2).toBe(false);
    });
  });
});
