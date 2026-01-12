/**
 * Widget Service Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { WidgetService } from './widget.service';
import { PrismaService } from '@wattweiser/db';
import { CacheService } from '@wattweiser/shared';

describe('WidgetService', () => {
  let service: WidgetService;
  let mockPrismaService: {
    client: {
      widget: {
        create: ReturnType<typeof vi.fn>;
        findUnique: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
        findMany: ReturnType<typeof vi.fn>;
      };
    };
  };
  let mockCacheService: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    deletePattern: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockPrismaService = {
      client: {
        widget: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        },
      },
    };

    mockCacheService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      deletePattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<WidgetService>(WidgetService);
  });

  describe('createWidget', () => {
    it('should create widget and invalidate cache', async () => {
      const tenantId = 'tenant-123';
      const widgetData = {
        type: 'kpi',
        name: 'Test Widget',
        config: {},
        position: { x: 0, y: 0 },
      };
      const createdWidget = {
        id: 'widget-123',
        tenantId,
        ...widgetData,
        dashboardId: null,
        characterId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.client.widget.create.mockResolvedValue(createdWidget as any);

      const result = await service.createWidget(tenantId, widgetData);

      expect(result).toEqual(createdWidget);
      expect(mockPrismaService.client.widget.create).toHaveBeenCalled();
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(`widgets:${tenantId}:*`);
    });
  });

  describe('getWidget', () => {
    it('should return cached widget if available', async () => {
      const tenantId = 'tenant-123';
      const widgetId = 'widget-123';
      const cachedWidget = {
        id: widgetId,
        name: 'Cached Widget',
        type: 'kpi',
      };
      mockCacheService.get.mockResolvedValue(cachedWidget);

      const result = await service.getWidget(tenantId, widgetId);

      expect(result).toEqual(cachedWidget);
      expect(mockCacheService.get).toHaveBeenCalledWith(`widgets:${tenantId}:${widgetId}`);
      expect(mockPrismaService.client.widget.findUnique).not.toHaveBeenCalled();
    });

    it('should load widget from database if not cached', async () => {
      const tenantId = 'tenant-123';
      const widgetId = 'widget-123';
      const widget = {
        id: widgetId,
        tenantId,
        name: 'Test Widget',
        type: 'kpi',
        config: {},
        position: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.client.widget.findUnique.mockResolvedValue(widget as any);

      const result = await service.getWidget(tenantId, widgetId);

      expect(result).toEqual(widget);
      expect(mockPrismaService.client.widget.findUnique).toHaveBeenCalledWith({
        where: { id: widgetId, tenantId },
        include: {
          dashboard: true,
          character: true,
        },
      });
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('updateWidget', () => {
    it('should update widget and invalidate cache', async () => {
      const tenantId = 'tenant-123';
      const widgetId = 'widget-123';
      const updateData = { name: 'Updated Widget' };
      const updatedWidget = {
        id: widgetId,
        tenantId,
        name: 'Updated Widget',
        type: 'kpi',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.client.widget.update.mockResolvedValue(updatedWidget as any);

      const result = await service.updateWidget(tenantId, widgetId, updateData);

      expect(result).toEqual(updatedWidget);
      expect(mockPrismaService.client.widget.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: widgetId, tenantId },
          data: expect.objectContaining({
            name: 'Updated Widget',
          }),
          include: {
            dashboard: true,
            character: true,
          },
        }),
      );
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(`widgets:${tenantId}:*`);
    });
  });

  describe('deleteWidget', () => {
    it('should delete widget and invalidate cache', async () => {
      const tenantId = 'tenant-123';
      const widgetId = 'widget-123';
      const widget = {
        id: widgetId,
        tenantId,
        dashboardId: null,
        name: 'Test Widget',
        type: 'kpi',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.client.widget.findUnique.mockResolvedValue(widget as any);
      mockPrismaService.client.widget.delete.mockResolvedValue({} as any);

      await service.deleteWidget(tenantId, widgetId);

      expect(mockPrismaService.client.widget.findUnique).toHaveBeenCalledWith({
        where: { id: widgetId, tenantId },
      });
      expect(mockPrismaService.client.widget.delete).toHaveBeenCalledWith({
        where: { id: widgetId, tenantId },
      });
      expect(mockCacheService.deletePattern).toHaveBeenCalledWith(`widgets:${tenantId}:*`);
    });
  });
});
