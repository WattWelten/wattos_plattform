import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

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
  private inMemoryCache: Map<string, { value: any; expires: number }> = new Map();

  constructor(private configService?: ConfigService) {
    this.enabled = configService?.get<boolean>('CACHE_ENABLED', true) ?? true;
    this.defaultTtl = configService?.get<number>('CACHE_DEFAULT_TTL', 3600) ?? 3600; // 1 Stunde
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
        this.redisClient.on('error', (err) => {
          this.logger.warn(`Redis cache error: ${err.message}, falling back to in-memory cache`);
        });
        await this.redisClient.connect();
        this.logger.log('Redis cache connected');
      } else {
        this.logger.warn('Redis URL not configured, using in-memory cache only');
      }
    } catch (error: any) {
      this.logger.warn(`Failed to connect to Redis cache: ${error.message}, using in-memory cache`);
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
          return JSON.parse(value) as T;
        }
      }

      // Fallback: In-Memory Cache
      const cached = this.inMemoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value as T;
      } else if (cached) {
        this.inMemoryCache.delete(key);
      }
    } catch (error: any) {
      this.logger.warn(`Cache get error for key ${key}: ${error.message}`);
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
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
        return;
      }

      // Fallback: In-Memory Cache
      this.inMemoryCache.set(key, {
        value,
        expires: Date.now() + ttl * 1000,
      });

      // Cleanup expired entries periodically
      if (this.inMemoryCache.size > 1000) {
        this.cleanupInMemoryCache();
      }
    } catch (error: any) {
      this.logger.warn(`Cache set error for key ${key}: ${error.message}`);
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
    } catch (error: any) {
      this.logger.warn(`Cache delete error for key ${key}: ${error.message}`);
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
    } catch (error: any) {
      this.logger.warn(`Cache clear error: ${error.message}`);
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

  private cleanupInMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryCache.entries()) {
      if (entry.expires <= now) {
        this.inMemoryCache.delete(key);
      }
    }
  }
}











