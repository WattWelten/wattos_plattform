/**
 * Event Types für Event-basierte Kommunikation
 * 
 * Event-Typen folgen dem Pattern: <domain>.<action>.<entity>
 * z.B. perception.audio.received, intent.message.processed, tool.call.executed
 */

import { z } from 'zod';

/**
 * Event-Domains
 */
export enum EventDomain {
  PERCEPTION = 'perception',
  INTENT = 'intent',
  TOOL = 'tool',
  KNOWLEDGE = 'knowledge',
  AVATAR = 'avatar',
  COMPLIANCE = 'compliance',
  CHANNEL = 'channel',
}

/**
 * Base Event Schema
 */
export const BaseEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  domain: z.nativeEnum(EventDomain),
  timestamp: z.number(),
  sessionId: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  action: z.string().optional(),
  payload: z.record(z.string(), z.any()).optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

/**
 * Event Type (minimal interface for cross-package usage)
 */
export type Event = BaseEvent;






