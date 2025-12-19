import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from '@wattweiser/core';
import {
  IChannel,
  ChannelMessage,
  ChannelResponse,
  ChannelSessionConfig,
  ChannelSession,
  ChannelType,
} from '@wattweiser/core';
import { MetaWhatsAppAdapter } from './adapters/meta.adapter';
import { v4 as uuid } from 'uuid';

/**
 * WhatsApp-Bot Service
 * 
 * Implementierung des WhatsApp Channels
 */
@Injectable()
export class WhatsAppBotService implements IChannel {
  private readonly logger = new Logger(WhatsAppBotService.name);
  readonly name = 'whatsapp';
  readonly type = ChannelType.TEXT;
  private sessions: Map<string, ChannelSession> = new Map();
  private phoneNumberToSessionId: Map<string, string> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly eventBus: EventBusService,
    private readonly metaAdapter: MetaWhatsAppAdapter,
  ) {}

  /**
   * Nachricht senden
   */
  async sendMessage(sessionId: string, message: ChannelMessage): Promise<ChannelResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    this.logger.debug(`Sending message on WhatsApp`, { sessionId, hasText: !!message.text, hasMedia: !!message.media });

    let messageId: string;

    if (message.media) {
      // Media-Nachricht senden
      messageId = await this.metaAdapter.sendMedia(
        session.channelId,
        message.media.url,
        message.media.type as 'image' | 'video' | 'document',
      );
    } else if (message.text) {
      // Text-Nachricht senden
      messageId = await this.metaAdapter.sendMessage(session.channelId, message.text);
    } else {
      throw new Error('Message must contain either text or media');
    }

    return {
      message: message.text || '[media]',
      metadata: {
        messageId,
        timestamp: Date.now(),
        sessionId,
      },
    };
  }

  /**
   * Nachricht empfangen
   */
  async receiveMessage(sessionId: string, message: ChannelMessage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Received message for unknown session: ${sessionId}`);
      return;
    }

    this.logger.debug(`Received message on WhatsApp`, { sessionId, hasText: !!message.text, hasMedia: !!message.media });

    // TODO: Event an Orchestrator weiterleiten
    // await this.agentRuntime.routeEvent(...);
  }

  /**
   * Session erstellen
   */
  async createSession(config: ChannelSessionConfig): Promise<ChannelSession> {
    const session: ChannelSession = {
      id: uuid(),
      channel: this.name,
      channelId: config.channelId, // WhatsApp Phone Number
      tenantId: config.tenantId,
      userId: config.userId,
      status: 'active',
      metadata: config.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    this.phoneNumberToSessionId.set(config.channelId, session.id);

    this.logger.log(`WhatsApp session created: ${session.id} for ${config.channelId}`);
    return session;
  }

  /**
   * Session aus Phone Number abrufen
   */
  getSessionByPhoneNumber(phoneNumber: string): ChannelSession | undefined {
    const sessionId = this.phoneNumberToSessionId.get(phoneNumber);
    if (!sessionId) {
      return undefined;
    }
    return this.sessions.get(sessionId);
  }

  /**
   * Session schließen
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    session.status = 'closed';
    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);
    this.phoneNumberToSessionId.delete(session.channelId);

    this.logger.log(`WhatsApp session closed: ${sessionId}`);
  }

  /**
   * Session pausieren
   */
  async pauseSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    session.status = 'paused';
    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);

    this.logger.debug(`WhatsApp session paused: ${sessionId}`);
  }

  /**
   * Session fortsetzen
   */
  async resumeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    session.status = 'active';
    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);

    this.logger.debug(`WhatsApp session resumed: ${sessionId}`);
  }

  /**
   * Session abrufen
   */
  async getSession(sessionId: string): Promise<ChannelSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Template-Message senden
   */
  async sendTemplate(sessionId: string, templateName: string, languageCode: string = 'de'): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    return await this.metaAdapter.sendTemplate(session.channelId, templateName, languageCode);
  }

  /**
   * Interactive Message senden
   */
  async sendInteractive(
    sessionId: string,
    body: string,
    buttons: Array<{ id: string; title: string }>,
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    return await this.metaAdapter.sendInteractive(session.channelId, body, buttons);
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.metaAdapter.healthCheck();
    } catch {
      return false;
    }
  }
}

