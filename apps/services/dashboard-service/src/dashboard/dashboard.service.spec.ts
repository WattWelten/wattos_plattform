/**
 * Dashboard Service Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { DashboardDataAggregationService } from './dashboard-data-aggregation.service';
import { PrismaService } from '@wattweiser/db';
import { CacheService } from '@wattweiser/shared';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrismaService: {
    client: {
      dashboard: {
        findUnique: ReturnType<typeof vi.fn>;
        findFirst: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
        findMany: ReturnType<typeof vi.fn>;
      };
    };
  };
  let mockDataAggregation: {
    aggregateDashboardData: ReturnType<typeof vi.fn>;
  };
  let mockCacheService: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    deletePattern: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockPrismaService = {
      client: {
        dashboard: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        },
      },
    };

    mockDataAggregation = {
      aggregateDashboardData: jest.fn().mockResolvedValue({
        id: 'dashboard-123',
        name: 'Test Dashboard',
        layout: { widgets: [] },
        widgets: {},
        updatedAt: new Date(),
      }),
    };

    mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      deletePattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DashboardDataAggregationService,
          useValue: mockDataAggregation,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getDashboard', () => {
    it('should return cached dashboard if available', async () => {
      const tenantId = 'tenant-123';
      const cachedDashboard = {
        id: 'dashboard-123',
        name: 'Cached Dashboard',
        layout: { widgets: [] },
        widgets: {},
        updatedAt: new Date(),
      };
      mockCacheService.get.mockResolvedValue(cachedDashboard);

      const result = await service.getDashboard(tenantId);

      expect(result).toEqual(cachedDashboard);
      expect(mockCacheService.get).toHaveBeenCalledWith(`dashboard:${tenantId}:default`);
      expect(mockPrismaService.client.dashboard.findFirst).not.toHaveBeenCalled();
    });

    it('should load dashboard from database if not cached', async () => {
      const tenantId = 'tenant-123';
      const dashboard = {
        id: 'dashboard-123',
        name: 'Test Dashboard',
        tenantId,
        layout: { widgets: [] },
        config: null,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.client.dashboard.findFirst.mockResolvedValue(dashboard);

      const result = await service.getDashboard(tenantId);

      expect(result).toBeDefined();
      expect(mockPrismaService.client.dashboard.findFirst).toHaveBeenCalledWith({
        where: { tenantId, isDefault: true },
      });
      expect(mockDataAggregation.aggregateDashboardData).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should load specific dashboard by ID', async () => {
      const tenantId = 'tenant-123';
      const dashboardId = 'dashboard-123';
      const dashboard = {
        id: dashboardId,
        name: 'Test Dashboard',
        tenantId,
        layout: { widgets: [] },
        config: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.client.dashboard.findUnique.mockResolvedValue(dashboard);

      const result = await service.getDashboard(tenantId, dashboardId);

      expect(result).toBeDefined();
      expect(mockPrismaService.client.dashboard.findUnique).toHaveBeenCalledWith({
        where: { id: dashboardId, tenantId },
      });
    });

    it('should throw error if dashboard not found', async () => {
      const tenantId = 'tenant-123';
      const dashboardId = 'dashboard-123';
      mockPrismaService.client.dashboard.findUnique.mockResolvedValue(null);

      await expect(service.getDashboard(tenantId, dashboardId)).rejects.toThrow('Dashboard not found');
    });
  });

  describe('createDashboard', () => {
    it('should create dashboard and invalidate cache', async () => {
      const tenantId = 'tenant-123';
      const name = 'New Dashboard';
      const layout = { widgets: [] };
      const createdDashboard = {
        id: 'dashboard-123',
        name,
        tenantId,
        layout,
        config: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.client.dashboard.create.mockResolvedValue(createdDashboard);

      const result = await service.createDashboard(tenantId, name, layout);

      expect(result).toEqual(createdDashboard);
      expect(mockPrismaService.client.dashboard.create).toHaveBeenCalled();
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(`dashboard:${tenantId}:*`);
    });
  });

  describe('updateDashboard', () => {
    it('should update dashboard and invalidate cache', async () => {
      const tenantId = 'tenant-123';
      const dashboardId = 'dashboard-123';
      const layout = { widgets: [] };
      const updatedDashboard = {
        id: dashboardId,
        name: 'Updated Dashboard',
        tenantId,
        layout,
        config: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.client.dashboard.update.mockResolvedValue(updatedDashboard);

      const result = await service.updateDashboard(tenantId, dashboardId, { layout });

      expect(result).toEqual(updatedDashboard);
      expect(mockPrismaService.client.dashboard.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: dashboardId, tenantId },
          data: expect.objectContaining({
            layout,
          }),
        }),
      );
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(`dashboard:${tenantId}:*`);
    });
  });

  describe('deleteDashboard', () => {
    it('should delete dashboard and invalidate cache', async () => {
      const tenantId = 'tenant-123';
      const dashboardId = 'dashboard-123';
      mockPrismaService.client.dashboard.delete.mockResolvedValue({} as any);

      await service.deleteDashboard(tenantId, dashboardId);

      expect(mockPrismaService.client.dashboard.delete).toHaveBeenCalledWith({
        where: { id: dashboardId, tenantId },
      });
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(`dashboard:${tenantId}:*`);
    });
  });
});
