import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TraceService } from '../trace.service';
import { EventBusService } from '../../events/bus.service';
import { Event, EventDomain } from '../../events/types';
import { createMockEventBus } from '../../__tests__/helpers/mocks';

describe('TraceService', () => {
  let traceService: TraceService;
  let mockEventBus: EventBusService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    traceService = new TraceService(mockEventBus);
  });

  describe('createTrace', () => {
    it('should create trace', () => {
      const trace = traceService.createTrace('session-id', 'tenant-id', { key: 'value' });

      expect(trace).toBeDefined();
      expect(trace.sessionId).toBe('session-id');
      expect(trace.tenantId).toBe('tenant-id');
      expect(trace.metadata?.key).toBe('value');
    });
  });

  describe('getTrace', () => {
    beforeEach(() => {
      traceService.createTrace('session-id', 'tenant-id');
    });

    it('should return trace', () => {
      const trace = traceService.getTrace('session-id');

      expect(trace).toBeDefined();
      expect(trace?.sessionId).toBe('session-id');
    });

    it('should return undefined for non-existent trace', () => {
      const trace = traceService.getTrace('non-existent');

      expect(trace).toBeUndefined();
    });
  });

  describe('addEventToTrace', () => {
    it('should add event to trace', async () => {
      const event: Event = {
        id: 'event-id',
        type: 'intent.message.processed',
        domain: EventDomain.INTENT,
        action: 'message.processed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await (traceService as any).addEventToTrace(event);

      const trace = traceService.getTrace('session-id');
      expect(trace?.events).toHaveLength(1);
      expect(trace?.events[0].id).toBe('event-id');
    });

    it('should create trace if not exists', async () => {
      const event: Event = {
        id: 'event-id',
        type: 'intent.message.processed',
        domain: EventDomain.INTENT,
        action: 'message.processed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await (traceService as any).addEventToTrace(event);

      const trace = traceService.getTrace('session-id');
      expect(trace).toBeDefined();
    });
  });

  describe('closeTrace', () => {
    beforeEach(() => {
      traceService.createTrace('session-id', 'tenant-id');
    });

    it('should close trace', () => {
      const trace = traceService.closeTrace('session-id');

      expect(trace?.endTime).toBeDefined();
    });
  });

  describe('deleteTrace', () => {
    beforeEach(() => {
      traceService.createTrace('session-id', 'tenant-id');
    });

    it('should delete trace', () => {
      traceService.deleteTrace('session-id');

      const trace = traceService.getTrace('session-id');
      expect(trace).toBeUndefined();
    });
  });

  describe('replayTrace', () => {
    beforeEach(async () => {
      traceService.createTrace('session-id', 'tenant-id');
      const event: Event = {
        id: 'event-id',
        type: 'intent.message.processed',
        domain: EventDomain.INTENT,
        action: 'message.processed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };
      await (traceService as any).addEventToTrace(event);
    });

    it('should replay trace', async () => {
      await traceService.replayTrace('session-id');

      expect(mockEventBus.emit).toHaveBeenCalled();
    });

    it('should throw error for non-existent trace', async () => {
      await expect(traceService.replayTrace('non-existent')).rejects.toThrow();
    });
  });
});










































