/**
 * Tenant-Config-Loader
 * 
 * Lädt Tenant-Konfigurationen aus YAML-Dateien (configs/tenants/{slug}.yaml)
 * Unterstützt Caching mit Redis (optional)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface TenantConfig {
  tenant: {
    slug: string;
    name: string;
    vertical: string;
  };
  branding?: {
    primary?: string;
    logo?: string;
  };
  officeHours?: {
    open: number;
    close: number;
  };
  metrics?: {
    avgHandleTimeMin?: {
      default: number;
      topicOverrides?: Record<string, number>;
    };
  };
  ui?: {
    labels?: Record<string, string>;
  };
}

@Injectable()
export class TenantConfigLoader implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TenantConfigLoader.name);
  private readonly configsPath: string;
  private readonly cache: Map<string, TenantConfig> = new Map();
  private redis?: Redis;

  constructor() {
    // Configs-Pfad: root/configs/tenants/
    const rootPath = process.cwd();
    this.configsPath = path.join(rootPath, 'configs', 'tenants');

    // Redis für Caching (optional)
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        this.logger.log('Redis cache enabled for tenant configs');
      } catch {
        this.logger.warn('Failed to connect to Redis, using in-memory cache');
      }
    }
  }

  async onModuleInit() {
    // Preload alle Configs beim Start
    await this.preloadConfigs();
  }

  /**
   * Lade Tenant-Config für einen Slug
   */
  async getConfig(tenantSlug: string): Promise<TenantConfig | null> {
    // 1. Prüfe In-Memory Cache
    if (this.cache.has(tenantSlug)) {
      return this.cache.get(tenantSlug)!;
    }

    // 2. Prüfe Redis Cache
    if (this.redis) {
      try {
        const cached = await this.redis.get(`tenant:config:${tenantSlug}`);
        if (cached) {
          const config = JSON.parse(cached) as TenantConfig;
          this.cache.set(tenantSlug, config);
          return config;
        }
      } catch (error) {
        this.logger.warn(`Redis cache read failed for ${tenantSlug}: ${error}`);
      }
    }

    // 3. Lade aus Datei
    const config = await this.loadFromFile(tenantSlug);
    if (config) {
      this.cache.set(tenantSlug, config);

      // Speichere in Redis
      if (this.redis) {
        try {
          await this.redis.set(
            `tenant:config:${tenantSlug}`,
            JSON.stringify(config),
            'EX',
            3600, // 1 Stunde TTL
          );
        } catch (error) {
          this.logger.warn(`Redis cache write failed for ${tenantSlug}: ${error}`);
        }
      }
    }

    return config;
  }

  /**
   * Lade Config aus YAML-Datei
   */
  private async loadFromFile(tenantSlug: string): Promise<TenantConfig | null> {
    const configFile = path.join(this.configsPath, `${tenantSlug}.yaml`);

    try {
      if (!fs.existsSync(configFile)) {
        this.logger.warn(`Config file not found: ${configFile}`);
        return null;
      }

      const fileContent = fs.readFileSync(configFile, 'utf8');
      const config = yaml.load(fileContent) as TenantConfig;

      // Validiere Config
      if (!config.tenant || !config.tenant.slug) {
        this.logger.error(`Invalid config for ${tenantSlug}: missing tenant.slug`);
        return null;
      }

      return config;
    } catch (error) {
      this.logger.error(`Failed to load config for ${tenantSlug}: ${error}`);
      return null;
    }
  }

  /**
   * Preload alle Configs beim Start
   */
  private async preloadConfigs(): Promise<void> {
    try {
      if (!fs.existsSync(this.configsPath)) {
        this.logger.warn(`Configs directory not found: ${this.configsPath}`);
        return;
      }

      const files = fs.readdirSync(this.configsPath);
      const yamlFiles = files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

      for (const file of yamlFiles) {
        const slug = path.basename(file, path.extname(file));
        const config = await this.loadFromFile(slug);
        if (config) {
          this.cache.set(slug, config);
          this.logger.debug(`Preloaded config for tenant: ${slug}`);
        }
      }

      this.logger.log(`Preloaded ${this.cache.size} tenant configs`);
    } catch (error) {
      this.logger.error(`Failed to preload configs: ${error}`);
    }
  }

  /**
   * Cleanup beim Shutdown
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Invalidate Cache für einen Tenant
   */
  async invalidateCache(tenantSlug: string): Promise<void> {
    this.cache.delete(tenantSlug);

    if (this.redis) {
      try {
        await this.redis.del(`tenant:config:${tenantSlug}`);
      } catch (error) {
        this.logger.warn(`Failed to invalidate Redis cache for ${tenantSlug}: ${error}`);
      }
    }
  }
}
