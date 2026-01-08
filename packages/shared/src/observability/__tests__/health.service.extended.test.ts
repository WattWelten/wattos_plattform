import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthService } from '../health.service';
import { ConfigService } from '@nestjs/common';

// Mock redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    ping: vi.fn(),
    isOpen: false,
    on: vi.fn(),
    quit: vi.fn(),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('HealthService - Extended Tests', () => {
  let healthService: HealthService;
  let mockConfigService: Partial<ConfigService>;
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        if (key === 'LLM_GATEWAY_URL') return 'http://localhost:3009';
        if (key === 'RAG_SERVICE_URL') return 'http://localhost:3007';
        return defaultValue;
      }),
    };

    mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
  });

  describe('checkDatabase', () => {
    it('should return down when Prisma is not available', async () => {
      healthService = new HealthService(undefined, undefined);
      const result = await healthService.checkDatabase();
      expect(result.status).toBe('down');
      expect(result.message).toContain('not available');
    });

    it('should return down when Prisma is not properly initialized', async () => {
      healthService = new HealthService(mockConfigService as ConfigService, {});
      const result = await healthService.checkDatabase();
      expect(result.status).toBe('down');
      expect(result.message).toContain('not properly initialized');
    });

    it('should return up when database query succeeds', async () => {
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.checkDatabase();
      expect(result.status).toBe('up');
      expect(result.responseTime).toBeDefined();
    });

    it('should return down when database query fails', async () => {
      mockPrisma.$queryRaw = vi.fn().mockRejectedValue(new Error('Database connection failed'));
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.checkDatabase();
      expect(result.status).toBe('down');
      expect(result.message).toContain('Database connection failed');
      expect(result.responseTime).toBeDefined();
    });

    it('should handle non-Error exceptions', async () => {
      mockPrisma.$queryRaw = vi.fn().mockRejectedValue('String error');
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.checkDatabase();
      expect(result.status).toBe('down');
      expect(result.message).toBe('Unknown error');
    });
  });

  describe('checkRedis', () => {
    it('should return down when Redis URL is not configured', async () => {
      const noRedisConfig = {
        get: vi.fn((key: string) => {
          if (key === 'REDIS_URL') return undefined;
          return undefined;
        }),
      };
      healthService = new HealthService(noRedisConfig as ConfigService, mockPrisma);
      const result = await healthService.checkRedis();
      expect(result.status).toBe('down');
      expect(result.message).toContain('not configured');
    });
  });

  describe('checkLlmGateway', () => {
    it('should return up when LLM Gateway responds with 200', async () => {
      (global.fetch as any) = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.checkLlmGateway();
      
      expect(result.status).toBe('up');
      expect(result.responseTime).toBeDefined();
    });

    it('should return down when LLM Gateway responds with non-200', async () => {
      (global.fetch as any) = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.checkLlmGateway();
      
      expect(result.status).toBe('down');
      expect(result.message).toContain('HTTP 500');
    });

    it('should return down when LLM Gateway request fails', async () => {
      (global.fetch as any) = vi.fn().mockRejectedValue(new Error('Network error'));
      
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.checkLlmGateway();
      
      expect(result.status).toBe('down');
      expect(result.message).toContain('Network error');
    });
  });

  describe('checkRagService', () => {
    it('should return up when RAG Service responds with 200', async () => {
      (global.fetch as any) = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.checkRagService();
      
      expect(result.status).toBe('up');
    });

    it('should return down when RAG Service responds with non-200', async () => {
      (global.fetch as any) = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });
      
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.checkRagService();
      
      expect(result.status).toBe('down');
      expect(result.message).toContain('HTTP 503');
    });
  });

  describe('checkHealth', () => {
    it('should return healthy when all checks pass', async () => {
      (global.fetch as any) = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      
      const result = await healthService.checkHealth();
      
      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('redis');
      expect(result.checks).toHaveProperty('llm_gateway');
      expect(result.checks).toHaveProperty('rag_service');
    });

    it('should return unhealthy when database is down', async () => {
      mockPrisma.$queryRaw = vi.fn().mockRejectedValue(new Error('DB error'));
      (global.fetch as any) = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      
      const result = await healthService.checkHealth();
      
      expect(result.status).toBe('unhealthy');
    });

    it('should return degraded when non-critical services are down', async () => {
      (global.fetch as any) = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 500 }) // LLM Gateway down
        .mockResolvedValueOnce({ ok: true, status: 200 }); // RAG Service up
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      
      const result = await healthService.checkHealth();
      
      expect(result.status).toBe('degraded');
    });
  });

  describe('readiness', () => {
    it('should return ready when database is up', async () => {
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.readiness();
      expect(result.status).toBe('ready');
    });

    it('should return not_ready when database is down', async () => {
      mockPrisma.$queryRaw = vi.fn().mockRejectedValue(new Error('DB error'));
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.readiness();
      expect(result.status).toBe('not_ready');
    });
  });

  describe('liveness', () => {
    it('should always return alive', async () => {
      healthService = new HealthService(mockConfigService as ConfigService, mockPrisma);
      const result = await healthService.liveness();
      expect(result.status).toBe('alive');
    });
  });
});
