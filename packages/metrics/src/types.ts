import { z } from 'zod';

/**
 * Event Types für Metrics
 */

export const visemeEventSchema = z.object({
  type: z.literal('viseme'),
  viseme: z.enum(['MBP', 'FV', 'TH', 'AA']),
  timestamp: z.number(),
  duration: z.number().optional(),
});

export const ttsEventSchema = z.object({
  type: z.literal('tts'),
  text: z.string(),
  voice: z.string(),
  duration: z.number(),
  latency: z.number(),
});

export const errorEventSchema = z.object({
  type: z.literal('error'),
  error: z.string(),
  message: z.string(),
  stack: z.string().optional(),
});

export const kpiEventSchema = z.object({
  type: z.literal('kpi'),
  metric: z.string(),
  value: z.number(),
  unit: z.string().optional(),
});

export const eventSchema = z.discriminatedUnion('type', [
  visemeEventSchema,
  ttsEventSchema,
  errorEventSchema,
  kpiEventSchema,
]);

export type VisemeEvent = z.infer<typeof visemeEventSchema>;
export type TtsEvent = z.infer<typeof ttsEventSchema>;
export type ErrorEvent = z.infer<typeof errorEventSchema>;
export type KpiEvent = z.infer<typeof kpiEventSchema>;
export type Event = z.infer<typeof eventSchema>;

export interface EventPayload {
  tenant_id: string;
  conversation_id?: string | undefined;
  session_id?: string | undefined;
  event: Event;
  metadata?: Record<string, unknown> | undefined;
}

