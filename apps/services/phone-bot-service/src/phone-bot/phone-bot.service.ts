import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBusService, AsrService, TtsService } from '@wattweiser/core';
import {
  IChannel,
  ChannelMessage,
  ChannelResponse,
  ChannelSessionConfig,
  ChannelSession,
  ChannelType,
} from '@wattweiser/core';
import { TwilioAdapter } from './adapters/twilio.adapter';
import { v4 as uuid } from 'uuid';

/**
 * Phone-Bot Service
 * 
 * Implementierung des Telefonbot Channels
 */
@Injectable()
export class PhoneBotService implements IChannel {
  private readonly logger = new Logger(PhoneBotService.name);
  readonly name = 'phone';
  readonly type = ChannelType.VOICE;
  private sessions: Map<string, ChannelSession> = new Map();
  private callSidToSessionId: Map<string, string> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly eventBus: EventBusService,
    private readonly twilioAdapter: TwilioAdapter,
    private readonly asrService: AsrService,
    private readonly ttsService: TtsService,
  ) {}

  /**
   * Nachricht senden (Audio)
   */
  async sendMessage(sessionId: string, message: ChannelMessage): Promise<ChannelResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    this.logger.debug(`Sending audio message on phone`, { sessionId });

    // Text zu Audio konvertieren
    const audioBuffer = await this.ttsService.textToSpeech(
      message.text || '',
      sessionId,
      session.tenantId,
      'de',
      undefined,
      undefined,
    );

    // TODO: Audio über Twilio Stream senden
    // await this.twilioAdapter.sendAudio(session.channelId, audioBuffer);

    return {
      message: message.text || '',
      audio: audioBuffer,
      metadata: {
        timestamp: Date.now(),
        sessionId,
      },
    };
  }

  /**
   * Nachricht empfangen (Audio)
   */
  async receiveMessage(sessionId: string, message: ChannelMessage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.warn(`Received message for unknown session: ${sessionId}`);
      return;
    }

    this.logger.debug(`Received audio message on phone`, { sessionId, hasAudio: !!message.audio });

    if (message.audio) {
      // Audio zu Text konvertieren
      const text = await this.asrService.speechToText(
        message.audio,
        sessionId,
        session.tenantId,
        'de',
      );

      // TODO: Text an Orchestrator weiterleiten
      // await this.agentRuntime.routeEvent(...);
    }
  }

  /**
   * Session erstellen (bei Incoming Call)
   */
  async createSession(config: ChannelSessionConfig): Promise<ChannelSession> {
    const session: ChannelSession = {
      id: uuid(),
      channel: this.name,
      channelId: config.channelId, // Call SID
      tenantId: config.tenantId,
      userId: config.userId,
      status: 'active',
      metadata: {
        ...config.metadata,
        callStartTime: Date.now(),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    this.callSidToSessionId.set(config.channelId, session.id);

    this.logger.log(`Phone session created: ${session.id} for call: ${config.channelId}`);
    return session;
  }

  /**
   * Session aus Call SID abrufen
   */
  getSessionByCallSid(callSid: string): ChannelSession | undefined {
    const sessionId = this.callSidToSessionId.get(callSid);
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

    // Call beenden
    try {
      await this.twilioAdapter.hangupCall(session.channelId);
    } catch (error: any) {
      this.logger.error(`Failed to hangup call: ${error.message}`);
    }

    session.status = 'closed';
    session.updatedAt = Date.now();
    this.sessions.set(sessionId, session);
    this.callSidToSessionId.delete(session.channelId);

    this.logger.log(`Phone session closed: ${sessionId}`);
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

    this.logger.debug(`Phone session paused: ${sessionId}`);
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

    this.logger.debug(`Phone session resumed: ${sessionId}`);
  }

  /**
   * Session abrufen
   */
  async getSession(sessionId: string): Promise<ChannelSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.twilioAdapter.healthCheck();
    } catch {
      return false;
    }
  }
}

