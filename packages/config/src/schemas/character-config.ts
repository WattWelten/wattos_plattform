import { z } from 'zod';

/**
 * Character Configuration Schema
 * Für Kaya und andere Charaktere
 */

export const characterConfigSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  name: z.string(),
  role: z.string(),
  systemPrompt: z.string().optional(),
  prompt: z.string(),
  personality: z
    .object({
      traits: z.array(z.string()).optional(),
      communicationStyle: z.string().optional(),
      tone: z.enum(['formal', 'casual', 'friendly', 'professional']).optional(),
    })
    .optional(),
  customParameters: z.record(z.string(), z.unknown()).default({}),
  knowledgeBase: z
    .object({
      enabled: z.boolean().default(true),
      sources: z.array(z.string()).default([]),
    })
    .optional(),
  voice: z
    .object({
      voiceId: z.string().optional(),
      voiceModel: z.string().optional(),
    })
    .optional(),
});

export type CharacterConfig = z.infer<typeof characterConfigSchema>;

