/**
 * Channel Interface
 * 
 * Einheitliche Schnittstelle für alle Kommunikationskanäle
 */

import { z } from 'zod';

/**
 * Channel Message Schema
 */
export const ChannelMessageSchema = z.object({
  text: z.string().optional(),
  audio: z.instanceof(Buffer).optional(),
  media: z.object({
    type: z.string(),
    url: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ChannelMessage = z.infer<typeof ChannelMessageSchema>;

/**
 * Channel Response Schema
 */
export const ChannelResponseSchema = z.object({
  message: z.string(),
  audio: z.instanceof(Buffer).optional(),
  media: z.object({
    type: z.string(),
    url: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ChannelResponse = z.infer<typeof ChannelResponseSchema>;

/**
 * Channel Session Config Schema
 */
export const ChannelSessionConfigSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  channelId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type ChannelSessionConfig = z.infer<typeof ChannelSessionConfigSchema>;

/**
 * Channel Session Schema
 */
export const ChannelSessionSchema = z.object({
  id: z.string().uuid(),
  channel: z.string(),
  channelId: z.string(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  status: z.enum(['active', 'closed', 'paused']),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ChannelSession = z.infer<typeof ChannelSessionSchema>;

/**
 * Channel Type
 */
export enum ChannelType {
  TEXT = 'text',
  VOICE = 'voice',
  MULTIMODAL = 'multimodal',
}

/**
 * Channel Interface
 * 
 * Alle Channel-Implementierungen müssen dieses Interface implementieren
 */
export interface IChannel {
  /**
   * Channel-Name (z.B. "web-chat", "phone", "whatsapp")
   */
  readonly name: string;

  /**
   * Channel-Typ (text, voice, multimodal)
   */
  readonly type: ChannelType;

  /**
   * Nachricht senden
   */
  sendMessage(sessionId: string, message: ChannelMessage): Promise<ChannelResponse>;

  /**
   * Nachricht empfangen (wird vom Channel selbst aufgerufen)
   */
  receiveMessage(sessionId: string, message: ChannelMessage): Promise<void>;

  /**
   * Session erstellen
   */
  createSession(config: ChannelSessionConfig): Promise<ChannelSession>;

  /**
   * Session schließen
   */
  closeSession(sessionId: string): Promise<void>;

  /**
   * Session pausieren
   */
  pauseSession(sessionId: string): Promise<void>;

  /**
   * Session fortsetzen
   */
  resumeSession(sessionId: string): Promise<void>;

  /**
   * Session abrufen
   */
  getSession(sessionId: string): Promise<ChannelSession | null>;

  /**
   * Streaming-Nachricht senden (optional)
   */
  streamMessage?(
    sessionId: string,
    message: ChannelMessage,
  ): AsyncGenerator<ChannelResponse, void, unknown>;

  /**
   * Health Check
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Channel Factory Interface
 */
export interface IChannelFactory {
  /**
   * Channel erstellen
   */
  createChannel(name: string, config: Record<string, any>): Promise<IChannel>;

  /**
   * Verfügbare Channels auflisten
   */
  listChannels(): string[];

  /**
   * Channel-Registry abrufen
   */
  getRegistry(): Map<string, IChannel>;
}

