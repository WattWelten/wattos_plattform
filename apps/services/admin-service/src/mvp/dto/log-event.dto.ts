import { z } from 'zod';

// Zod Schema für Event-Payload
export const logEventSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
  event: z.object({
    type: z.enum(['viseme', 'tts', 'error', 'kpi', 'search']),
    viseme: z.enum(['MBP', 'FV', 'TH', 'AA']).optional(),
    timestamp: z.number().optional(),
    query: z.string().optional(),
    score: z.number().min(0).max(1).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type LogEventInput = z.infer<typeof logEventSchema>;


