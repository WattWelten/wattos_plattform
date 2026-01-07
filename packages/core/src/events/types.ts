/**
 * Event Types für Event-basierte Kommunikation
 * 
 * Event-Typen folgen dem Pattern: <domain>.<action>.<entity>
 * z.B. perception.audio.received, intent.message.processed, tool.call.executed
 */

import { z } from 'zod';
import { EventDomain, BaseEventSchema, type BaseEvent } from '@wattweiser/shared';

// Re-export for backward compatibility
export { EventDomain, BaseEventSchema, type BaseEvent };

/**
 * Perception Events
 */
export const PerceptionEventSchema = BaseEventSchema.extend({
  domain: z.literal(EventDomain.PERCEPTION),
  action: z.enum(['audio.received', 'video.received', 'text.received']),
  payload: z.object({
    data: z.union([z.string(), z.instanceof(Buffer)]),
    format: z.string(),
    language: z.string().optional(),
  }),
});

export type PerceptionEvent = z.infer<typeof PerceptionEventSchema>;

/**
 * Intent Events
 */
export const IntentEventSchema = BaseEventSchema.extend({
  domain: z.literal(EventDomain.INTENT),
  action: z.enum(['message.processed', 'intent.detected', 'response.generated']),
  payload: z.object({
    message: z.string(),
    intent: z.string().optional(),
    confidence: z.number().optional(),
    response: z.string().optional(),
    citations: z.array(z.any()).optional(),
  }),
});

export type IntentEvent = z.infer<typeof IntentEventSchema>;

/**
 * Tool Events
 */
export const ToolEventSchema = BaseEventSchema.extend({
  domain: z.literal(EventDomain.TOOL),
  action: z.enum(['call.executed', 'call.failed', 'call.approved']),
  payload: z.object({
    toolName: z.string(),
    toolInput: z.record(z.string(), z.any()),
    toolOutput: z.record(z.string(), z.any()).optional(),
    error: z.string().optional(),
  }),
});

export type ToolEvent = z.infer<typeof ToolEventSchema>;

/**
 * Knowledge Events
 */
export const KnowledgeEventSchema = BaseEventSchema.extend({
  domain: z.literal(EventDomain.KNOWLEDGE),
  action: z.enum([
    'search.executed',
    'context.built',
    'citation.generated',
    'document.ready',
    'document.deleted',
  ]),
  payload: z.object({
    query: z.string().optional(),
    results: z.array(z.any()).optional(),
    context: z.string().optional(),
    citations: z.array(z.any()).optional(),
    documentId: z.string().optional(),
    name: z.string().optional(),
    content: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    source: z.string().optional(),
    error: z.string().optional(),
  }),
});

export type KnowledgeEvent = z.infer<typeof KnowledgeEventSchema>;

/**
 * Avatar Events
 */
export const AvatarEventSchema = BaseEventSchema.extend({
  domain: z.literal(EventDomain.AVATAR),
  action: z.enum(['animation.started', 'animation.completed', 'lip-sync.updated']),
  payload: z.object({
    animationType: z.string(),
    audioData: z.instanceof(Buffer).optional(),
    visemeData: z.array(z.number()).optional(),
  }),
});

export type AvatarEvent = z.infer<typeof AvatarEventSchema>;

/**
 * Compliance Events
 */
export const ComplianceEventSchema = BaseEventSchema.extend({
  domain: z.literal(EventDomain.COMPLIANCE),
  action: z.enum([
    'disclosure.shown',
    'pii.detected',
    'pii.redacted',
    'audit.logged',
    'retention.cleanup',
  ]),
  payload: z.object({
    disclosureType: z.string().optional(),
    piiType: z.string().optional(),
    action: z.string().optional(),
    details: z.record(z.string(), z.any()).optional(),
    retentionDays: z.number().optional(),
    cutoffDate: z.string().optional(),
    deletedCounts: z
      .object({
        deletedConversations: z.number(),
        deletedMessages: z.number(),
        deletedAuditLogs: z.number(),
      })
      .optional(),
  }),
});

export type ComplianceEvent = z.infer<typeof ComplianceEventSchema>;

/**
 * Channel Events
 */
export const ChannelEventSchema = BaseEventSchema.extend({
  domain: z.literal(EventDomain.CHANNEL),
  action: z.enum([
    'message.received',
    'message.sent',
    'session.created',
    'session.closed',
    'session.paused',
  ]),
  payload: z.object({
    channel: z.string(),
    channelId: z.string(),
    message: z.string().optional(),
    direction: z.enum(['inbound', 'outbound']).optional(),
  }),
});

export type ChannelEvent = z.infer<typeof ChannelEventSchema>;

/**
 * Union aller Event-Typen
 */
export type Event =
  | PerceptionEvent
  | IntentEvent
  | ToolEvent
  | KnowledgeEvent
  | AvatarEvent
  | ComplianceEvent
  | ChannelEvent;

/**
 * Event Handler Type
 */
export type EventHandler<T extends Event = Event> = (event: T) => Promise<void> | void;

/**
 * Event Filter Type
 */
export type EventFilter = (event: Event) => boolean;

