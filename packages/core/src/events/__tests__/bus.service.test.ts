import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusService } from '../bus.service';
import { ConfigService } from '@nestjs/config';
import { Event, EventDomain } from '../types';
import Redis from 'ioredis';

// Mock ioredis
const mockPublisher = {
  publish: vi.fn().mockResolvedValue(1),
  ping: vi.fn().mockResolvedValue('PONG'),
  quit: vi.fn().mockResolvedValue('OK'),
  on: vi.fn(),
};

const mockSubscriber = {
  subscribe: vi.fn().mockResolvedValue(1),
  psubscribe: vi.fn().mockResolvedValue(1),
  unsubscribe: vi.fn().mockResolvedValue(1),
  ping: vi.fn().mockResolvedValue('PONG'),
  quit: vi.fn().mockResolvedValue('OK'),
  on: vi.fn(),
};

vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      // Erste Instanz = Publisher, zweite = Subscriber
      const callCount = (vi.fn() as any).mock.calls?.length || 0;
      return callCount % 2 === 0 ? mockPublisher : mockSubscriber;
    }),
  };
});

describe('EventBusService', () => {
  let eventBus: EventBusService;
  let configService: ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();

    configService = {
      get: vi.fn().mockReturnValue('redis://localhost:6379'),
    } as unknown as ConfigService;

    eventBus = new EventBusService(configService);
  });

  afterEach(async () => {
    if (eventBus) {
      await eventBus.onModuleDestroy();
    }
  });

  describe('onModuleInit', () => {
    it('should connect to Redis successfully', async () => {
      await eventBus.onModuleInit();

      expect(mockSubscriber.ping).toHaveBeenCalled();
      expect(mockSubscriber.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should handle Redis connection failure', async () => {
      mockSubscriber.ping.mockRejectedValueOnce(new Error('Connection failed'));

      await eventBus.onModuleInit();

      expect(mockSubscriber.ping).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from Redis', async () => {
      await eventBus.onModuleInit();
      await eventBus.onModuleDestroy();

      expect(mockPublisher.quit).toHaveBeenCalled();
      expect(mockSubscriber.quit).toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    beforeEach(async () => {
      await eventBus.onModuleInit();
    });

    it('should emit event successfully', async () => {
      const event: Event = {
        id: 'test-id',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {
          query: 'test query',
        },
      };

      await eventBus.emit(event);

      expect(mockPublisher.publish).toHaveBeenCalledWith(
        'events:knowledge:search.executed',
        expect.stringContaining('"type":"knowledge.search.executed"'),
      );
    });

    it('should generate id and timestamp if not provided', async () => {
      const event: Partial<Event> = {
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {
          query: 'test query',
        },
      };

      await eventBus.emit(event as Event);

      const publishCall = mockPublisher.publish.mock.calls[0];
      const publishedEvent = JSON.parse(publishCall[1]);

      expect(publishedEvent.id).toBeDefined();
      expect(publishedEvent.timestamp).toBeDefined();
    });

    it('should not emit event if not connected', async () => {
      // Simuliere nicht verbunden
      (eventBus as any).isConnected = false;

      const event: Event = {
        id: 'test-id',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {
          query: 'test query',
        },
      };

      await eventBus.emit(event);

      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });

    it('should throw error on invalid event', async () => {
      const invalidEvent = {
        type: 'invalid',
      } as unknown as Event;

      await expect(eventBus.emit(invalidEvent)).rejects.toThrow();
    });
  });

  describe('subscribe', () => {
    beforeEach(async () => {
      await eventBus.onModuleInit();
    });

    it('should subscribe to event type', () => {
      const handler = vi.fn();

      eventBus.subscribe('knowledge.search.executed', handler);

      expect(mockSubscriber.subscribe).toHaveBeenCalledWith('events:knowledge:search.executed');
    });

    it('should register multiple handlers for same event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.subscribe('knowledge.search.executed', handler1);
      eventBus.subscribe('knowledge.search.executed', handler2);

      // Subscribe sollte nur einmal aufgerufen werden
      expect(mockSubscriber.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribePattern', () => {
    beforeEach(async () => {
      await eventBus.onModuleInit();
    });

    it('should subscribe to pattern', () => {
      const handler = vi.fn();

      eventBus.subscribePattern('knowledge.*', handler);

      expect(mockSubscriber.psubscribe).toHaveBeenCalledWith('events:knowledge:*');
    });

    it('should handle wildcard pattern', () => {
      const handler = vi.fn();

      eventBus.subscribePattern('*.*', handler);

      expect(mockSubscriber.psubscribe).toHaveBeenCalledWith('events:*');
    });
  });

  describe('unsubscribe', () => {
    beforeEach(async () => {
      await eventBus.onModuleInit();
    });

    it('should unsubscribe handler', () => {
      const handler = vi.fn();

      eventBus.subscribe('knowledge.search.executed', handler);
      eventBus.unsubscribe('knowledge.search.executed', handler);

      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith('events:knowledge:search.executed');
    });

    it('should not unsubscribe if handler not found', () => {
      const handler = vi.fn();
      const otherHandler = vi.fn();

      eventBus.subscribe('knowledge.search.executed', handler);
      eventBus.unsubscribe('knowledge.search.executed', otherHandler);

      // Unsubscribe sollte nicht aufgerufen werden, da Handler noch registriert ist
      expect(mockSubscriber.unsubscribe).not.toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    beforeEach(async () => {
      await eventBus.onModuleInit();
    });

    it('should return true when connected', async () => {
      const result = await eventBus.healthCheck();

      expect(result).toBe(true);
      expect(mockPublisher.ping).toHaveBeenCalled();
    });

    it('should return false when not connected', async () => {
      (eventBus as any).isConnected = false;
      mockPublisher.ping.mockRejectedValueOnce(new Error('Not connected'));

      const result = await eventBus.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('handleMessage', () => {
    beforeEach(async () => {
      await eventBus.onModuleInit();
    });

    it('should handle message and call registered handlers', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const event: Event = {
        id: 'test-id',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {
          query: 'test query',
        },
      };

      eventBus.subscribe('knowledge.search.executed', handler);

      // Simuliere Message-Handler
      const messageHandler = mockSubscriber.on.mock.calls.find(
        (call) => call[0] === 'message',
      )?.[1];

      if (messageHandler) {
        await messageHandler('events:knowledge:search.executed', JSON.stringify(event));
      }

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: event.type }));
    });

    it('should handle handler errors gracefully', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const event: Event = {
        id: 'test-id',
        type: 'knowledge.search.executed',
        domain: EventDomain.KNOWLEDGE,
        action: 'search.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {
          query: 'test query',
        },
      };

      eventBus.subscribe('knowledge.search.executed', handler);

      const messageHandler = mockSubscriber.on.mock.calls.find(
        (call) => call[0] === 'message',
      )?.[1];

      if (messageHandler) {
        await messageHandler('events:knowledge:search.executed', JSON.stringify(event));
      }

      expect(handler).toHaveBeenCalled();
    });
  });
});






