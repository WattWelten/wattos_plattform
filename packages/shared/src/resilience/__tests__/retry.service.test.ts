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
        retryableErrors: () => true,
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
        retryableErrors: () => true,
      }).catch(err => err);

      // Wait for the promise to settle

      // Ensure the promise rejection is handled

      // Fast-forward time for all retries
      await vi.advanceTimersByTimeAsync(300);

      const result = await resultPromise;
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('persistent failure');
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
        retryableErrors: () => true,
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








