import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuditReplayService } from '../audit-replay.service';
import { EventBusService } from '../../events/bus.service';
import { ProfileService } from '../../profiles/profile.service';
import { ConfigService } from '@nestjs/config';
import { Event, EventDomain } from '../../events/types';

// GÃ¼ltige Test-UUIDs
const TEST_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const TEST_SESSION_ID = 'ffffffff-ffff-ffff-ffff-fffffffffffe';
const TEST_TENANT_ID = 'ffffffff-ffff-ffff-ffff-fffffffffffd';
const TEST_EVENT_ID_1 = 'ffffffff-ffff-ffff-ffff-fffffffffffc';
const TEST_EVENT_ID_2 = 'ffffffff-ffff-ffff-ffff-fffffffffffb';

// Mock ioredis - korrektes Mocking mit echten Funktionen
const mockRedis = {
  xadd: vi.fn().mockResolvedValue('stream-id'),
  xrange: vi.fn().mockResolvedValue([]),
  expire: vi.fn().mockResolvedValue(1),
  xtrim: vi.fn().mockResolvedValue(0),
};

function MockRedis() {
  return mockRedis;
}

vi.mock('ioredis', () => ({
  default: MockRedis,
}));

describe('AuditReplayService', () => {
  let auditReplayService: AuditReplayService;
  let mockEventBus: EventBusService;
  let mockProfileService: ProfileService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // EventBus mocken - korrektes Mocking mit echten Funktionen
    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
      subscribePattern: vi.fn(),
    } as unknown as EventBusService;

    // ProfileService mocken - korrektes Mocking mit echten Funktionen
    mockProfileService = {
      getProfile: vi.fn().mockResolvedValue({ retentionDays: 90 }),
    } as unknown as ProfileService;

    // ConfigService mocken - Redis deaktivieren fÃ¼r In-Memory-Tests
    mockConfigService = {
      get: vi.fn().mockReturnValue(undefined), // Kein REDIS_URL = In-Memory nur
    } as unknown as ConfigService;

    auditReplayService = new AuditReplayService(mockEventBus, mockProfileService, mockConfigService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getEventHistory', () => {
    it('should return event history from memory', async () => {
      const event: Event = {
        id: TEST_EVENT_ID_1,
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: TEST_SESSION_ID,
        tenantId: TEST_TENANT_ID,
        payload: { query: 'test' },
      };

      // Simuliere Event-HinzufÃ¼gung
      await (auditReplayService as any).addEventToHistory(event);

      const history = await auditReplayService.getEventHistory(TEST_SESSION_ID);

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(TEST_EVENT_ID_1);
    });

    it('should filter by time range', async () => {
      const now = Date.now();
      const event1: Event = {
        id: TEST_EVENT_ID_1,
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: now - 1000,
        sessionId: TEST_SESSION_ID,
        tenantId: TEST_TENANT_ID,
        payload: {},
      };
      const event2: Event = {
        id: TEST_EVENT_ID_2,
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: now,
        sessionId: TEST_SESSION_ID,
        tenantId: TEST_TENANT_ID,
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event1);
      await (auditReplayService as any).addEventToHistory(event2);

      const history = await auditReplayService.getEventHistory(TEST_SESSION_ID, {
        startTime: now - 500,
      });

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(TEST_EVENT_ID_2);
    });

    it('should filter by domain', async () => {
      const event1: Event = {
        id: TEST_EVENT_ID_1,
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: TEST_SESSION_ID,
        tenantId: TEST_TENANT_ID,
        payload: {},
      };
      const event2: Event = {
        id: TEST_EVENT_ID_2,
        type: 'tool.call.executed',
        domain: EventDomain.TOOL,
        action: 'call.executed',
        timestamp: Date.now(),
        sessionId: TEST_SESSION_ID,
        tenantId: TEST_TENANT_ID,
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event1);
      await (auditReplayService as any).addEventToHistory(event2);

      const history = await auditReplayService.getEventHistory(TEST_SESSION_ID, {
        domain: EventDomain.KNOWLEDGE,
      });

      expect(history).toHaveLength(1);
      expect(history[0].domain).toBe(EventDomain.KNOWLEDGE);
    });
  });

  describe('createReplaySession', () => {
    it('should create replay session', async () => {
      const event: Event = {
        id: TEST_EVENT_ID_1,
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: TEST_SESSION_ID,
        tenantId: TEST_TENANT_ID,
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event);

      const replaySession = await auditReplayService.createReplaySession(TEST_SESSION_ID, TEST_TENANT_ID);

      expect(replaySession).toBeDefined();
      expect(replaySession.sessionId).toBe(TEST_SESSION_ID);
      expect(replaySession.events).toHaveLength(1);
    });
  });

  describe('replaySession', () => {
    it('should replay session events', async () => {
      const event: Event = {
        id: TEST_EVENT_ID_1,
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: TEST_SESSION_ID,
        tenantId: TEST_TENANT_ID,
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event);
      await auditReplayService.createReplaySession(TEST_SESSION_ID, TEST_TENANT_ID);

      // Hole die replayId aus dem internen Map
      const replaySessions = (auditReplayService as any).replaySessions;
      const replayId = Array.from(replaySessions.keys())[0];

      await auditReplayService.replaySession(replayId, { speed: 2.0 });

      expect(mockEventBus.emit).toHaveBeenCalled();
    });
  });

  describe('exportAuditLog', () => {
    it('should export audit log as JSON', async () => {
      const event: Event = {
        id: TEST_EVENT_ID_1,
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: TEST_SESSION_ID,
        tenantId: TEST_TENANT_ID,
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event);

      const exportData = await auditReplayService.exportAuditLog(TEST_TENANT_ID, TEST_SESSION_ID, 'json');

      expect(exportData).toContain('sessionId');
      expect(exportData).toContain('events');
      expect(() => JSON.parse(exportData)).not.toThrow();
    });

    it('should export audit log as CSV', async () => {
      const event: Event = {
        id: TEST_EVENT_ID_1,
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: TEST_SESSION_ID,
        tenantId: TEST_TENANT_ID,
        payload: {},
      };

      await (auditReplayService as any).addEventToHistory(event);

      const exportData = await auditReplayService.exportAuditLog(TEST_TENANT_ID, TEST_SESSION_ID, 'csv');

      expect(exportData).toContain('timestamp');
      expect(exportData).toContain('domain');
    });
  });
});
