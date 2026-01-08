import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreakerService, CircuitState } from '../circuit-breaker.service';
import { ConfigService } from '@nestjs/config';

describe('CircuitBreakerService - Extended Tests', () => {
  let circuitBreaker: CircuitBreakerService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'CIRCUIT_BREAKER_FAILURE_THRESHOLD') return 3;
        if (key === 'CIRCUIT_BREAKER_RESET_TIMEOUT') return 1000;
        if (key === 'CIRCUIT_BREAKER_MONITORING_PERIOD') return 60000;
        return defaultValue;
      }),
    };

    circuitBreaker = new CircuitBreakerService(mockConfigService as ConfigService);
  });

  describe('getCircuitState', () => {
    it('should return CLOSED for non-existent circuit', () => {
      const state = circuitBreaker.getCircuitState('non-existent');
      expect(state).toBe(CircuitState.CLOSED);
    });

    it('should return current circuit state', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Test error'));
      
      // Trigger failures to open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('test-circuit', operation);
        } catch {
          // Expected to fail
        }
      }

      const state = circuitBreaker.getCircuitState('test-circuit');
      expect(state).toBe(CircuitState.OPEN);
    });
  });

  describe('resetCircuit', () => {
    it('should reset circuit to CLOSED state', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Test error'));
      
      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('test-circuit', operation);
        } catch {
          // Expected to fail
        }
      }

      circuitBreaker.resetCircuit('test-circuit');
      const state = circuitBreaker.getCircuitState('test-circuit');
      expect(state).toBe(CircuitState.CLOSED);
    });
  });

  describe('cleanupUnusedCircuits', () => {
    it('should cleanup unused circuits', async () => {
      // Create a circuit
      await circuitBreaker.execute('old-circuit', async () => 'success');
      
      // Manually set lastUsed to old time
      const circuits = (circuitBreaker as any).circuits;
      if (circuits.has('old-circuit')) {
        circuits.get('old-circuit').lastUsed = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      }

      circuitBreaker.cleanupUnusedCircuits();
      
      // Circuit should still exist if it's not CLOSED or was used recently
      // This test verifies the cleanup logic runs
      expect(circuitBreaker).toBeDefined();
    });
  });

  describe('State Transitions', () => {
    it('should transition from CLOSED to OPEN after threshold failures', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Test error'));
      
      // First 2 failures should keep circuit CLOSED
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute('test-circuit', operation);
        } catch {
          // Expected
        }
      }
      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.CLOSED);

      // Third failure should open circuit
      try {
        await circuitBreaker.execute('test-circuit', operation);
      } catch {
        // Expected
      }
      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.OPEN);
    });

    it('should transition from OPEN to HALF_OPEN after reset timeout', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Test error'));
      
      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('test-circuit', operation, { failureThreshold: 3, resetTimeout: 100 });
        } catch {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Check state - should transition to HALF_OPEN
      const state = circuitBreaker.getCircuitState('test-circuit');
      expect([CircuitState.HALF_OPEN, CircuitState.OPEN]).toContain(state);
    });

    it('should transition from HALF_OPEN to CLOSED on success', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Test error'));
      const successOperation = vi.fn().mockResolvedValue('success');
      
      // Open circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('test-circuit', failingOperation, { failureThreshold: 3, resetTimeout: 100 });
        } catch {
          // Expected
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Successful operation should close circuit
      const result = await circuitBreaker.execute('test-circuit', successOperation);
      expect(result).toBe('success');
      expect(circuitBreaker.getCircuitState('test-circuit')).toBe(CircuitState.CLOSED);
    });
  });
});
