import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuditReplayService } from '../audit-replay.service';
import { EventBusService } from '../../events/bus.service';
import { ProfileService } from '../../profiles/profile.service';
import { ConfigService } from '@nestjs/config';
import { Event, EventDomain } from '../../events/types';
import { createMockEventBus, createMockProfileService, createMockConfigService } from '../../__tests__/helpers/mocks';
import Redis from 'ioredis';

// Mock ioredis
const mockRedis = {
  xadd: vi.fn().mockResolvedValue('stream-id'),
  xrange: vi.fn().mockResolvedValue([]),
  expire: vi.fn().mockResolvedValue(1),
  xtrim: vi.fn().mockResolvedValue(0),
};

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => mockRedis),
  };
});

describe('AuditReplayService', () => {
  let auditReplayService: AuditReplayService;
  let mockEventBus: EventBusService;
  let mockProfileService: ProfileService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventBus = createMockEventBus();
    mockProfileService = createMockProfileService();
    mockConfigService = createMockConfigService({ REDIS_URL: 'redis://localhost:6379' });
    auditReplayService = new AuditReplayService(mockEventBus, mockProfileService, mockConfigService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getEventHistory', () => {
    it('should return event history from memory', async () => {
      const event: Event = {
        id: 'event-id',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: { query: 'test' },
      };

      // Simuliere Event-Hinzufügung
      await (auditReplayService as any).addEventToHistory(event);

      const history = await auditReplayService.getEventHistory('session-id');

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('event-id');
    });

    it('should filter by time range', async () => {
      const now = Date.now();
      const event1: Event = {
        id: 'event-1',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: now - 1000,
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };
      const event2: Event = {
        id: 'event-2',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: now,
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event1);
      await (auditReplayService as any).addEventToHistory(event2);

      const history = await auditReplayService.getEventHistory('session-id', {
        startTime: now - 500,
      });

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('event-2');
    });

    it('should filter by domain', async () => {
      const event1: Event = {
        id: 'event-1',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };
      const event2: Event = {
        id: 'event-2',
        type: 'tool.call.executed',
        domain: EventDomain.TOOL,
        action: 'call.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event1);
      await (auditReplayService as any).addEventToHistory(event2);

      const history = await auditReplayService.getEventHistory('session-id', {
        domain: EventDomain.KNOWLEDGE,
      });

      expect(history).toHaveLength(1);
      expect(history[0].domain).toBe(EventDomain.KNOWLEDGE);
    });
  });

  describe('createReplaySession', () => {
    it('should create replay session', async () => {
      const event: Event = {
        id: 'event-id',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event);

      const replaySession = await auditReplayService.createReplaySession('session-id', 'tenant-id');

      expect(replaySession).toBeDefined();
      expect(replaySession.sessionId).toBe('session-id');
      expect(replaySession.events).toHaveLength(1);
    });
  });

  describe('replaySession', () => {
    it('should replay session events', async () => {
      const event: Event = {
        id: 'event-id',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event);
      const replaySession = await auditReplayService.createReplaySession('session-id', 'tenant-id');

      await auditReplayService.replaySession(replaySession.sessionId, { speed: 2.0 });

      expect(mockEventBus.emit).toHaveBeenCalled();
    });
  });

  describe('exportAuditLog', () => {
    it('should export audit log as JSON', async () => {
      const event: Event = {
        id: 'event-id',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event);

      const exportData = await auditReplayService.exportAuditLog('tenant-id', 'session-id', 'json');

      expect(exportData).toContain('sessionId');
      expect(exportData).toContain('events');
      expect(() => JSON.parse(exportData)).not.toThrow();
    });

    it('should export audit log as CSV', async () => {
      const event: Event = {
        id: 'event-id',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event);

      const exportData = await auditReplayService.exportAuditLog('tenant-id', 'session-id', 'csv');

      expect(exportData).toContain('timestamp');
      expect(exportData).toContain('domain');
    });
  });
});







