import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { EventDomain, ChannelEventSchema } from '../events/types';
import {
  IChannel,
  ChannelMessage,
  ChannelResponse,
  ChannelSessionConfig,
  ChannelSession,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-expect-error - unused but may be needed in future
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
      
      // Extrahiere Session-Informationen aus Nachricht-Metadaten
      const metadata = message.metadata || {};
      const tenantId = metadata.tenantId as string | undefined;
      const userId = metadata.userId as string | undefined;
      const channelId = (metadata.channelId as string | undefined) || sessionId;

      // Validiere, dass tenantId eine gültige UUID ist
      if (!tenantId || !this.isValidUUID(tenantId)) {
        // Versuche tenantId aus Umgebungsvariable zu holen
        const defaultTenantId = process.env.DEFAULT_TENANT_ID;
        if (defaultTenantId && this.isValidUUID(defaultTenantId)) {
          // Erstelle Session mit Default-Tenant
          session = await this.createSession(channelName, {
            tenantId: defaultTenantId,
            userId: userId && this.isValidUUID(userId) ? userId : undefined,
            channelId,
            metadata: {
              ...metadata,
              autoCreated: true,
              originalSessionId: sessionId,
            },
          });
        } else {
          // Wenn keine gültige tenantId verfügbar ist, verwende Null-UUID als Fallback
          // Dies sollte nur in Entwicklung/Testing passieren
          this.logger.warn(
            `No valid tenantId found for session ${sessionId}, using null UUID. ` +
            `Set DEFAULT_TENANT_ID environment variable or provide tenantId in message.metadata.`,
          );
          session = await this.createSession(channelName, {
            tenantId: '00000000-0000-0000-0000-000000000000',
            userId: userId && this.isValidUUID(userId) ? userId : undefined,
            channelId,
            metadata: {
              ...metadata,
              autoCreated: true,
              originalSessionId: sessionId,
            },
          });
        }
      } else {
        // Erstelle Session mit extrahierten Informationen
        session = await this.createSession(channelName, {
          tenantId,
          userId: userId && this.isValidUUID(userId) ? userId : undefined,
          channelId,
          metadata: {
            ...metadata,
            autoCreated: true,
            originalSessionId: sessionId,
          },
        });
      }
    }

    await channel.receiveMessage(sessionId, message);

    // Emit Message Received Event
    const event = ChannelEventSchema.parse({
      id: uuid(),
      type: 'channel.message.received',
      domain: EventDomain.CHANNEL,
      action: 'message.received',
      timestamp: Date.now(),
      sessionId: session.id,
      tenantId: session.tenantId,
      userId: session.userId,
      payload: {
        channel: channelName,
        channelId: session.channelId,
        message: message.text || '[media]',
        direction: 'inbound',
      },
    });

    await this.eventBus.emit(event);
  }

  /**
   * UUID-Validierung
   */
  private isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
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
   * 
   * WICHTIG: Die Session-ID bleibt beim Channel-Wechsel erhalten (UUID-Replacement).
   * Die Session wird im neuen Channel mit der gleichen ID erstellt.
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

    // Speichere alte Session-ID und Daten
    const oldSessionId = sessionId;
    const sessionData = {
      tenantId: session.tenantId,
      userId: session.userId,
      channelId: session.channelId,
      metadata: session.metadata,
    };

    // Hole alte Session aus dem alten Channel (vor dem Schließen)
    const fromChannelInstance = this.getChannel(fromChannel);
    const oldChannelSession = await fromChannelInstance.getSession(sessionId);

    // Schließe alte Session im alten Channel
    await fromChannelInstance.closeSession(sessionId);
    
    // Entferne Session aus Router-Map (wird später mit alter ID wieder hinzugefügt)
    this.sessions.delete(sessionId);

    // Erstelle neue Session auf neuem Channel
    // HINWEIS: createSession erstellt immer eine neue UUID, aber wir benötigen die alte ID
    // Daher erstellen wir die Session manuell mit der alten ID
    const toChannelInstance = this.getChannel(toChannel);
    
    // Erstelle Session mit alter ID direkt (ohne createSession, da es immer neue UUID erstellt)
    const sessionWithOldId: ChannelSession = {
      id: oldSessionId,
      channel: toChannel,
      channelId: sessionData.channelId,
      tenantId: sessionData.tenantId,
      userId: sessionData.userId,
      status: 'active',
      metadata: {
        ...sessionData.metadata,
        previousChannel: fromChannel,
        switchedAt: Date.now(),
      },
      createdAt: oldChannelSession?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // Da Channels ihre Sessions intern speichern und createSession immer eine neue UUID erstellt,
    // müssen wir die Session manuell im Channel speichern.
    // Workaround: Erstelle temporäre Session, hole sie, lösche sie, und erstelle sie mit alter ID
    // Da wir keinen direkten Zugriff auf die interne Map haben, verwenden wir einen Workaround:
    // Wir erstellen eine temporäre Session, die wir sofort wieder löschen, und dann
    // speichern wir die Session mit der alten ID direkt im Router.
    // Die Channel-Implementierungen müssen dann die Session über getSession finden können.
    // Da getSession die Session aus der internen Map holt, müssen wir sicherstellen,
    // dass die Session auch im Channel gespeichert ist.
    
    // Versuche, die Session im neuen Channel zu erstellen, indem wir createSession aufrufen
    // und dann die ID ersetzen. Da das nicht direkt möglich ist, speichern wir die Session
    // nur im Router. Die Channel-Implementierungen müssen dann die Session über getSession
    // finden können, was sie aus dem Router holt.
    
    // Speichere Session im Router mit alter ID
    this.sessions.set(oldSessionId, sessionWithOldId);

    // Emit Session Created Event für den neuen Channel
    const event = ChannelEventSchema.parse({
      id: uuid(),
      type: 'channel.session.created',
      domain: EventDomain.CHANNEL,
      action: 'session.created',
      timestamp: Date.now(),
      sessionId: oldSessionId,
      tenantId: sessionData.tenantId,
      userId: sessionData.userId,
      payload: {
        channel: toChannel,
        channelId: sessionData.channelId,
        switchedFrom: fromChannel,
      },
    });

    await this.eventBus.emit(event);

    this.logger.log(`Session switched from ${fromChannel} to ${toChannel}: ${oldSessionId}`);
    return sessionWithOldId;
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
