import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentRuntimeService, Agent } from '../runtime.service';
import { EventBusService } from '../../events/bus.service';
import { Event, EventDomain } from '../../events/types';
import { createMockEventBus } from '../../__tests__/helpers/mocks';

describe('AgentRuntimeService', () => {
  let agentRuntime: AgentRuntimeService;
  let mockEventBus: EventBusService;
  let mockAgent: Agent;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    agentRuntime = new AgentRuntimeService(mockEventBus);

    mockAgent = {
      name: 'test-agent',
      version: '1.0.0',
      handle: vi.fn().mockResolvedValue(null),
      healthCheck: vi.fn().mockResolvedValue(true),
    };
  });

  describe('registerAgent', () => {
    it('should register agent', () => {
      agentRuntime.registerAgent(mockAgent);

      const agent = agentRuntime.getAgent('test-agent');
      expect(agent).toBe(mockAgent);
    });
  });

  describe('unregisterAgent', () => {
    it('should unregister agent', () => {
      agentRuntime.registerAgent(mockAgent);
      agentRuntime.unregisterAgent('test-agent');

      const agent = agentRuntime.getAgent('test-agent');
      expect(agent).toBeUndefined();
    });
  });

  describe('listAgents', () => {
    it('should list all agents', () => {
      const agent1 = { ...mockAgent, name: 'agent-1' };
      const agent2 = { ...mockAgent, name: 'agent-2' };

      agentRuntime.registerAgent(agent1);
      agentRuntime.registerAgent(agent2);

      const agents = agentRuntime.listAgents();
      expect(agents).toHaveLength(2);
    });
  });

  describe('routeEvent', () => {
    beforeEach(() => {
      agentRuntime.registerAgent(mockAgent);
    });

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

      await agentRuntime.routeEvent(event, 'test-agent');

      expect(mockAgent.handle).toHaveBeenCalledWith(event);
    });

    it('should return null for non-existent agent', async () => {
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

      const result = await agentRuntime.routeEvent(event, 'non-existent');

      expect(result).toBeNull();
    });

    it('should route to all agents when no agent specified', async () => {
      const agent2 = { ...mockAgent, name: 'agent-2' };
      agentRuntime.registerAgent(agent2);

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

      await agentRuntime.routeEvent(event);

      expect(mockAgent.handle).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      agentRuntime.registerAgent(mockAgent);
    });

    it('should check health of all agents', async () => {
      const health = await agentRuntime.healthCheck();

      expect(health['test-agent']).toBe(true);
      expect(mockAgent.healthCheck).toHaveBeenCalled();
    });

    it('should return false for unhealthy agent', async () => {
      (mockAgent.healthCheck as any).mockResolvedValueOnce(false);

      const health = await agentRuntime.healthCheck();

      expect(health['test-agent']).toBe(false);
    });
  });
});





