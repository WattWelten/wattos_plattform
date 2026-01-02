import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateService } from '../state.service';
import { EventBusService } from '../../events/bus.service';
import { Event, EventDomain } from '../../events/types';
import { createMockEventBus } from '../../__tests__/helpers/mocks';

describe('StateService', () => {
  let stateService: StateService;
  let mockEventBus: EventBusService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    stateService = new StateService(mockEventBus);
  });

  describe('createState', () => {
    it('should create state', () => {
      const state = stateService.createState('session-id', 'tenant-id', 'user-id');

      expect(state).toBeDefined();
      expect(state.sessionId).toBe('session-id');
      expect(state.tenantId).toBe('tenant-id');
      expect(state.userId).toBe('user-id');
    });
  });

  describe('getState', () => {
    beforeEach(() => {
      stateService.createState('session-id', 'tenant-id');
    });

    it('should return state', () => {
      const state = stateService.getState('session-id');

      expect(state).toBeDefined();
      expect(state?.sessionId).toBe('session-id');
    });

    it('should return undefined for non-existent state', () => {
      const state = stateService.getState('non-existent');

      expect(state).toBeUndefined();
    });
  });

  describe('updateState', () => {
    beforeEach(() => {
      stateService.createState('session-id', 'tenant-id');
    });

    it('should update state', () => {
      const updated = stateService.updateState('session-id', { key: 'value' });

      expect(updated).toBeDefined();
      expect(updated?.state.key).toBe('value');
    });

    it('should return null for non-existent state', () => {
      const updated = stateService.updateState('non-existent', { key: 'value' });

      expect(updated).toBeNull();
    });
  });

  describe('deleteState', () => {
    beforeEach(() => {
      stateService.createState('session-id', 'tenant-id');
    });

    it('should delete state', () => {
      stateService.deleteState('session-id');

      const state = stateService.getState('session-id');
      expect(state).toBeUndefined();
    });
  });

  describe('getEventHistory', () => {
    it('should return event history', () => {
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

      // Simuliere Event-Hinzufügung
      stateService.createState('session-id', 'tenant-id');
      (stateService as any).updateStateFromEvent(event);

      const history = stateService.getEventHistory('session-id');

      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('event-id');
    });
  });

  describe('resetState', () => {
    beforeEach(() => {
      stateService.createState('session-id', 'tenant-id');
      stateService.updateState('session-id', { key: 'value' });
    });

    it('should reset state', () => {
      stateService.resetState('session-id');

      const state = stateService.getState('session-id');
      expect(state?.state).toEqual({});
    });
  });

  describe('getStatesByTenant', () => {
    beforeEach(() => {
      stateService.createState('session-1', 'tenant-1');
      stateService.createState('session-2', 'tenant-2');
    });

    it('should filter states by tenant', () => {
      const states = stateService.getStatesByTenant('tenant-1');

      expect(states).toHaveLength(1);
      expect(states[0].tenantId).toBe('tenant-1');
    });
  });
});






