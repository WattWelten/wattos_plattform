import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Redis types (optional dependency)
type RedisClientType = any;

export interface FeatureFlagConfig {
  key: string;
  enabled: boolean;
  percentage?: number; // 0-100 for gradual rollout
  userSegments?: string[]; // User IDs or segments
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class FeatureFlagService implements OnModuleInit {
  private readonly logger = new Logger(FeatureFlagService.name);
  private redisClient: RedisClientType | null = null;
  private flags: Map<string, FeatureFlagConfig> = new Map();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (redisUrl) {
        // Dynamic import to make redis optional
        const { createClient } = await import('redis');
        this.redisClient = createClient({ url: redisUrl }) as RedisClientType;
        await this.redisClient.connect();
        this.logger.log('Feature Flag Service connected to Redis');
        await this.loadFlags();
      } else {
        this.logger.warn('REDIS_URL not set, feature flags will use in-memory storage');
      }
    } catch (error: any) {
      this.logger.error(`Failed to connect to Redis for feature flags: ${error.message}`);
      this.logger.warn('Feature flags will use in-memory storage');
    }
  }

  private async loadFlags(): Promise<void> {
    if (!this.redisClient) return;

    try {
      const keys = await this.redisClient.keys('feature-flag:*');
      for (const key of keys) {
        const flagKey = key.replace('feature-flag:', '');
        const flagData = await this.redisClient.get(key);
        if (flagData) {
          this.flags.set(flagKey, JSON.parse(flagData));
        }
      }
      this.logger.log(`Loaded ${this.flags.size} feature flags from Redis`);
    } catch (error: any) {
      this.logger.error(`Failed to load feature flags: ${error.message}`);
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  async isEnabled(flagKey: string, userId?: string): Promise<boolean> {
    const flag = this.flags.get(flagKey) || await this.getFlag(flagKey);

    if (!flag) {
      return false; // Default: disabled if not found
    }

    // Check if flag is enabled
    if (!flag.enabled) {
      return false;
    }

    // Check date range
    if (flag.startDate && new Date() < flag.startDate) {
      return false;
    }
    if (flag.endDate && new Date() > flag.endDate) {
      return false;
    }

    // Check user segments
    if (flag.userSegments) {
      if (!userId) {
        return false; // Can't match user segments without userId
      }
      if (!flag.userSegments.includes(userId)) {
        return false;
      }
    }

    // Check percentage rollout
    if (flag.percentage !== undefined && flag.percentage < 100) {
      if (!userId) {
        return false; // Can't do percentage rollout without userId
      }
      // Simple hash-based percentage
      const hash = this.hashUserId(userId);
      return hash % 100 < flag.percentage;
    }

    return true;
  }

  /**
   * Get feature flag value
   */
  async getFlag(flagKey: string): Promise<FeatureFlagConfig | null> {
    // Check cache first
    if (this.flags.has(flagKey)) {
      return this.flags.get(flagKey)!;
    }

    // Load from Redis
    if (this.redisClient) {
      try {
        const flagData = await this.redisClient.get(`feature-flag:${flagKey}`);
        if (flagData) {
          const flag = JSON.parse(flagData);
          this.flags.set(flagKey, flag);
          return flag;
        }
      } catch (error: any) {
        this.logger.error(`Failed to get feature flag ${flagKey}: ${error.message}`);
      }
    }

    return null;
  }

  /**
   * Set feature flag
   */
  async setFlag(flag: FeatureFlagConfig): Promise<void> {
    this.flags.set(flag.key, flag);

    if (this.redisClient) {
      try {
        await this.redisClient.set(
          `feature-flag:${flag.key}`,
          JSON.stringify(flag),
        );
        this.logger.log(`Feature flag ${flag.key} updated`);
      } catch (error: any) {
        this.logger.error(`Failed to set feature flag ${flag.key}: ${error.message}`);
      }
    }
  }

  /**
   * Delete feature flag
   */
  async deleteFlag(flagKey: string): Promise<void> {
    this.flags.delete(flagKey);

    if (this.redisClient) {
      try {
        await this.redisClient.del(`feature-flag:${flagKey}`);
        this.logger.log(`Feature flag ${flagKey} deleted`);
      } catch (error: any) {
        this.logger.error(`Failed to delete feature flag ${flagKey}: ${error.message}`);
      }
    }
  }

  /**
   * Get all feature flags
   */
  async getAllFlags(): Promise<FeatureFlagConfig[]> {
    return Array.from(this.flags.values());
  }

  /**
   * Emergency kill switch - disable all flags
   */
  async emergencyDisable(): Promise<void> {
    for (const flag of this.flags.values()) {
      flag.enabled = false;
      await this.setFlag(flag);
    }
    this.logger.warn('All feature flags disabled via emergency kill switch');
  }

  /**
   * Hash userId for percentage rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

