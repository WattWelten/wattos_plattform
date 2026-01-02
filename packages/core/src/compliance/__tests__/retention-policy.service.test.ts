import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetentionPolicyService } from '../retention-policy.service';
import { ProfileService } from '../../profiles/profile.service';
import { EventBusService } from '../../events/bus.service';
import { PrismaClient } from '@wattweiser/db';
import { createMockEventBus, createMockProfileService } from '../../__tests__/helpers/mocks';

// Mock Prisma
const mockPrisma = {
  conversation: {
    deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
  },
  conversationMessage: {
    deleteMany: vi.fn().mockResolvedValue({ count: 10 }),
  },
  tenantProfile: {
    findMany: vi.fn().mockResolvedValue([
      { tenantId: 'tenant-1' },
      { tenantId: 'tenant-2' },
    ]),
  },
  $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
};

vi.mock('@wattweiser/db', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
  };
});

describe('RetentionPolicyService', () => {
  let retentionPolicyService: RetentionPolicyService;
  let mockEventBus: EventBusService;
  let mockProfileService: ProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventBus = createMockEventBus();
    mockProfileService = createMockProfileService();
    retentionPolicyService = new RetentionPolicyService(mockProfileService, mockEventBus);
  });

  describe('getRetentionDays', () => {
    it('should return retention days from profile', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        compliance: { retentionDays: 120 },
      });

      const days = await retentionPolicyService.getRetentionDays('tenant-id');

      expect(days).toBe(120);
    });

    it('should return default 90 days when not specified', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        compliance: {},
      });

      const days = await retentionPolicyService.getRetentionDays('tenant-id');

      expect(days).toBe(90);
    });
  });

  describe('cleanupExpiredData', () => {
    it('should cleanup expired data', async () => {
      const result = await retentionPolicyService.cleanupExpiredData('tenant-id');

      expect(result.deletedConversations).toBe(5);
      expect(result.deletedMessages).toBe(10);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should use correct cutoff date', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        compliance: { retentionDays: 30 },
      });

      await retentionPolicyService.cleanupExpiredData('tenant-id');

      const deleteManyCall = mockPrisma.conversation.deleteMany.mock.calls[0];
      expect(deleteManyCall[0].where.updatedAt.lt).toBeInstanceOf(Date);
    });
  });

  describe('cleanupAllTenants', () => {
    it('should cleanup all tenants', async () => {
      const results = await retentionPolicyService.cleanupAllTenants();

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['tenant-1']).toBeDefined();
      expect(results['tenant-2']).toBeDefined();
    });
  });

  describe('isDataExpired', () => {
    it('should return true for expired data', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        compliance: { retentionDays: 30 },
      });

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const expired = await retentionPolicyService.isDataExpired('tenant-id', oldDate);

      expect(expired).toBe(true);
    });

    it('should return false for non-expired data', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        compliance: { retentionDays: 30 },
      });

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);

      const expired = await retentionPolicyService.isDataExpired('tenant-id', recentDate);

      expect(expired).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return true when database is accessible', async () => {
      const healthy = await retentionPolicyService.healthCheck();

      expect(healthy).toBe(true);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return false when database is not accessible', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection failed'));

      const healthy = await retentionPolicyService.healthCheck();

      expect(healthy).toBe(false);
    });
  });
});






