/**
 * Tenant Middleware Unit Tests
 */

// Jest globals are available without import
import { TenantMiddleware } from './tenant.middleware';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new TenantMiddleware();
    mockRequest = {
      header: jest.fn(),
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('use', () => {
    it('should use existing tenantId from request', () => {
      (mockRequest as any).tenantId = '123e4567-e89b-12d3-a456-426614174000';

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).tenantId).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should extract tenantId from X-Tenant-Id header', () => {
      (mockRequest.header as ReturnType<typeof jest.fn>).mockReturnValue('123e4567-e89b-12d3-a456-426614174000');

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.header).toHaveBeenCalledWith('x-tenant-id');
      expect((mockRequest as any).tenantId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should extract tenantId from user.tenantId', () => {
      (mockRequest as any).user = {
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).tenantId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use DEFAULT_TENANT_ID if set', () => {
      const originalEnv = process.env.DEFAULT_TENANT_ID;
      process.env.DEFAULT_TENANT_ID = '123e4567-e89b-12d3-a456-426614174000';

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).tenantId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockNext).toHaveBeenCalled();

      process.env.DEFAULT_TENANT_ID = originalEnv;
    });

    it('should continue without tenantId if none found', () => {
      // Stelle sicher, dass DEFAULT_TENANT_ID nicht gesetzt ist
      const originalEnv = process.env.DEFAULT_TENANT_ID;
      delete process.env.DEFAULT_TENANT_ID;

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as any).tenantId).toBeUndefined();

      // Stelle ursprünglichen Wert wieder her
      if (originalEnv) {
        process.env.DEFAULT_TENANT_ID = originalEnv;
      }
    });
  });
});
