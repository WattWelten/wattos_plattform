import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthController } from '../health.controller';
import { HealthService } from '../health.service';
import { MetricsService } from '../metrics.service';

describe('HealthController', () => {
  let healthController: HealthController;
  let mockHealthService: Partial<HealthService>;
  let mockMetricsService: Partial<MetricsService>;

  beforeEach(() => {
    mockHealthService = {
      liveness: vi.fn().mockResolvedValue({ status: 'alive' }),
      readiness: vi.fn().mockResolvedValue({ status: 'ready' }),
      checkHealth: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {},
      }),
    };

    mockMetricsService = {
      exportPrometheus: vi.fn().mockReturnValue('test_metric 1\n'),
      getKpiMetrics: vi.fn().mockReturnValue({
        httpRequests: { total: 0, success: 0, error: 0, avgDuration: 0 },
        llmCalls: { total: 0, totalTokens: 0, totalCost: 0, avgDuration: 0 },
        dbQueries: { total: 0, success: 0, failed: 0, avgDuration: 0 },
        cacheOperations: { hits: 0, misses: 0, hitRate: 0 },
      }),
    };
  });

  describe('liveness', () => {
    it('should return liveness status', async () => {
      healthController = new HealthController(
        mockHealthService as HealthService,
        mockMetricsService as MetricsService,
      );
      const result = await healthController.liveness();
      expect(result).toEqual({ status: 'alive' });
    });
  });

  describe('readiness', () => {
    it('should return readiness status', async () => {
      healthController = new HealthController(
        mockHealthService as HealthService,
        mockMetricsService as MetricsService,
      );
      const result = await healthController.readiness();
      expect(result).toEqual({ status: 'ready' });
    });
  });

  describe('health', () => {
    it('should return full health check', async () => {
      healthController = new HealthController(
        mockHealthService as HealthService,
        mockMetricsService as MetricsService,
      );
      const result = await healthController.health();
      expect(result).toHaveProperty('status', 'healthy');
    });
  });

  describe('metrics', () => {
    it('should return Prometheus metrics when available', async () => {
      healthController = new HealthController(
        mockHealthService as HealthService,
        mockMetricsService as MetricsService,
      );
      const result = await healthController.metrics();
      expect(result).toBe('test_metric 1\n');
    });

    it('should return error when metrics service not available', async () => {
      healthController = new HealthController(mockHealthService as HealthService);
      const result = await healthController.metrics();
      expect(result).toBe('# Metrics service not available\n');
    });
  });

  describe('kpi', () => {
    it('should return KPI metrics when available', async () => {
      healthController = new HealthController(
        mockHealthService as HealthService,
        mockMetricsService as MetricsService,
      );
      const result = await healthController.kpi();
      expect(result).toHaveProperty('httpRequests');
    });

    it('should return error when metrics service not available', async () => {
      healthController = new HealthController(mockHealthService as HealthService);
      const result = await healthController.kpi();
      expect(result).toEqual({ error: 'Metrics service not available' });
    });
  });
});
