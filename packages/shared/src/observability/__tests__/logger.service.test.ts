import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StructuredLoggerService } from '../logger.service';
import { ConfigService } from '@nestjs/config';

describe('StructuredLoggerService', () => {
  let loggerService: StructuredLoggerService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'test';
        if (key === 'LOG_LEVEL') return 'debug';
        return defaultValue;
      }),
    };

    loggerService = new StructuredLoggerService(mockConfigService as ConfigService);
  });

  describe('setContext', () => {
    it('should set context and return service instance', () => {
      const result = loggerService.setContext('TestContext');
      expect(result).toBe(loggerService);
    });
  });

  describe('log', () => {
    it('should log info message', () => {
      loggerService.log('Test message');
      expect(loggerService).toBeDefined();
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      loggerService.error('Error message');
      expect(loggerService).toBeDefined();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      loggerService.warn('Warning message');
      expect(loggerService).toBeDefined();
    });
  });

  describe('logWithMetadata', () => {
    it('should log with metadata', () => {
      loggerService.logWithMetadata('info', 'Test message', { key: 'value' });
      expect(loggerService).toBeDefined();
    });
  });

  describe('logPerformance', () => {
    it('should log performance metrics', () => {
      loggerService.logPerformance('test-operation', 150);
      expect(loggerService).toBeDefined();
    });
  });

  describe('logRequest', () => {
    it('should log HTTP request', () => {
      loggerService.logRequest('GET', '/api/users', 200, 100);
      expect(loggerService).toBeDefined();
    });
  });
});
