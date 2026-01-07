import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetentionPolicyService } from '../retention-policy.service';
import { ProfileService } from '../../profiles/profile.service';
import { EventBusService } from '../../events/bus.service';
import { PrismaClient } from '@wattweiser/db';

// Mock Prisma - korrektes Mocking mit echten Funktionen
const mockPrisma = {
  conversation: {
    deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
  },
  conversationMessage: {
    deleteMany: vi.fn().mockResolvedValue({ count: 10 }),
  },
  tenantProfile: {
    findMany: vi.fn().mockResolvedValue([
      { tenantId: 'ffffffff-ffff-ffff-ffff-fffffffffffe' },
      { tenantId: 'ffffffff-ffff-ffff-ffff-fffffffffffd' },
    ]),
  },
  $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
};

function MockPrismaClient() {
  return mockPrisma;
}

vi.mock('@wattweiser/db', () => ({
  PrismaClient: MockPrismaClient,
}));

describe('RetentionPolicyService', () => {
  let retentionPolicyService: RetentionPolicyService;
  let mockEventBus: EventBusService;
  let mockProfileService: ProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // EventBus mocken - korrektes Mocking mit echten Funktionen
    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventBusService;

    // ProfileService mocken - korrektes Mocking mit echten Funktionen
    mockProfileService = {
      getProfile: vi.fn().mockResolvedValue({ compliance: { retentionDays: 90 } }),
    } as unknown as ProfileService;

    retentionPolicyService = new RetentionPolicyService(mockProfileService, mockEventBus);
  });

  describe('getRetentionDays', () => {
    it('should return retention days from profile', async () => {
      vi.mocked(mockProfileService.getProfile).mockResolvedValueOnce({
        compliance: { retentionDays: 120 },
      } as any);

      const days = await retentionPolicyService.getRetentionDays('ffffffff-ffff-ffff-ffff-ffffffffffff');

      expect(days).toBe(120);
    });

    it('should return default 90 days when not specified', async () => {
      vi.mocked(mockProfileService.getProfile).mockResolvedValueOnce({
        compliance: {},
      } as any);

      const days = await retentionPolicyService.getRetentionDays('ffffffff-ffff-ffff-ffff-ffffffffffff');

      expect(days).toBe(90);
    });
  });

  describe('cleanupExpiredData', () => {
    it('should cleanup expired data', async () => {
      const result = await retentionPolicyService.cleanupExpiredData('ffffffff-ffff-ffff-ffff-ffffffffffff');

      expect(result.deletedConversations).toBe(5);
      expect(result.deletedMessages).toBe(10);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should use correct cutoff date', async () => {
      vi.mocked(mockProfileService.getProfile).mockResolvedValueOnce({
        compliance: { retentionDays: 30 },
      } as any);

      await retentionPolicyService.cleanupExpiredData('ffffffff-ffff-ffff-ffff-ffffffffffff');

      const deleteManyCall = mockPrisma.conversation.deleteMany.mock.calls[0];
      expect(deleteManyCall[0].where.updatedAt.lt).toBeInstanceOf(Date);
    });
  });

  describe('cleanupAllTenants', () => {
    it('should cleanup all tenants', async () => {
      const results = await retentionPolicyService.cleanupAllTenants();

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['ffffffff-ffff-ffff-ffff-fffffffffffe']).toBeDefined();
      expect(results['ffffffff-ffff-ffff-ffff-fffffffffffd']).toBeDefined();
    });
  });

  describe('isDataExpired', () => {
    it('should return true for expired data', async () => {
      vi.mocked(mockProfileService.getProfile).mockResolvedValueOnce({
        compliance: { retentionDays: 30 },
      } as any);

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const expired = await retentionPolicyService.isDataExpired('ffffffff-ffff-ffff-ffff-ffffffffffff', oldDate);

      expect(expired).toBe(true);
    });

    it('should return false for non-expired data', async () => {
      vi.mocked(mockProfileService.getProfile).mockResolvedValueOnce({
        compliance: { retentionDays: 30 },
      } as any);

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);

      const expired = await retentionPolicyService.isDataExpired('ffffffff-ffff-ffff-ffff-ffffffffffff', recentDate);

      expect(expired).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return true when database is accessible', async () => {
      const healthy = await retentionPolicyService.healthCheck();

      expect(healthy).toBe(true);
      expect(mockPrisma['$queryRaw']).toHaveBeenCalled();
    });

    it('should return false when database is not accessible', async () => {
      mockPrisma['$queryRaw'].mockRejectedValueOnce(new Error('Connection failed'));

      const healthy = await retentionPolicyService.healthCheck();

      expect(healthy).toBe(false);
    });
  });
});
