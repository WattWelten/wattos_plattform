/**
 * Tenant Config Loader Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantConfigLoader } from './tenant-config.loader';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path
vi.mock('fs');
vi.mock('path');

describe('TenantConfigLoader', () => {
  let loader: TenantConfigLoader;
  const mockFs = fs as any;
  const mockPath = path as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantConfigLoader],
    }).compile();

    loader = module.get<TenantConfigLoader>(TenantConfigLoader);

    // Reset mocks
    vi.clearAllMocks();
    mockPath.join = vi.fn((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should load config from file', async () => {
      const mockConfig = {
        tenant: {
          slug: 'musterlandkreis',
          name: 'Musterlandkreis',
          vertical: 'kommune',
        },
        officeHours: {
          open: 8,
          close: 17,
        },
      };

      vi.mocked(mockFs.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      const config = await loader.getConfig('musterlandkreis');

      expect(config).toBeDefined();
      expect(config?.tenant.slug).toBe('musterlandkreis');
    });

    it('should return null for non-existent config', async () => {
      vi.mocked(mockFs.existsSync).mockReturnValue(false);

      const config = await loader.getConfig('nonexistent');

      expect(config).toBeNull();
    });

    it('should cache config after first load', async () => {
      const mockConfig = {
        tenant: {
          slug: 'musterlandkreis',
          name: 'Musterlandkreis',
          vertical: 'kommune',
        },
      };

      vi.mocked(mockFs.existsSync).mockReturnValue(true);
      vi.mocked(mockFs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      // First call
      const config1 = await loader.getConfig('musterlandkreis');
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const config2 = await loader.getConfig('musterlandkreis');
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
      expect(config1).toEqual(config2);
    });
  });

  describe('preloadConfigs', () => {
    it('should preload all configs on module init', async () => {
      const mockConfigs = [
        { tenant: { slug: 'tenant1', name: 'Tenant 1', vertical: 'kommune' } },
        { tenant: { slug: 'tenant2', name: 'Tenant 2', vertical: 'schule' } },
      ];

      (mockFs.existsSync as jest.Mock).mockReturnValue(true);
      vi.mocked(mockFs.readdirSync).mockReturnValue(['tenant1.yaml', 'tenant2.yaml'] as any);
      vi.mocked(mockFs.readFileSync).mockImplementation((filePath: string) => {
        if (filePath.includes('tenant1')) {
          return JSON.stringify(mockConfigs[0]);
        }
        return JSON.stringify(mockConfigs[1]);
      });

      await loader.onModuleInit();

      expect(mockFs.readdirSync).toHaveBeenCalled();
    });
  });
});
