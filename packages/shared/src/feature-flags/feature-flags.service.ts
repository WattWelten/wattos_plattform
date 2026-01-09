import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  metadata?: Record<string, any>;
  ttl?: number; // TTL in seconds
}

@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private redisClient: RedisClientType | null = null;
  private readonly enabled: boolean;
  private readonly defaultTtl: number;
  private readonly prefix = 'feature-flag:';
  private inMemoryFlags: Map<string, FeatureFlag> = new Map();

  constructor(private configService?: ConfigService) {
    this.enabled = configService?.get<boolean>('FEATURE_FLAGS_ENABLED', true) ?? true;
    this.defaultTtl = configService?.get<number>('FEATURE_FLAGS_DEFAULT_TTL', 86400) ?? 86400; // 24 hours
    this.initializeRedis();
  }

  async onModuleInit() {
    // Load default flags from environment
    await this.loadDefaultFlags();
  }

  private async initializeRedis(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('Feature flags disabled');
      return;
    }

    try {
      const redisUrl = this.configService?.get<string>('REDIS_URL') || process.env.REDIS_URL;
      if (redisUrl) {
        this.redisClient = createClient({ url: redisUrl });
        this.redisClient.on('error', (err: Error) => {
          this.logger.warn(`Redis feature flags error: ${err.message}, falling back to in-memory`);
        });
        await this.redisClient.connect();
        this.logger.log('Feature flags Redis connected');
      } else {
        this.logger.warn('Redis URL not configured, using in-memory feature flags only');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to connect to Redis for feature flags: ${errorMessage}, using in-memory`);
    }
  }

  /**
   * Load default flags from environment variables
   * Format: FEATURE_FLAG_<KEY>=true|false
   */
  private async loadDefaultFlags(): Promise<void> {
    const envPrefix = 'FEATURE_FLAG_';
    const env = process.env;

    for (const [key, value] of Object.entries(env)) {
      if (key.startsWith(envPrefix)) {
        const flagKey = key.substring(envPrefix.length).toLowerCase().replace(/_/g, '-');
        const enabled = value === 'true' || value === '1';
        
        await this.setFlag({
          key: flagKey,
          enabled,
          description: `Default flag from environment: ${key}`,
        });
      }
    }
  }

  /**
   * Get feature flag value (boolean)
   */
  async getFlag(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      // Try Redis first
      if (this.redisClient) {
        const cached = await this.redisClient.get(`${this.prefix}${key}`);
        if (cached !== null) {
          const flag: FeatureFlag = JSON.parse(cached);
          return flag.enabled;
        }
      }

      // Fallback to in-memory
      const inMemoryFlag = this.inMemoryFlags.get(key);
      if (inMemoryFlag) {
        return inMemoryFlag.enabled;
      }

      // Default: disabled
      return false;
    } catch (error: unknown) {
      this.logger.error(`Error getting feature flag ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Get feature flag object (full FeatureFlag)
   */
  async getFlagObject(key: string): Promise<FeatureFlag | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // Try Redis first
      if (this.redisClient) {
        const cached = await this.redisClient.get(`${this.prefix}${key}`);
        if (cached !== null) {
          return JSON.parse(cached) as FeatureFlag;
        }
      }

      // Fallback to in-memory
      const inMemoryFlag = this.inMemoryFlags.get(key);
      if (inMemoryFlag) {
        return inMemoryFlag;
      }

      // Default: null
      return null;
    } catch (error: unknown) {
      this.logger.error(`Error getting feature flag object ${key}: ${error}`);
      return null;
    }
  }

  /**
   * Set feature flag
   */
  async setFlag(flag: FeatureFlag): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const ttl = flag.ttl || this.defaultTtl;
      const flagData: FeatureFlag = {
        ...flag,
        ttl,
      };

      // Store in Redis
      if (this.redisClient) {
        await this.redisClient.setEx(
          `${this.prefix}${flag.key}`,
          ttl,
          JSON.stringify(flagData)
        );
      }

      // Also store in-memory as fallback
      this.inMemoryFlags.set(flag.key, flagData);

      this.logger.debug(`Feature flag ${flag.key} set to ${flag.enabled}`);
    } catch (error: unknown) {
      this.logger.error(`Error setting feature flag ${flag.key}: ${error}`);
      throw error;
    }
  }

  /**
   * Get all feature flags
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const flags: FeatureFlag[] = [];

      if (this.redisClient) {
        const keys = await this.redisClient.keys(`${this.prefix}*`);
        for (const key of keys) {
          const cached = await this.redisClient.get(key);
          if (cached) {
            flags.push(JSON.parse(cached));
          }
        }
      } else {
        // Fallback to in-memory
        flags.push(...Array.from(this.inMemoryFlags.values()));
      }

      return flags;
    } catch (error: unknown) {
      this.logger.error(`Error getting all feature flags: ${error}`);
      return Array.from(this.inMemoryFlags.values());
    }
  }

  /**
   * Delete feature flag
   */
  async deleteFlag(key: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      if (this.redisClient) {
        await this.redisClient.del(`${this.prefix}${key}`);
      }

      this.inMemoryFlags.delete(key);
      this.logger.debug(`Feature flag ${key} deleted`);
    } catch (error: unknown) {
      this.logger.error(`Error deleting feature flag ${key}: ${error}`);
      throw error;
    }
  }

  /**
   * Check if feature is enabled (convenience method)
   */
  async isEnabled(key: string): Promise<boolean> {
    return this.getFlag(key);
  }

  /**
   * Batch get multiple flags
   */
  async getFlags(keys: string[]): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};

    await Promise.all(
      keys.map(async (key) => {
        result[key] = await this.getFlag(key);
      })
    );

    return result;
  }
}
