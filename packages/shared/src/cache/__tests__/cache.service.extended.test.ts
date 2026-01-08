import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheService } from '../cache.service';
import { ConfigService } from '@nestjs/config';

// Mock Redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    ping: vi.fn(),
    isOpen: false,
    get: vi.fn(),
    setEx: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    flushDb: vi.fn(),
    mGet: vi.fn(),
    multi: vi.fn(() => ({
      setEx: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    })),
    on: vi.fn(),
  })),
}));

describe('CacheService - Extended Tests', () => {
  let cacheService: CacheService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'REDIS_URL') return undefined; // Use in-memory cache
        if (key === 'CACHE_ENABLED') return true;
        if (key === 'CACHE_DEFAULT_TTL') return 3600;
        if (key === 'CACHE_MAX_SIZE') return 1000;
        return defaultValue;
      }),
    };

    cacheService = new CacheService(mockConfigService as ConfigService);
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      await cacheService.set('key1', 'value1');
      const result = await cacheService.getOrSet('key1', async () => 'new-value');
      expect(result).toBe('value1');
    });

    it('should call factory and cache result if not exists', async () => {
      const factory = vi.fn().mockResolvedValue('factory-value');
      const result = await cacheService.getOrSet('key2', factory);
      expect(result).toBe('factory-value');
      expect(factory).toHaveBeenCalledTimes(1);
      const cached = await cacheService.get('key2');
      expect(cached).toBe('factory-value');
    });
  });

  describe('writeThrough', () => {
    it('should write to database and cache', async () => {
      const writeFn = vi.fn().mockResolvedValue('db-value');
      const result = await cacheService.writeThrough('key3', 'value3', writeFn);
      expect(result).toBe('db-value');
      expect(writeFn).toHaveBeenCalledTimes(1);
      const cached = await cacheService.get('key3');
      expect(cached).toBe('db-value');
    });
  });

  describe('writeBack', () => {
    it('should write to cache immediately and database asynchronously', async () => {
      const writeFn = vi.fn().mockResolvedValue('db-value');
      const result = await cacheService.writeBack('key4', 'cache-value', writeFn);
      expect(result).toBe('cache-value');
      const cached = await cacheService.get('key4');
      expect(cached).toBe('cache-value');
      // Write function should be called asynchronously
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(writeFn).toHaveBeenCalled();
    });
  });

  describe('refreshAhead', () => {
    it('should return cached value if fresh', async () => {
      await cacheService.set('key5', { value: 'cached', cachedAt: Date.now() }, 100);
      const factory = vi.fn().mockResolvedValue('new-value');
      const result = await cacheService.refreshAhead('key5', factory, 100, 0.8);
      expect(result).toBe('cached');
    });

    it('should refresh if cache is old', async () => {
      const oldTime = Date.now() - 90000; // 90 seconds ago
      await cacheService.set('key6', { value: 'old', cachedAt: oldTime }, 100);
      const factory = vi.fn().mockResolvedValue('new-value');
      const result = await cacheService.refreshAhead('key6', factory, 100, 0.8);
      expect(result).toBe('old'); // Returns old value immediately
      // Factory should be called asynchronously
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(factory).toHaveBeenCalled();
    });
  });

  describe('getMany', () => {
    it('should get multiple keys from cache', async () => {
      await cacheService.set('key7', 'value7');
      await cacheService.set('key8', 'value8');
      const results = await cacheService.getMany(['key7', 'key8', 'key9']);
      expect(results.get('key7')).toBe('value7');
      expect(results.get('key8')).toBe('value8');
      expect(results.get('key9')).toBeUndefined();
    });
  });

  describe('setMany', () => {
    it('should set multiple keys in cache', async () => {
      await cacheService.setMany([
        { key: 'key10', value: 'value10' },
        { key: 'key11', value: 'value11' },
      ]);
      const value10 = await cacheService.get('key10');
      const value11 = await cacheService.get('key11');
      expect(value10).toBe('value10');
      expect(value11).toBe('value11');
    });
  });

  describe('createKey', () => {
    it('should create cache key with prefix and parts', () => {
      const key = CacheService.createKey('prefix', 'part1', 'part2', 123);
      expect(key).toBe('prefix:part1:part2:123');
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entry when cache is full', async () => {
      // Set max size to 2
      const smallCache = new CacheService({
        get: vi.fn((key: string) => {
          if (key === 'CACHE_MAX_SIZE') return 2;
          return undefined;
        }),
      } as ConfigService);

      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      // This should evict key1
      await smallCache.set('key3', 'value3');
      
      const value1 = await smallCache.get('key1');
      const value2 = await smallCache.get('key2');
      const value3 = await smallCache.get('key3');
      
      expect(value1).toBeNull(); // Evicted
      expect(value2).toBe('value2');
      expect(value3).toBe('value3');
    });
  });
});
