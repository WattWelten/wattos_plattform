import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheService } from '../cache.service';
import { ConfigService } from '@nestjs/config';

// Mock Redis
const mockRedisClient = {
  isOpen: true,
  connect: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  setEx: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  quit: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
};

vi.mock('redis', () => {
  return {
    createClient: vi.fn(() => mockRedisClient),
  };
});

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    vi.useFakeTimers();
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          CACHE_ENABLED: true,
          CACHE_DEFAULT_TTL: 3600,
          CACHE_MAX_SIZE: 1000,
          REDIS_URL: 'redis://localhost:6379',
        };
        return config[key] ?? defaultValue;
      }),
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    // Reset mock Redis client state
    mockRedisClient.isOpen = true;
    mockRedisClient.get.mockClear();
    mockRedisClient.setEx.mockClear();
    mockRedisClient.del.mockClear();
  });

  describe('get', () => {
    it('should return null when cache is disabled', async () => {
      const disabledConfig = {
        get: vi.fn((key: string) => {
          if (key === 'CACHE_ENABLED') return false;
          return undefined;
        }),
      } as any;

      cacheService = new CacheService(disabledConfig);
      await vi.advanceTimersByTimeAsync(100); // Wait for initialization

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });

    it('should return cached value from Redis', async () => {
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' }));

      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      const result = await cacheService.get<{ data: string }>('test-key');

      expect(result).toEqual({ data: 'test' });
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent key', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      const result = await cacheService.get('non-existent');

      expect(result).toBeNull();
    });

    it('should fallback to in-memory cache when Redis is unavailable', async () => {
      mockRedisClient.isOpen = false;
      mockRedisClient.get.mockRejectedValueOnce(new Error('Redis unavailable'));

      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      // Set value first
      await cacheService.set('test-key', { data: 'in-memory' }, 3600);

      const result = await cacheService.get<{ data: string }>('test-key');

      expect(result).toEqual({ data: 'in-memory' });
    });

    it('should return null for expired in-memory cache entry', async () => {
      mockRedisClient.isOpen = false;

      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      // Set value with short TTL
      await cacheService.set('test-key', { data: 'expired' }, 1);

      // Fast-forward past expiration
      await vi.advanceTimersByTimeAsync(2000);

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value in Redis', async () => {
      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      await cacheService.set('test-key', { data: 'test' }, 3600);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        3600,
        JSON.stringify({ data: 'test' }),
      );
    });

    it('should use default TTL when not specified', async () => {
      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      await cacheService.set('test-key', { data: 'test' });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        3600, // Default TTL
        JSON.stringify({ data: 'test' }),
      );
    });

    it('should not store when cache is disabled', async () => {
      const disabledConfig = {
        get: vi.fn((key: string) => {
          if (key === 'CACHE_ENABLED') return false;
          return undefined;
        }),
      } as any;

      cacheService = new CacheService(disabledConfig);
      await vi.advanceTimersByTimeAsync(100);

      await cacheService.set('test-key', { data: 'test' });

      // Should not throw, but also not store
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('should fallback to in-memory cache when Redis is unavailable', async () => {
      mockRedisClient.isOpen = false;
      mockRedisClient.setEx.mockRejectedValueOnce(new Error('Redis unavailable'));

      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      await cacheService.set('test-key', { data: 'in-memory' }, 3600);

      // Should be available in in-memory cache
      const result = await cacheService.get<{ data: string }>('test-key');
      expect(result).toEqual({ data: 'in-memory' });
    });
  });

  describe('delete', () => {
    it('should delete key from Redis', async () => {
      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      await cacheService.delete('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should delete from in-memory cache when Redis unavailable', async () => {
      mockRedisClient.isOpen = false;

      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      // Set in in-memory
      await cacheService.set('test-key', { data: 'test' }, 3600);

      // Delete
      await cacheService.delete('test-key');

      // Should be gone
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      cacheService = new CacheService(mockConfigService);
      await vi.advanceTimersByTimeAsync(100);

      // Set some values
      await cacheService.set('key1', { data: '1' }, 3600);
      await cacheService.set('key2', { data: '2' }, 3600);

      // Clear
      await cacheService.clear();

      // Values should be gone
      const result1 = await cacheService.get('key1');
      const result2 = await cacheService.get('key2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });
});


