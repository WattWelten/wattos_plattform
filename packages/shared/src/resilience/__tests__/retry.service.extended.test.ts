import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetryService } from '../retry.service';
import { ConfigService } from '@nestjs/config';

describe('RetryService - Extended Tests', () => {
  let retryService: RetryService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'RETRY_MAX_ATTEMPTS') return 3;
        if (key === 'RETRY_INITIAL_DELAY') return 100;
        if (key === 'RETRY_MAX_DELAY') return 1000;
        if (key === 'RETRY_BACKOFF_MULTIPLIER') return 2;
        return defaultValue;
      }),
    };
  });

  describe('executeWithRetry - Error Types', () => {
    it('should retry on ECONNREFUSED error', async () => {
      retryService = new RetryService(mockConfigService);
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          const error: any = new Error('Connection refused');
          error.code = 'ECONNREFUSED';
          throw error;
        }
        return 'success';
      });

      const result = await retryService.executeWithRetry(operation);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should retry on ETIMEDOUT error', async () => {
      retryService = new RetryService(mockConfigService);
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          const error: any = new Error('Timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        }
        return 'success';
      });

      const result = await retryService.executeWithRetry(operation);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should retry on 5xx HTTP errors', async () => {
      retryService = new RetryService(mockConfigService);
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          const error: any = new Error('Server error');
          error.response = { status: 500 };
          throw error;
        }
        return 'success';
      });

      const result = await retryService.executeWithRetry(operation);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should not retry on 4xx HTTP errors', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi.fn(async () => {
        const error: any = new Error('Bad request');
        error.response = { status: 400 };
        throw error;
      });

      await expect(retryService.executeWithRetry(operation)).rejects.toThrow('Bad request');
    });

    it('should not retry on non-retryable errors', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi.fn(async () => {
        throw new Error('Non-retryable error');
      });

      await expect(retryService.executeWithRetry(operation)).rejects.toThrow('Non-retryable error');
    });

    it('should use custom retryableErrors function', async () => {
      retryService = new RetryService(mockConfigService);
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Custom retryable error');
        }
        return 'success';
      });

      const result = await retryService.executeWithRetry(operation, {
        retryableErrors: (error) => {
          return error instanceof Error && error.message.includes('Custom retryable');
        },
      });

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should not retry when custom retryableErrors returns false', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi.fn(async () => {
        throw new Error('Non-retryable');
      });

      await expect(
        retryService.executeWithRetry(operation, {
          retryableErrors: () => false,
        }),
      ).rejects.toThrow('Non-retryable');
    });
  });

  describe('executeWithRetry - Backoff Behavior', () => {
    it('should use exponential backoff', async () => {
      retryService = new RetryService(mockConfigService);
      const delays: number[] = [];
      const originalSleep = retryService['sleep'];
      retryService['sleep'] = vi.fn(async (ms: number) => {
        delays.push(ms);
        return originalSleep.call(retryService, 0); // Fast for testing
      });

      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          const error: any = new Error('Retryable');
          error.code = 'ECONNREFUSED';
          throw error;
        }
        return 'success';
      });

      await retryService.executeWithRetry(operation, {
        initialDelay: 100,
        backoffMultiplier: 2,
      });

      expect(delays.length).toBe(2);
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBe(200); // 100 * 2
    });

    it('should cap delay at maxDelay', async () => {
      retryService = new RetryService(mockConfigService);
      const delays: number[] = [];
      const originalSleep = retryService['sleep'];
      retryService['sleep'] = vi.fn(async (ms: number) => {
        delays.push(ms);
        return originalSleep.call(retryService, 0);
      });

      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 4) {
          const error: any = new Error('Retryable');
          error.code = 'ECONNREFUSED';
          throw error;
        }
        return 'success';
      });

      await retryService.executeWithRetry(operation, {
        initialDelay: 500,
        backoffMultiplier: 2,
        maxDelay: 1000,
      });

      // Third delay should be capped at 1000 (not 2000)
      expect(delays[2]).toBeLessThanOrEqual(1000);
    });
  });

  describe('executeWithRetry - Options Override', () => {
    it('should override maxAttempts from options', async () => {
      retryService = new RetryService(mockConfigService);
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        const error: any = new Error('Retryable');
        error.code = 'ECONNREFUSED';
        throw error;
      });

      await expect(
        retryService.executeWithRetry(operation, {
          maxAttempts: 2,
        }),
      ).rejects.toThrow();

      expect(attempts).toBe(2);
    });

    it('should use config values when options not provided', async () => {
      retryService = new RetryService(mockConfigService);
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          const error: any = new Error('Retryable');
          error.code = 'ECONNREFUSED';
          throw error;
        }
        return 'success';
      });

      const result = await retryService.executeWithRetry(operation);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
  });

  describe('executeWithRetryAndCircuitBreaker', () => {
    it('should execute operation through circuit breaker', async () => {
      retryService = new RetryService(mockConfigService);
      const mockCircuitBreaker = {
        execute: vi.fn(async (name: string, operation: () => Promise<string>) => {
          return operation();
        }),
      };

      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryService.executeWithRetryAndCircuitBreaker(
        mockCircuitBreaker as any,
        'test-circuit',
        operation,
      );

      expect(result).toBe('success');
      expect(mockCircuitBreaker.execute).toHaveBeenCalledWith('test-circuit', expect.any(Function));
    });
  });

  describe('executeWithRetry - Edge Cases', () => {
    it('should handle non-Error exceptions', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi.fn(async () => {
        throw 'String error';
      });

      await expect(retryService.executeWithRetry(operation)).rejects.toBe('String error');
    });

    it('should handle null errors', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi.fn(async () => {
        throw null;
      });

      await expect(retryService.executeWithRetry(operation)).rejects.toBeNull();
    });

    it('should succeed on first attempt', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryService.executeWithRetry(operation);
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});
