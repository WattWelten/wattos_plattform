import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CircuitBreakerService, CircuitState } from '../circuit-breaker.service';
import { ConfigService } from '@nestjs/config';

describe('CircuitBreakerService', () => {
  let circuitBreaker: CircuitBreakerService;
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

  describe('execute', () => {
    it('should execute operation when circuit is closed', async () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);
      const operation = vi.fn().mockResolvedValue('success');

      const result = await circuitBreaker.execute('test-circuit', operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.CLOSED);
    });

    it('should open circuit after failure threshold', async () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);
      const error = new Error('service error');
      const operation = vi.fn().mockRejectedValue(error);

      // Execute until failure threshold (default: 5)
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute('test-circuit', operation);
        } catch {
          // Ignore errors
        }
      }

      // Circuit should be open now
      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.OPEN);

      // Next request should be rejected immediately
      await expect(
        circuitBreaker.execute('test-circuit', vi.fn().mockResolvedValue('success')),
      ).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to half-open after reset timeout', async () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);
      const error = new Error('service error');
      const operation = vi.fn().mockRejectedValue(error);

      // Open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute('test-circuit', operation, {
            failureThreshold: 3,
            resetTimeout: 1000,
          });
        } catch {
          // Ignore
        }
      }

      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.OPEN);

      // Fast-forward past reset timeout
      await vi.advanceTimersByTimeAsync(1000);

      // Circuit should be half-open
      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.HALF_OPEN);
    });

    it('should allow one request in half-open state', async () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);
      const error = new Error('service error');
      const failingOperation = vi.fn().mockRejectedValue(error);
      const successOperation = vi.fn().mockResolvedValue('success');

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('test-circuit', failingOperation, {
            failureThreshold: 3,
            resetTimeout: 1000,
          });
        } catch {
          // Ignore
        }
      }

      // Fast-forward to half-open
      await vi.advanceTimersByTimeAsync(1000);

      // First request in half-open should succeed
      const result = await circuitBreaker.execute('test-circuit', successOperation);

      expect(result).toBe('success');
      expect(successOperation).toHaveBeenCalledTimes(1);
    });

    it('should reject additional requests in half-open state', async () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);
      const error = new Error('service error');
      const failingOperation = vi.fn().mockRejectedValue(error);
      const successOperation = vi.fn().mockResolvedValue('success');

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('test-circuit', failingOperation, {
            failureThreshold: 3,
            resetTimeout: 1000,
          });
        } catch {
          // Ignore
        }
      }

      // Fast-forward to half-open
      await vi.advanceTimersByTimeAsync(1000);

      // First request should succeed
      await circuitBreaker.execute('test-circuit', successOperation);

      // Second request should be rejected
      await expect(
        circuitBreaker.execute('test-circuit', successOperation),
      ).rejects.toThrow('Circuit breaker is HALF_OPEN');
    });

    it('should close circuit after success in half-open', async () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);
      const error = new Error('service error');
      const failingOperation = vi.fn().mockRejectedValue(error);
      const successOperation = vi.fn().mockResolvedValue('success');

      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('test-circuit', failingOperation, {
            failureThreshold: 3,
            resetTimeout: 1000,
          });
        } catch {
          // Ignore
        }
      }

      // Fast-forward to half-open
      await vi.advanceTimersByTimeAsync(1000);

      // Success should close circuit
      await circuitBreaker.execute('test-circuit', successOperation);

      // Circuit should be closed
      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.CLOSED);
    });
  });

  describe('getCircuitState', () => {
    it('should return CLOSED for non-existent circuit', () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);

      const state = circuitBreaker.getCircuitState('non-existent');

      expect(state).toBe(CircuitState.CLOSED);
    });

    it('should return current state of circuit', async () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);
      const operation = vi.fn().mockResolvedValue('success');

      await circuitBreaker.execute('test-circuit', operation);

      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.CLOSED);
    });
  });

  describe('resetCircuit', () => {
    it('should reset circuit to closed state', async () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);
      const error = new Error('service error');
      const operation = vi.fn().mockRejectedValue(error);

      // Open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute('test-circuit', operation);
        } catch {
          // Ignore
        }
      }

      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.OPEN);

      // Reset circuit
      circuitBreaker.resetCircuit('test-circuit');

      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.CLOSED);
    });

    it('should allow operations after reset', async () => {
      circuitBreaker = new CircuitBreakerService(mockConfigService);
      const error = new Error('service error');
      const failingOperation = vi.fn().mockRejectedValue(error);
      const successOperation = vi.fn().mockResolvedValue('success');

      // Open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute('test-circuit', failingOperation);
        } catch {
          // Ignore
        }
      }

      // Reset
      circuitBreaker.resetCircuit('test-circuit');

      // Should work again
      const result = await circuitBreaker.execute('test-circuit', successOperation);

      expect(result).toBe('success');
    });
  });
});








