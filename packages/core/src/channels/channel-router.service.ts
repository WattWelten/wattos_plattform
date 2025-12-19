import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { EventDomain, ChannelEventSchema } from '../events/types';
import {
  IChannel,
  ChannelMessage,
  ChannelResponse,
  ChannelSessionConfig,
  ChannelSession,
  ChannelType,
} from './interfaces/channel.interface';
import { v4 as uuid } from 'uuid';

/**
 * Channel Router Service
 * 
 * Einheitliche API für alle Channels mit Cross-Channel Session-Management
 */
@Injectable()
export class ChannelRouterService {
  private readonly logger = new Logger(ChannelRouterService.name);
  private channels: Map<string, IChannel> = new Map();
  private sessions: Map<string, ChannelSession> = new Map();

  constructor(private readonly eventBus: EventBusService) {}

  /**
   * Channel registrieren
   */
  registerChannel(channel: IChannel): void {
    if (this.channels.has(channel.name)) {
      this.logger.warn(`Channel already registered: ${channel.name}, overwriting...`);
    }

    this.channels.set(channel.name, channel);
    this.logger.log(`Channel registered: ${channel.name} (${channel.type})`);
  }

  /**
   * Channel abrufen
   */
  getChannel(channelName: string): IChannel {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new NotFoundException(`Channel not found: ${channelName}`);
    }
    return channel;
  }

  /**
   * Alle Channels auflisten
   */
  listChannels(): IChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Session erstellen
   */
  async createSession(
    channelName: string,
    config: ChannelSessionConfig,
  ): Promise<ChannelSession> {
    const channel = this.getChannel(channelName);

    const session = await channel.createSession(config);
    this.sessions.set(session.id, session);

    // Emit Session Created Event
    const event = ChannelEventSchema.parse({
      id: uuid(),
      type: 'channel.session.created',
      domain: EventDomain.CHANNEL,
      action: 'session.created',
      timestamp: Date.now(),
      sessionId: session.id,
      tenantId: config.tenantId,
      userId: config.userId,
      payload: {
        channel: channelName,
        channelId: config.channelId,
      },
    });

    await this.eventBus.emit(event);

    this.logger.debug(`Session created: ${session.id} on channel: ${channelName}`);
    return session;
  }

  /**
   * Nachricht senden
   */
  async sendMessage(
    channelName: string,
    sessionId: string,
    message: ChannelMessage,
  ): Promise<ChannelResponse> {
    const channel = this.getChannel(channelName);
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    if (session.status !== 'active') {
      throw new Error(`Session is not active: ${session.status}`);
    }

    this.logger.debug(`Sending message on channel: ${channelName}`, { sessionId });

    const response = await channel.sendMessage(sessionId, message);

    // Emit Message Sent Event
    const event = ChannelEventSchema.parse({
      id: uuid(),
      type: 'channel.message.sent',
      domain: EventDomain.CHANNEL,
      action: 'message.sent',
      timestamp: Date.now(),
      sessionId,
      tenantId: session.tenantId,
      userId: session.userId,
      payload: {
        channel: channelName,
        channelId: session.channelId,
        message: message.text || '[media]',
        direction: 'outbound',
      },
    });

    await this.eventBus.emit(event);

    return response;
  }

  /**
   * Nachricht empfangen (von Channel aufgerufen)
   */
  async receiveMessage(
    channelName: string,
    sessionId: string,
    message: ChannelMessage,
  ): Promise<void> {
    const channel = this.getChannel(channelName);
    let session = this.sessions.get(sessionId);

    // Erstelle Session falls nicht vorhanden
    if (!session) {
      this.logger.debug(`Creating session for received message: ${sessionId}`);
      // TODO: Session aus Channel-Konfiguration erstellen
      // session = await this.createSession(channelName, { ... });
    }

    await channel.receiveMessage(sessionId, message);

    // Emit Message Received Event
    const event = ChannelEventSchema.parse({
      id: uuid(),
      type: 'channel.message.received',
      domain: EventDomain.CHANNEL,
      action: 'message.received',
      timestamp: Date.now(),
      sessionId,
      tenantId: session?.tenantId || 'unknown',
      userId: session?.userId,
      payload: {
        channel: channelName,
        channelId: session?.channelId || 'unknown',
        message: message.text || '[media]',
        direction: 'inbound',
      },
    });

    await this.eventBus.emit(event);
  }

  /**
   * Session schließen
   */
  async closeSession(channelName: string, sessionId: string): Promise<void> {
    const channel = this.getChannel(channelName);
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    await channel.closeSession(sessionId);
    this.sessions.delete(sessionId);

    // Emit Session Closed Event
    const event = ChannelEventSchema.parse({
      id: uuid(),
      type: 'channel.session.closed',
      domain: EventDomain.CHANNEL,
      action: 'session.closed',
      timestamp: Date.now(),
      sessionId,
      tenantId: session.tenantId,
      userId: session.userId,
      payload: {
        channel: channelName,
        channelId: session.channelId,
      },
    });

    await this.eventBus.emit(event);

    this.logger.debug(`Session closed: ${sessionId} on channel: ${channelName}`);
  }

  /**
   * Session abrufen
   */
  getSession(sessionId: string): ChannelSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Sessions nach Tenant filtern
   */
  getSessionsByTenant(tenantId: string): ChannelSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.tenantId === tenantId);
  }

  /**
   * Sessions nach Channel filtern
   */
  getSessionsByChannel(channelName: string): ChannelSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.channel === channelName);
  }

  /**
   * Channel-Wechsel (z.B. Web → WhatsApp)
   */
  async switchChannel(
    sessionId: string,
    fromChannel: string,
    toChannel: string,
  ): Promise<ChannelSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    // Schließe alte Session
    await this.closeSession(fromChannel, sessionId);

    // Erstelle neue Session auf neuem Channel
    const newSession = await this.createSession(toChannel, {
      tenantId: session.tenantId,
      userId: session.userId,
      channelId: session.channelId,
      metadata: {
        ...session.metadata,
        previousChannel: fromChannel,
        switchedAt: Date.now(),
      },
    });

    this.logger.log(`Session switched from ${fromChannel} to ${toChannel}: ${sessionId}`);
    return newSession;
  }

  /**
   * Health Check für alle Channels
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};

    await Promise.all(
      Array.from(this.channels.entries()).map(async ([name, channel]) => {
        try {
          health[name] = await channel.healthCheck();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(`Health check failed for channel ${name}: ${errorMessage}`, errorStack);
          health[name] = false;
        }
      }),
    );

    return health;
  }
}

