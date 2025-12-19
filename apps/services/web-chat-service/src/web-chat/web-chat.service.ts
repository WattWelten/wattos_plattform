import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from '@wattweiser/core';
import { OrchestratorModule, AgentRuntimeService } from '@wattweiser/core';
import {
  IChannel,
  ChannelMessage,
  ChannelResponse,
  ChannelSessionConfig,
  ChannelSession,
  ChannelType,
} from '@wattweiser/core';
import { v4 as uuid } from 'uuid';

/**
 * Web-Chat Service
 * 
 * Implementierung des Web-Chatbot Channels
 */
@Injectable()
export class WebChatService implements IChannel {
  private readonly logger = new Logger(WebChatService.name);
  readonly name = 'web-chat';
  readonly type = ChannelType.MULTIMODAL;
  private sessions: Map<string, ChannelSession> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly eventBus: EventBusService,
    private readonly agentRuntime: AgentRuntimeService,
  ) {}

  /**
   * Nachricht senden
   */
  async sendMessage(sessionId: string, message: ChannelMessage): Promise<ChannelResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    this.logger.debug(`Sending message on web-chat`, { sessionId, hasText: !!message.text });

    // TODO: Integration mit Orchestrator für Antwort-Generierung
    // Placeholder: Echo-Response
    const response: ChannelResponse = {
      message: message.text || 'Message received',
      metadata: {
        timestamp: Date.now(),
        sessionId,
      },
    };

    return response;
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

    this.logger.debug(`Received message on web-chat`, { sessionId, hasText: !!message.text });

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
      channelId: config.channelId,
      tenantId: config.tenantId,
      userId: config.userId,
      status: 'active',
      metadata: config.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    this.logger.log(`Web-chat session created: ${session.id}`);

    return session;
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

    this.logger.log(`Web-chat session closed: ${sessionId}`);
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

    this.logger.debug(`Web-chat session paused: ${sessionId}`);
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

    this.logger.debug(`Web-chat session resumed: ${sessionId}`);
  }

  /**
   * Session abrufen
   */
  async getSession(sessionId: string): Promise<ChannelSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Streaming-Nachricht senden
   */
  async *streamMessage(
    sessionId: string,
    message: ChannelMessage,
  ): AsyncGenerator<ChannelResponse, void, unknown> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    // TODO: Streaming-Integration mit Orchestrator
    // Placeholder: Chunked Response
    const words = (message.text || '').split(' ');
    for (const word of words) {
      yield {
        message: word + ' ',
        metadata: {
          chunk: true,
          timestamp: Date.now(),
        },
      };
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Prüfe ob Service erreichbar ist
      return this.sessions.size >= 0; // Immer true, solange Service läuft
    } catch {
      return false;
    }
  }
}

