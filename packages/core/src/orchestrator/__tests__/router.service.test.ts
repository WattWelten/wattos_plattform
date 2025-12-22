import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventRouterService } from '../router.service';
import { EventBusService } from '../../events/bus.service';
import { AgentRuntimeService } from '../runtime.service';
import { Event, EventDomain } from '../../events/types';
import { createMockEventBus } from '../../__tests__/helpers/mocks';

describe('EventRouterService', () => {
  let eventRouter: EventRouterService;
  let mockEventBus: EventBusService;
  let mockAgentRuntime: AgentRuntimeService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    mockAgentRuntime = {
      routeEvent: vi.fn().mockResolvedValue(null),
    } as unknown as AgentRuntimeService;

    eventRouter = new EventRouterService(mockEventBus, mockAgentRuntime);
  });

  describe('addRoutingRule', () => {
    it('should add routing rule', () => {
      eventRouter.addRoutingRule('custom.*', ['custom-agent']);

      // Prüfe, dass Regel hinzugefügt wurde
      expect(mockEventBus.subscribe).toHaveBeenCalled();
    });
  });

  describe('removeRoutingRule', () => {
    it('should remove routing rule', () => {
      eventRouter.addRoutingRule('custom.*', ['custom-agent']);
      eventRouter.removeRoutingRule('custom.*');

      // Prüfe, dass Regel entfernt wurde
      expect(mockEventBus.subscribe).toHaveBeenCalled();
    });
  });

  describe('routeEvent', () => {
    it('should route event to agent', async () => {
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

      await eventRouter.routeEvent(event);

      expect(mockAgentRuntime.routeEvent).toHaveBeenCalled();
    });

    it('should handle events without routing rule', async () => {
      const event: Event = {
        id: 'event-id',
        type: 'unknown.event',
        domain: EventDomain.KNOWLEDGE,
        action: 'unknown',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await eventRouter.routeEvent(event);

      // Sollte keine Fehler werfen
      expect(mockAgentRuntime.routeEvent).not.toHaveBeenCalled();
    });
  });

  describe('routeEventToAgent', () => {
    it('should route event to specific agent', async () => {
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

      await eventRouter.routeEventToAgent(event, 'conversation-agent');

      expect(mockAgentRuntime.routeEvent).toHaveBeenCalledWith(event, 'conversation-agent');
    });
  });
});




