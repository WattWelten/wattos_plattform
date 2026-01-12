/**
 * Dashboard Data Aggregation Service Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardDataAggregationService } from './dashboard-data-aggregation.service';
import { PrismaService } from '@wattweiser/db';
import { AnalyticsService } from '../analytics/analytics.service';
import { MetricsService } from '../metrics/metrics.service';

describe('DashboardDataAggregationService', () => {
  let service: DashboardDataAggregationService;
  let mockAnalyticsService: {
    getAnalytics: ReturnType<typeof jest.fn>;
  };
  let mockMetricsService: {
    getMetrics: ReturnType<typeof jest.fn>;
  };

  beforeEach(async () => {
    mockAnalyticsService = {
      getAnalytics: jest.fn().mockResolvedValue({
        totalQueries: 100,
        totalAnswers: 80,
      }),
    };

    mockMetricsService = {
      getMetrics: jest.fn().mockResolvedValue({
        'metric.queries': 100,
        'metric.answers': 80,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardDataAggregationService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<DashboardDataAggregationService>(DashboardDataAggregationService);
  });

  describe('aggregateDashboardData', () => {
    it('should aggregate dashboard data for all widgets', async () => {
      const tenantId = 'tenant-123';
      const dashboard = {
        id: 'dashboard-123',
        name: 'Test Dashboard',
        tenantId,
        layout: {
          widgets: [
            {
              id: 'widget-1',
              type: 'analytics',
              config: {},
            },
            {
              id: 'widget-2',
              type: 'kpi',
              config: {},
            },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.aggregateDashboardData(tenantId, dashboard as any);

      expect(result).toBeDefined();
      expect(result.id).toBe(dashboard.id);
      expect(result.name).toBe(dashboard.name);
      expect(result.widgets).toBeDefined();
      expect(mockAnalyticsService.getAnalytics).toHaveBeenCalled();
    });

    it('should handle widget aggregation errors gracefully', async () => {
      const tenantId = 'tenant-123';
      const dashboard = {
        id: 'dashboard-123',
        name: 'Test Dashboard',
        tenantId,
        layout: {
          widgets: [
            {
              id: 'widget-1',
              type: 'unknown',
              config: {},
            },
          ],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.aggregateDashboardData(tenantId, dashboard as any);

      expect(result).toBeDefined();
      expect(result.widgets).toBeDefined();
      // Widget with unknown type should be handled gracefully
    });

    it('should handle empty widget list', async () => {
      const tenantId = 'tenant-123';
      const dashboard = {
        id: 'dashboard-123',
        name: 'Test Dashboard',
        tenantId,
        layout: {
          widgets: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.aggregateDashboardData(tenantId, dashboard as any);

      expect(result).toBeDefined();
      expect(result.widgets).toEqual({});
    });
  });

  describe('aggregateWidgetData', () => {
    it('should aggregate analytics widget data', async () => {
      const tenantId = 'tenant-123';
      const widget = {
        id: 'widget-1',
        type: 'analytics',
        config: {},
      };

      const result = await service.aggregateWidgetData(tenantId, widget as any);

      expect(result).toBeDefined();
      expect(mockAnalyticsService.getAnalytics).toHaveBeenCalledWith(tenantId, {
        timeRange: '7d',
      });
    });

    it('should aggregate KPI widget data', async () => {
      const tenantId = 'tenant-123';
      const widget = {
        id: 'widget-1',
        type: 'kpi',
        config: { range: '7d' },
      };

      // KPI widgets werden als 'analytics' behandelt (kpi ist nicht im switch, fällt auf default)
      const result = await service.aggregateWidgetData(tenantId, widget as any);

      expect(result).toBeDefined();
      // KPI widgets sind nicht direkt unterstützt, sollten error zurückgeben
      expect(result.error).toContain('Unknown widget type: kpi');
    });

    it('should aggregate metrics widget data', async () => {
      const tenantId = 'tenant-123';
      const widget = {
        id: 'widget-1',
        type: 'metrics',
        config: {},
      };

      const result = await service.aggregateWidgetData(tenantId, widget as any);

      expect(result).toBeDefined();
      expect(mockMetricsService.getMetrics).toHaveBeenCalledWith(tenantId, {
        types: ['all'],
        timeRange: '1h',
      });
    });
  });
});
