/**
 * Tenant Middleware Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantMiddleware } from './tenant.middleware';
import { Request, Response, NextFunction } from 'express';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantMiddleware],
    }).compile();

    middleware = module.get<TenantMiddleware>(TenantMiddleware);

    mockRequest = {
      header: vi.fn(),
      get: vi.fn(),
      hostname: '',
    } as any;
    mockResponse = {};
    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('tenant resolution', () => {
    it('should resolve tenant from x-tenant-id header', () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      (mockRequest.header as ReturnType<typeof vi.fn>).mockReturnValue(tenantId);

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should resolve tenant from subdomain', () => {
      Object.defineProperty(mockRequest, 'hostname', {
        value: 'musterlandkreis.wattweiser.com',
        writable: true,
        configurable: true,
      });
      (mockRequest.header as ReturnType<typeof vi.fn>).mockReturnValue(null);

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).tenantId).toBe('musterlandkreis');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use default tenant when no header or subdomain', () => {
      Object.defineProperty(mockRequest, 'hostname', {
        value: 'wattweiser.com',
        writable: true,
        configurable: true,
      });
      (mockRequest.header as ReturnType<typeof vi.fn>).mockReturnValue(null);
      process.env.DEFAULT_TENANT_ID = 'default';

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).tenantId).toBe('default');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prioritize header over subdomain', () => {
      const tenantId = '123e4567-e89b-12d3-a456-426614174000';
      Object.defineProperty(mockRequest, 'hostname', {
        value: 'musterlandkreis.wattweiser.com',
        writable: true,
        configurable: true,
      });
      (mockRequest.header as ReturnType<typeof vi.fn>).mockReturnValue(tenantId);

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should ignore api subdomain', () => {
      Object.defineProperty(mockRequest, 'hostname', {
        value: 'api.wattweiser.com',
        writable: true,
        configurable: true,
      });
      (mockRequest.header as ReturnType<typeof vi.fn>).mockReturnValue(null);
      process.env.DEFAULT_TENANT_ID = 'default';

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).tenantId).toBe('default');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
