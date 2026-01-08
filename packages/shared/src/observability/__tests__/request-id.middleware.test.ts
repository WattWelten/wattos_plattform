import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestIdMiddleware } from '../request-id.middleware';
import { Request, Response, NextFunction } from 'express';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new RequestIdMiddleware();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should generate new request ID if not present in header', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing request ID from header', () => {
    mockRequest.headers = { 'x-request-id': 'existing-id-123' };
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id-123');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should add request ID to request object', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect((mockRequest as any).requestId).toBeDefined();
  });
});
