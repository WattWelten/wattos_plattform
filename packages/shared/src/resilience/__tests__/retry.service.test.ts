import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RetryService } from '../retry.service';
import { ConfigService } from '@nestjs/config';

describe('RetryService', () => {
  let retryService: RetryService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    vi.useFakeTimers();
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => defaultValue),
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryService.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const resultPromise = retryService.executeWithRetry(operation, {
        maxAttempts: 3,
        initialDelay: 100,
      });

      // Fast-forward time for retry
      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max attempts', async () => {
      retryService = new RetryService(mockConfigService);
      const error = new Error('persistent failure');
      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = retryService.executeWithRetry(operation, {
        maxAttempts: 2,
        initialDelay: 100,
      });

      // Fast-forward time for all retries
      await vi.advanceTimersByTimeAsync(300);

      await expect(resultPromise).rejects.toThrow('persistent failure');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValueOnce('success');

      const resultPromise = retryService.executeWithRetry(operation, {
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
      });

      // First retry after 100ms
      await vi.advanceTimersByTimeAsync(100);
      // Second retry after 200ms (doubled)
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should respect maxDelay', async () => {
      retryService = new RetryService(mockConfigService);
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const resultPromise = retryService.executeWithRetry(operation, {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 10, // Would be 10000ms, but capped at 2000ms
      });

      // Should wait maxDelay (2000ms), not 10000ms
      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result).toBe('success');
    });

    it('should not retry non-retryable errors', async () => {
      retryService = new RetryService(mockConfigService);
      const error = new Error('not retryable');
      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = retryService.executeWithRetry(operation, {
        maxAttempts: 3,
        retryableErrors: (err) => false, // Never retry
      });

      await expect(resultPromise).rejects.toThrow('not retryable');
      expect(operation).toHaveBeenCalledTimes(1); // Only one attempt
    });

    it('should retry network errors by default', async () => {
      retryService = new RetryService(mockConfigService);
      const networkError = { code: 'ECONNREFUSED' };
      const operation = vi
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const resultPromise = retryService.executeWithRetry(operation, {
        maxAttempts: 3,
        initialDelay: 100,
      });

      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry 5xx errors by default', async () => {
      retryService = new RetryService(mockConfigService);
      const serverError = { response: { status: 500 } };
      const operation = vi
        .fn()
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce('success');

      const resultPromise = retryService.executeWithRetry(operation, {
        maxAttempts: 3,
        initialDelay: 100,
      });

      await vi.advanceTimersByTimeAsync(100);

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('executeWithRetryAndCircuitBreaker', () => {
    it('should combine retry with circuit breaker', async () => {
      retryService = new RetryService(mockConfigService);
      const mockCircuitBreaker = {
        execute: vi.fn((name: string, op: () => Promise<any>) => op()),
      };
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryService.executeWithRetryAndCircuitBreaker(
        mockCircuitBreaker,
        'test-circuit',
        operation,
      );

      expect(result).toBe('success');
      expect(mockCircuitBreaker.execute).toHaveBeenCalledWith('test-circuit', expect.any(Function));
      expect(operation).toHaveBeenCalled();
    });
  });
});






