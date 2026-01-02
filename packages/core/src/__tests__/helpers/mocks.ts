import { vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from '../../events/bus.service';
import { ProfileService } from '../../profiles/profile.service';

/**
 * Mock ConfigService
 */
export const createMockConfigService = (overrides?: Record<string, any>): ConfigService => {
  return {
    get: vi.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        REDIS_URL: 'redis://localhost:6379',
        CACHE_ENABLED: true,
        CACHE_DEFAULT_TTL: 3600,
        ...overrides,
      };
      return config[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;
};

/**
 * Mock EventBusService
 */
export const createMockEventBus = (): EventBusService => {
  return {
    emit: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
    subscribePattern: vi.fn(),
    unsubscribe: vi.fn(),
    healthCheck: vi.fn().mockResolvedValue(true),
  } as unknown as EventBusService;
};

/**
 * Mock ProfileService
 */
export const createMockProfileService = (overrides?: any): ProfileService => {
  return {
    getProfile: vi.fn().mockResolvedValue({
      tenantId: 'test-tenant',
      market: 'standard',
      mode: 'standard',
      compliance: {
        disclosure: true,
        retentionDays: 90,
      },
      features: {
        sourceRequired: false,
      },
      ...overrides,
    }),
  } as unknown as ProfileService;
};






