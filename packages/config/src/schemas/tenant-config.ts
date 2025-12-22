import { z } from 'zod';

/**
 * Tenant Configuration Schema für No-Code Settings
 * Basierend auf MVP-Spezifikation
 */

export const sourceConfigSchema = z.object({
  allow_domains: z.array(z.string().url()).default([]),
  patterns: z.array(z.string()).default([]),
});

export const crawlerConfigSchema = z.object({
  schedule_cron: z.string().default('0 5 * * *'), // Default: 05:00 täglich
  delta_etag: z.boolean().default(true),
  max_pages: z.number().int().positive().default(1500),
});

export const retrievalConfigSchema = z.object({
  two_stage: z.boolean().default(false),
  top_k: z.number().int().positive().default(6),
  filters: z
    .object({
      domain: z.array(z.string()).optional(),
    })
    .default({}),
});

export const answerPolicySchema = z.object({
  style: z.enum(['kurz', 'schritt', 'kurz+schritt', 'detailliert']).default('kurz+schritt'),
  show_sources: z.boolean().default(true),
  show_date: z.boolean().default(true),
  max_tokens: z.number().int().positive().default(450),
});

export const ttsConfigSchema = z.object({
  voice: z.string().default('de-DE-neutral'),
  visemes: z.boolean().default(true),
  rate: z.number().min(0.5).max(2.0).default(1.0),
  pitch: z.number().min(-1.0).max(1.0).default(0),
});

export const escalationConfigSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const tenantConfigSchema = z.object({
  tenant_id: z.string(),
  character: z.string().default('kaya'),
  locales: z.array(z.string()).default(['de-DE']),
  sources: sourceConfigSchema,
  crawler: crawlerConfigSchema,
  retrieval: retrievalConfigSchema,
  skills: z.array(z.string()).default([]),
  answer_policy: answerPolicySchema,
  tts: ttsConfigSchema,
  escalation: escalationConfigSchema,
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
export type SourceConfig = z.infer<typeof sourceConfigSchema>;
export type CrawlerConfig = z.infer<typeof crawlerConfigSchema>;
export type RetrievalConfig = z.infer<typeof retrievalConfigSchema>;
export type AnswerPolicy = z.infer<typeof answerPolicySchema>;
export type TtsConfig = z.infer<typeof ttsConfigSchema>;
export type EscalationConfig = z.infer<typeof escalationConfigSchema>;

