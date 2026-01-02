import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DisclosureService } from '../disclosure.service';
import { EventBusService } from '../../events/bus.service';
import { ProfileService } from '../../profiles/profile.service';
import { createMockEventBus, createMockProfileService } from '../../__tests__/helpers/mocks';

describe('DisclosureService', () => {
  let disclosureService: DisclosureService;
  let mockEventBus: EventBusService;
  let mockProfileService: ProfileService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    mockProfileService = createMockProfileService();
    disclosureService = new DisclosureService(mockEventBus, mockProfileService);
  });

  describe('getDisclosure', () => {
    it('should return disclosure when required', async () => {
      const disclosure = await disclosureService.getDisclosure('tenant-id', 'session-id');

      expect(disclosure).toBeDefined();
      expect(disclosure?.title).toBeDefined();
      expect(disclosure?.text).toBeDefined();
      expect(disclosure?.required).toBe(true);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should return null when not required', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        compliance: { disclosure: false },
      });

      const disclosure = await disclosureService.getDisclosure('tenant-id', 'session-id');

      expect(disclosure).toBeNull();
    });

    it('should return cached disclosure', async () => {
      await disclosureService.getDisclosure('tenant-id', 'session-id');
      const cached = await disclosureService.getDisclosure('tenant-id', 'session-id');

      expect(cached).toBeDefined();
      expect(mockProfileService.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should return gov-full disclosure for gov mode', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        mode: 'gov-f13',
        market: 'gov',
        compliance: { disclosure: true },
      });

      const disclosure = await disclosureService.getDisclosure('tenant-id', 'session-id');

      expect(disclosure?.title).toContain('Vollständig');
    });
  });

  describe('acknowledgeDisclosure', () => {
    beforeEach(async () => {
      await disclosureService.getDisclosure('tenant-id', 'session-id');
    });

    it('should acknowledge disclosure', async () => {
      const result = await disclosureService.acknowledgeDisclosure('tenant-id', 'session-id');

      expect(result).toBe(true);
      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should return false for non-existent disclosure', async () => {
      const result = await disclosureService.acknowledgeDisclosure('tenant-id', 'non-existent');

      expect(result).toBe(false);
    });

    it('should set acknowledged timestamp', async () => {
      await disclosureService.acknowledgeDisclosure('tenant-id', 'session-id');
      const disclosure = await disclosureService.getDisclosure('tenant-id', 'session-id');

      expect(disclosure?.acknowledged).toBe(true);
      expect(disclosure?.acknowledgedAt).toBeDefined();
    });
  });

  describe('isDisclosureRequired', () => {
    it('should return true when required', async () => {
      const required = await disclosureService.isDisclosureRequired('tenant-id');

      expect(required).toBe(true);
    });

    it('should return false when not required', async () => {
      (mockProfileService.getProfile as any).mockResolvedValueOnce({
        compliance: { disclosure: false },
      });

      const required = await disclosureService.isDisclosureRequired('tenant-id');

      expect(required).toBe(false);
    });
  });
});







