import { z } from 'zod';

/**
 * Market Types
 */
export enum Market {
  ENTERPRISE = 'enterprise',
  GOV = 'gov',
  MEDIA = 'media',
  HEALTH = 'health',
}

/**
 * Mode Types
 */
export enum Mode {
  STANDARD = 'standard',
  REGULATED = 'regulated',
  GOV_F13 = 'gov-f13',
}

/**
 * Provider Configuration
 */
export const ProviderConfigSchema = z.object({
  llm: z.string(), // "wattweiser" | "f13"
  rag: z.string(), // "wattweiser" | "f13"
  parser: z.string().optional(), // "wattweiser" | "f13"
  summarize: z.string().optional(), // "wattweiser" | "f13"
  speech: z.string().optional(), // "wattweiser" | "azure" | "openai"
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

/**
 * Compliance Configuration
 */
export const ComplianceConfigSchema = z.object({
  gdpr: z.boolean(),
  aiAct: z.boolean(),
  disclosure: z.boolean(),
  retentionDays: z.number().min(1).max(3650), // 1 Tag bis 10 Jahre
});

export type ComplianceConfig = z.infer<typeof ComplianceConfigSchema>;

/**
 * Feature Flags
 */
export const FeatureFlagsSchema = z.object({
  guidedFlows: z.boolean(),
  sourceRequired: z.boolean(),
  hitlRequired: z.boolean(), // Human-in-the-Loop required
  toolCallsEnabled: z.boolean(),
  visionEnabled: z.boolean(),
  webChat: z.boolean(),
  phone: z.boolean(),
  whatsapp: z.boolean(),
  telegram: z.boolean().optional(),
  sms: z.boolean().optional(),
});

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

/**
 * Tenant Profile Schema
 */
export const TenantProfileSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  market: z.nativeEnum(Market),
  mode: z.nativeEnum(Mode),
  providers: ProviderConfigSchema,
  compliance: ComplianceConfigSchema,
  features: FeatureFlagsSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type TenantProfile = z.infer<typeof TenantProfileSchema>;

/**
 * Profile Validator Interface
 */
export interface IProfileValidator {
  validate(profile: TenantProfile): Promise<boolean>;
  getDefaultProfile(tenantId: string): TenantProfile;
}

