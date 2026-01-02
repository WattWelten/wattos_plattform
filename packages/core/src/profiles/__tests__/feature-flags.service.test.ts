import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureFlagsService, FeatureNotEnabledError } from '../feature-flags.service';
import { ProfileService } from '../profile.service';
import { FeatureFlags } from '../types';

describe('FeatureFlagsService', () => {
  let featureFlagsService: FeatureFlagsService;
  let mockProfileService: ProfileService;

  const mockProfile = {
    tenantId: 'tenant-1',
    features: {
      webChat: true,
      phone: false,
      whatsapp: true,
      rag: true,
      agents: false,
      voice: true,
      avatar: false,
    } as FeatureFlags,
  };

  beforeEach(() => {
    mockProfileService = {
      getProfile: vi.fn().mockResolvedValue(mockProfile),
    } as any;

    featureFlagsService = new FeatureFlagsService(mockProfileService);
  });

  describe('isEnabled', () => {
    it('should return true for enabled feature', async () => {
      const result = await featureFlagsService.isEnabled('tenant-1', 'webChat');

      expect(result).toBe(true);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith('tenant-1');
    });

    it('should return false for disabled feature', async () => {
      const result = await featureFlagsService.isEnabled('tenant-1', 'phone');

      expect(result).toBe(false);
    });

    it('should return false for undefined feature', async () => {
      const profileWithoutFeature = {
        ...mockProfile,
        features: { ...mockProfile.features, newFeature: undefined },
      };
      vi.mocked(mockProfileService.getProfile).mockResolvedValueOnce(profileWithoutFeature as any);

      const result = await featureFlagsService.isEnabled('tenant-1', 'newFeature' as any);

      expect(result).toBe(false);
    });
  });

  describe('requireFeature', () => {
    it('should not throw when feature is enabled', async () => {
      await expect(
        featureFlagsService.requireFeature('tenant-1', 'webChat'),
      ).resolves.not.toThrow();
    });

    it('should throw FeatureNotEnabledError when feature is disabled', async () => {
      await expect(
        featureFlagsService.requireFeature('tenant-1', 'phone'),
      ).rejects.toThrow(FeatureNotEnabledError);
    });

    it('should include feature and tenantId in error', async () => {
      try {
        await featureFlagsService.requireFeature('tenant-1', 'phone');
      } catch (error: any) {
        expect(error).toBeInstanceOf(FeatureNotEnabledError);
        expect(error.feature).toBe('phone');
        expect(error.tenantId).toBe('tenant-1');
        expect(error.message).toContain('phone');
        expect(error.message).toContain('tenant-1');
      }
    });
  });

  describe('areEnabled', () => {
    it('should return status for multiple features', async () => {
      const result = await featureFlagsService.areEnabled('tenant-1', [
        'webChat',
        'phone',
        'whatsapp',
      ]);

      expect(result).toEqual({
        webChat: true,
        phone: false,
        whatsapp: true,
      });
    });

    it('should return false for undefined features', async () => {
      const result = await featureFlagsService.areEnabled('tenant-1', [
        'webChat',
        'unknownFeature' as any,
      ]);

      expect(result.webChat).toBe(true);
      expect(result.unknownFeature).toBe(false);
    });
  });

  describe('getAllFeatures', () => {
    it('should return all features for tenant', async () => {
      const result = await featureFlagsService.getAllFeatures('tenant-1');

      expect(result).toEqual(mockProfile.features);
      expect(mockProfileService.getProfile).toHaveBeenCalledWith('tenant-1');
    });
  });

  describe('isChannelEnabled', () => {
    it('should return true for enabled channel', async () => {
      const result = await featureFlagsService.isChannelEnabled('tenant-1', 'webChat');

      expect(result).toBe(true);
    });

    it('should return false for disabled channel', async () => {
      const result = await featureFlagsService.isChannelEnabled('tenant-1', 'phone');

      expect(result).toBe(false);
    });

    it('should work for whatsapp channel', async () => {
      const result = await featureFlagsService.isChannelEnabled('tenant-1', 'whatsapp');

      expect(result).toBe(true);
    });
  });

  describe('FeatureNotEnabledError', () => {
    it('should create error with correct message', () => {
      const error = new FeatureNotEnabledError('testFeature', 'tenant-1');

      expect(error.name).toBe('FeatureNotEnabledError');
      expect(error.message).toBe("Feature 'testFeature' is not enabled for tenant 'tenant-1'");
      expect(error.feature).toBe('testFeature');
      expect(error.tenantId).toBe('tenant-1');
    });
  });
});







