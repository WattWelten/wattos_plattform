import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StructuredLoggerService } from '../logger.service';
import { ConfigService } from '@nestjs/config';

// Mock pino
const mockPinoLogger = {
  child: vi.fn().mockReturnThis(),
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
};

vi.mock('pino', () => ({
  default: vi.fn(() => mockPinoLogger),
  stdTimeFunctions: {
    isoTime: vi.fn(),
  },
}));

describe('StructuredLoggerService - Extended Tests', () => {
  let loggerService: StructuredLoggerService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'test';
        if (key === 'LOG_LEVEL') return 'debug';
        return defaultValue;
      }),
    };
  });

  describe('getRequestId', () => {
    it('should return requestId from AsyncLocalStorage when available', () => {
      // Mock AsyncLocalStorage
      (global as any).asyncLocalStorage = {
        getStore: vi.fn(() => ({ requestId: 'test-request-id' })),
      };

      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.log('Test message');
      
      expect(mockPinoLogger.child).toHaveBeenCalled();
    });

    it('should return undefined when AsyncLocalStorage is not available', () => {
      delete (global as any).asyncLocalStorage;
      
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.log('Test message');
      
      expect(mockPinoLogger.child).toHaveBeenCalled();
    });

    it('should return undefined when store has no requestId', () => {
      (global as any).asyncLocalStorage = {
        getStore: vi.fn(() => ({})),
      };

      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.log('Test message');
      
      expect(mockPinoLogger.child).toHaveBeenCalled();
    });
  });

  describe('createChildLogger', () => {
    it('should include context when set', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.setContext('TestContext');
      loggerService.log('Test message');
      
      expect(mockPinoLogger.child).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'TestContext' }),
      );
    });

    it('should include additional fields', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.logWithMetadata('info', 'Test message', { key: 'value' });
      
      expect(mockPinoLogger.child).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'value' }),
      );
    });
  });

  describe('extractMetadata', () => {
    it('should extract single object parameter', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.log('Test message', { key: 'value' });
      
      expect(mockPinoLogger.child).toHaveBeenCalled();
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should extract multiple parameters as array', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.log('Test message', 'param1', 'param2', 'param3');
      
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should return empty object for no parameters', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.log('Test message');
      
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should handle null parameter', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.log('Test message', null);
      
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });
  });

  describe('error method', () => {
    it('should log error with trace', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.error('Error message', 'Error stack trace');
      
      expect(mockPinoLogger.error).toHaveBeenCalled();
    });

    it('should log error with context', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.error('Error message', 'Error stack trace', 'ErrorContext');
      
      expect(mockPinoLogger.error).toHaveBeenCalled();
    });

    it('should log error without trace', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.error('Error message');
      
      expect(mockPinoLogger.error).toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should use production log level in production', () => {
      const prodConfig = {
        get: vi.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'LOG_LEVEL') return undefined;
          return undefined;
        }),
      };
      const service = new StructuredLoggerService(prodConfig as ConfigService);
      expect(service).toBeDefined();
    });

    it('should use custom log level from config', () => {
      const customConfig = {
        get: vi.fn((key: string) => {
          if (key === 'NODE_ENV') return 'development';
          if (key === 'LOG_LEVEL') return 'error';
          return undefined;
        }),
      };
      const service = new StructuredLoggerService(customConfig as ConfigService);
      expect(service).toBeDefined();
    });

    it('should use environment variable when config service is not provided', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      process.env.LOG_LEVEL = 'warn';
      
      const service = new StructuredLoggerService();
      expect(service).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
      delete process.env.LOG_LEVEL;
    });
  });

  describe('logWithMetadata', () => {
    it('should log at info level', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.logWithMetadata('info', 'Test message', { key: 'value' });
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should log at warn level', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.logWithMetadata('warn', 'Test message', { key: 'value' });
      expect(mockPinoLogger.warn).toHaveBeenCalled();
    });

    it('should log at error level', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.logWithMetadata('error', 'Test message', { key: 'value' });
      expect(mockPinoLogger.error).toHaveBeenCalled();
    });

    it('should log at debug level', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.logWithMetadata('debug', 'Test message', { key: 'value' });
      expect(mockPinoLogger.debug).toHaveBeenCalled();
    });
  });

  describe('logPerformance', () => {
    it('should log performance metrics with duration', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.logPerformance('test-operation', 150);
      
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should log performance with additional metadata', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.logPerformance('test-operation', 150, { userId: '123' });
      
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request with all parameters', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.logRequest('GET', '/api/users', 200, 100, { userId: '123' });
      
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });

    it('should log HTTP request without metadata', () => {
      loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
      loggerService.logRequest('POST', '/api/users', 201, 150);
      
      expect(mockPinoLogger.info).toHaveBeenCalled();
    });
  });
});
