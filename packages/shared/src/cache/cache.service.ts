import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { safeJsonParse, safeJsonStringify } from '../utils';

/**
 * Cache Service
 * Redis-basiertes Caching für Performance-Optimierung
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: RedisClientType | null = null;
  private readonly enabled: boolean;
  private readonly defaultTtl: number;
  private readonly maxCacheSize: number;
  private inMemoryCache: Map<string, { value: any; expires: number; lastUsed: number }> = new Map();

  constructor(private configService?: ConfigService) {
    this.enabled = configService?.get<boolean>('CACHE_ENABLED', true) ?? true;
    this.defaultTtl = configService?.get<number>('CACHE_DEFAULT_TTL', 3600) ?? 3600; // 1 Stunde
    this.maxCacheSize = configService?.get<number>('CACHE_MAX_SIZE', 1000) ?? 1000;
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const redisUrl = this.configService?.get<string>('REDIS_URL') || process.env.REDIS_URL;
      if (redisUrl) {
        this.redisClient = createClient({ url: redisUrl });
        this.redisClient.on('error', (err: Error) => {
          this.logger.warn(`Redis cache error: ${err.message}, falling back to in-memory cache`);
        });
        await this.redisClient.connect();
        this.logger.log('Redis cache connected');
      } else {
        this.logger.warn('Redis URL not configured, using in-memory cache only');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to connect to Redis cache: ${errorMessage}, using in-memory cache`);
    }
  }

  /**
   * Wert aus Cache abrufen
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // Zuerst Redis prüfen
      if (this.redisClient && this.redisClient.isOpen) {
        const value = await this.redisClient.get(key);
        if (value) {
          return safeJsonParse<T>(value, { fallback: null });
        }
      }

      // Fallback: In-Memory Cache
      const cached = this.inMemoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        // Update lastUsed für LRU
        cached.lastUsed = Date.now();
        return cached.value as T;
      } else if (cached) {
        this.inMemoryCache.delete(key);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Cache get error for key ${key}: ${errorMessage}`);
    }

    return null;
  }

  /**
   * Wert im Cache speichern
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const ttl = ttlSeconds ?? this.defaultTtl;

    try {
      // Redis speichern
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.setEx(key, ttl, safeJsonStringify(value, { strict: true }));
        return;
      }

      // Fallback: In-Memory Cache
      // LRU: Älteste Einträge entfernen wenn Limit erreicht
      if (this.inMemoryCache.size >= this.maxCacheSize && !this.inMemoryCache.has(key)) {
        this.evictLRU();
      }

      this.inMemoryCache.set(key, {
        value,
        expires: Date.now() + ttl * 1000,
        lastUsed: Date.now(),
      });

      // Cleanup expired entries periodically
      if (this.inMemoryCache.size > this.maxCacheSize) {
        this.cleanupInMemoryCache();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Cache set error for key ${key}: ${errorMessage}`);
    }
  }

  /**
   * Wert aus Cache löschen
   */
  async delete(key: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.del(key);
      }
      this.inMemoryCache.delete(key);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Cache delete error for key ${key}: ${errorMessage}`);
    }
  }

  /**
   * Cache-Keys nach Pattern löschen
   * Unterstützt Wildcards: dashboard:tenantId:* löscht alle Keys die mit dashboard:tenantId: beginnen
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      if (this.redisClient && this.redisClient.isOpen) {
        // Konvertiere Wildcard-Pattern zu Redis Pattern
        // dashboard:tenantId:* -> dashboard:tenantId:*
        const redisPattern = pattern.replace('*', '*');
        const keys = await this.redisClient.keys(redisPattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          this.logger.debug(`Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
        }
      }

      // In-Memory Cache: Pattern-basierte Löschung
      const patternPrefix = pattern.replace('*', '');
      const keysToDelete: string[] = [];
      for (const key of this.inMemoryCache.keys()) {
        if (key.startsWith(patternPrefix)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.inMemoryCache.delete(key));
      if (keysToDelete.length > 0) {
        this.logger.debug(`Deleted ${keysToDelete.length} in-memory cache keys matching pattern: ${pattern}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Cache deletePattern error for pattern ${pattern}: ${errorMessage}`);
    }
  }

  /**
   * Cache leeren (alle Keys mit Prefix)
   */
  async clear(pattern?: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      if (this.redisClient && this.redisClient.isOpen && pattern) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.flushDb();
      }

      if (pattern) {
        // In-Memory Cache mit Pattern löschen
        for (const key of this.inMemoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            this.inMemoryCache.delete(key);
          }
        }
      } else {
        this.inMemoryCache.clear();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Cache clear error: ${errorMessage}`);
    }
  }

  /**
   * Cache-Key generieren
   */
  static createKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  /**
   * Get oder Set Pattern (Cache-Aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Cache-Strategie: Write-Through
   * Schreibt sowohl in Cache als auch in Datenbank
   */
  async writeThrough<T>(
    key: string,
    value: T,
    writeFn: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    const result = await writeFn();
    await this.set(key, result, ttlSeconds);
    return result;
  }

  /**
   * Cache-Strategie: Write-Back (Lazy Write)
   * Schreibt zuerst in Cache, später asynchron in DB
   */
  async writeBack<T>(
    key: string,
    value: T,
    writeFn: () => Promise<T>,
    ttlSeconds?: number,
  ): Promise<T> {
    await this.set(key, value, ttlSeconds);
    // Asynchron in DB schreiben (nicht blockierend)
    writeFn().catch((error) => {
      this.logger.warn(`Write-back failed for key ${key}: ${error instanceof Error ? error.message : String(error)}`);
    });
    return value;
  }

  /**
   * Cache-Strategie: Refresh-Ahead
   * Erneuert Cache-Einträge bevor sie ablaufen
   */
  async refreshAhead<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number,
    refreshThreshold: number = 0.8, // Refresh bei 80% der TTL
  ): Promise<T> {
    const cached = await this.get<{ value: T; cachedAt: number }>(key);
    
    if (cached === null) {
      // Cache miss - normaler Fall
      const value = await factory();
      await this.set(key, { value, cachedAt: Date.now() }, ttlSeconds);
      return value;
    }

    const age = (Date.now() - cached.cachedAt) / 1000;
    const shouldRefresh = age > ttlSeconds * refreshThreshold;

    if (shouldRefresh) {
      // Asynchron im Hintergrund erneuern
      factory()
        .then((value) => this.set(key, { value, cachedAt: Date.now() }, ttlSeconds))
        .catch((error) => {
          this.logger.warn(`Refresh-ahead failed for key ${key}: ${error instanceof Error ? error.message : String(error)}`);
        });
    }

    return cached.value;
  }

  /**
   * LRU Eviction: Entfernt den am wenigsten verwendeten Eintrag
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.inMemoryCache.entries()) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.inMemoryCache.delete(oldestKey);
      this.logger.debug(`Evicted LRU cache entry: ${oldestKey}`);
    }
  }

  private cleanupInMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryCache.entries()) {
      if (entry.expires <= now) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  /**
   * Batch-Get: Mehrere Keys auf einmal abrufen
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    if (!this.enabled) {
      return results;
    }

    try {
      if (this.redisClient && this.redisClient.isOpen) {
        const values = await this.redisClient.mGet(keys);
        keys.forEach((key, index) => {
          if (values[index]) {
            const parsed = safeJsonParse<T>(values[index], { fallback: null });
            if (parsed !== null) {
              results.set(key, parsed);
            }
          }
        });
      } else {
        // In-Memory Fallback
        const now = Date.now();
        keys.forEach(key => {
          const cached = this.inMemoryCache.get(key);
          if (cached && cached.expires > now) {
            cached.lastUsed = now;
            results.set(key, cached.value as T);
          } else if (cached) {
            this.inMemoryCache.delete(key);
          }
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Cache getMany error: ${errorMessage}`);
    }

    return results;
  }

  /**
   * Batch-Set: Mehrere Keys auf einmal speichern
   */
  async setMany(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      if (this.redisClient && this.redisClient.isOpen) {
        const pipeline = this.redisClient.multi();
        entries.forEach(({ key, value, ttl }) => {
          pipeline.setEx(key, ttl || this.defaultTtl, safeJsonStringify(value, { strict: true }));
        });
        await pipeline.exec();
      } else {
        // In-Memory Fallback
        const now = Date.now();
        entries.forEach(({ key, value, ttl }) => {
          // LRU Eviction wenn nötig
          if (this.inMemoryCache.size >= this.maxCacheSize && !this.inMemoryCache.has(key)) {
            this.evictLRU();
          }

          this.inMemoryCache.set(key, {
            value,
            expires: now + (ttl || this.defaultTtl) * 1000,
            lastUsed: now,
          });
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Cache setMany error: ${errorMessage}`);
    }
  }
}










