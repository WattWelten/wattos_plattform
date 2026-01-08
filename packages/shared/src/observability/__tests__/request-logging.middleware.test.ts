import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestLoggingMiddleware } from '../request-logging.middleware';
import { StructuredLoggerService } from '../logger.service';
import { MetricsService } from '../metrics.service';
import { Request, Response } from 'express';

describe('RequestLoggingMiddleware', () => {
  let middleware: RequestLoggingMiddleware;
  let mockLogger: Partial<StructuredLoggerService>;
  let mockMetrics: Partial<MetricsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockLogger = {
      setContext: vi.fn().mockReturnThis(),
      debug: vi.fn(),
      logRequest: vi.fn(),
      error: vi.fn(),
      logWithMetadata: vi.fn(),
    };

    mockMetrics = {
      recordHttpRequest: vi.fn(),
    };

    middleware = new RequestLoggingMiddleware(
      mockLogger as StructuredLoggerService,
      mockMetrics as MetricsService,
    );

    mockRequest = {
      method: 'GET',
      url: '/api/test',
      originalUrl: '/api/test',
      headers: { 'user-agent': 'test-agent' },
      ip: '127.0.0.1',
    };

    mockResponse = {
      on: vi.fn(),
      statusCode: 200,
    };

    mockNext = vi.fn();
  });

  it('should log incoming request', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockLogger.debug).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log request completion on finish', () => {
    let finishCallback: () => void;
    (mockResponse.on as any).mockImplementation((event: string, callback: () => void) => {
      if (event === 'finish') {
        finishCallback = callback;
      }
    });

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    finishCallback!();

    expect(mockLogger.logRequest).toHaveBeenCalled();
    expect(mockMetrics.recordHttpRequest).toHaveBeenCalled();
  });

  it('should log errors on response error', () => {
    let errorCallback: (error: Error) => void;
    (mockResponse.on as any).mockImplementation((event: string, callback: (error?: Error) => void) => {
      if (event === 'error') {
        errorCallback = callback;
      }
    });

    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
    const testError = new Error('Test error');
    errorCallback!(testError);

    expect(mockLogger.error).toHaveBeenCalled();
  });
});
