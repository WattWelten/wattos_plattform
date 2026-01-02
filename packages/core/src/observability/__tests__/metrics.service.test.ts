import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsService } from '../metrics.service';
import { EventBusService } from '../../events/bus.service';
import { Event, EventDomain } from '../../events/types';
import { createMockEventBus } from '../../__tests__/helpers/mocks';

describe('MetricsService', () => {
  let metricsService: MetricsService;
  let mockEventBus: EventBusService;

  beforeEach(() => {
    mockEventBus = createMockEventBus();
    metricsService = new MetricsService(mockEventBus);
  });

  describe('createMetrics', () => {
    it('should create metrics', () => {
      const metrics = metricsService.createMetrics('session-id', 'tenant-id');

      expect(metrics).toBeDefined();
      expect(metrics.sessionId).toBe('session-id');
      expect(metrics.tenantId).toBe('tenant-id');
      expect(metrics.eventCount).toBe(0);
    });
  });

  describe('getMetrics', () => {
    beforeEach(() => {
      metricsService.createMetrics('session-id', 'tenant-id');
    });

    it('should return metrics', () => {
      const metrics = metricsService.getMetrics('session-id');

      expect(metrics).toBeDefined();
      expect(metrics?.sessionId).toBe('session-id');
    });

    it('should return undefined for non-existent metrics', () => {
      const metrics = metricsService.getMetrics('non-existent');

      expect(metrics).toBeUndefined();
    });
  });

  describe('updateMetricsFromEvent', () => {
    it('should update metrics from tool event', async () => {
      const event: Event = {
        id: 'event-id',
        type: 'tool.call.executed',
        domain: EventDomain.TOOL,
        action: 'call.executed',
        timestamp: Date.now(),
        sessionId: 'session-id',
        tenantId: 'tenant-id',
        payload: {},
      };

      await (metricsService as any).updateMetricsFromEvent(event);

      const metrics = metricsService.getMetrics('session-id');
      expect(metrics?.toolCallCount).toBe(1);
      expect(metrics?.eventCount).toBe(1);
    });

    it('should update metrics from knowledge event', async () => {
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

      await (metricsService as any).updateMetricsFromEvent(event);

      const metrics = metricsService.getMetrics('session-id');
      expect(metrics?.ragCallCount).toBe(1);
      expect(metrics?.eventCount).toBe(1);
    });
  });

  describe('closeMetrics', () => {
    beforeEach(() => {
      metricsService.createMetrics('session-id', 'tenant-id');
    });

    it('should close metrics', () => {
      const metrics = metricsService.closeMetrics('session-id');

      expect(metrics?.endTime).toBeDefined();
    });

    it('should calculate average response time', () => {
      const metrics = metricsService.getMetrics('session-id');
      if (metrics) {
        metrics.eventCount = 10;
        metrics.startTime = Date.now() - 1000;
      }

      const closed = metricsService.closeMetrics('session-id');

      expect(closed?.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('getMetricsByTenant', () => {
    beforeEach(() => {
      metricsService.createMetrics('session-1', 'tenant-1');
      metricsService.createMetrics('session-2', 'tenant-2');
    });

    it('should filter metrics by tenant', () => {
      const metrics = metricsService.getMetricsByTenant('tenant-1');

      expect(metrics).toHaveLength(1);
      expect(metrics[0].tenantId).toBe('tenant-1');
    });
  });
});







