import { describe, it, expect } from 'vitest';
import { tenantConfigSchema, type TenantConfig } from '../schemas/tenant-config';

describe('tenantConfigSchema', () => {
  it('validates a valid config', () => {
    const validConfig: TenantConfig = {
      tenant_id: 'test-tenant',
      character: 'kaya',
      locales: ['de-DE'],
      sources: {
        allow_domains: ['https://example.com'],
        patterns: [],
      },
      crawler: {
        schedule_cron: '0 5 * * *',
        delta_etag: true,
        max_pages: 1500,
      },
      retrieval: {
        two_stage: false,
        top_k: 6,
        filters: {},
      },
      skills: [],
      answer_policy: {
        style: 'kurz+schritt',
        show_sources: true,
        show_date: true,
        max_tokens: 450,
      },
      tts: {
        voice: 'de-DE-neutral',
        visemes: true,
        rate: 1.0,
        pitch: 0,
      },
      escalation: {},
    };

    const result = tenantConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('rejects invalid tenant_id', () => {
    const invalidConfig = {
      tenant_id: '',
      character: 'kaya',
    };

    const result = tenantConfigSchema.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });

  it('applies default values', () => {
    const minimalConfig = {
      tenant_id: 'test-tenant',
    };

    const result = tenantConfigSchema.safeParse(minimalConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.character).toBe('kaya');
      expect(result.data.locales).toEqual(['de-DE']);
      expect(result.data.crawler.schedule_cron).toBe('0 5 * * *');
    }
  });
});



