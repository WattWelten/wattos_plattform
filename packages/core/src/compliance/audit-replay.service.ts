import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../events/bus.service';
import { Event, EventDomain } from '../events/types';
import { ProfileService } from '../profiles/profile.service';

/**
 * Replay Session
 */
export interface ReplaySession {
  sessionId: string;
  tenantId: string;
  userId?: string;
  events: Event[];
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * Audit Replay Service
 * 
 * Verwaltet Audit-Logs und Replay-Funktionalität
 */
@Injectable()
export class AuditReplayService {
  private readonly logger = new Logger(AuditReplayService.name);
  private eventHistory: Map<string, Event[]> = new Map(); // sessionId -> events (In-Memory Cache)
  private replaySessions: Map<string, ReplaySession> = new Map(); // replayId -> session
  private readonly redis: Redis;
  private readonly useRedis: boolean;
  private readonly maxHistorySize: number = 1000;

  constructor(
    private readonly eventBus: EventBusService,
    private readonly profileService: ProfileService,
    private readonly configService: ConfigService,
  ) {
    // Redis für Event-History-Persistierung (optional)
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.useRedis = !!redisUrl;
    
    if (this.useRedis) {
      this.redis = new Redis(redisUrl!, {
        maxRetriesPerRequest: null,
      });
      this.logger.log('Audit Replay Service: Redis enabled for event history');
    } else {
      this.logger.warn('Audit Replay Service: Redis not configured, using in-memory only');
    }

    // Subscribe zu allen Event-Domains für History (nutzt Pattern-Subscription)
    Object.values(EventDomain).forEach((domain) => {
      this.eventBus.subscribePattern(`${domain}.*`, async (event: Event) => {
        await this.addEventToHistory(event);
      });
    });
  }

  /**
   * Event zur History hinzufügen
   */
  private async addEventToHistory(event: Event): Promise<void> {
    const sessionId = event.sessionId;

    // In-Memory Cache
    const history = this.eventHistory.get(sessionId) || [];
    history.push(event);
    
    // Limit History (Circular Buffer)
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
    this.eventHistory.set(sessionId, history);

    // Redis Persistierung (wenn aktiviert)
    if (this.useRedis) {
      try {
        // Nutze Redis Streams für Event-History
        await this.redis.xadd(
          `events:history:${sessionId}`,
          '*',
          'event',
          JSON.stringify(event),
        );
        
        // TTL setzen (30 Tage)
        await this.redis.expire(`events:history:${sessionId}`, 2592000);
        
        // Limit Stream-Größe (max. 10000 Events)
        await this.redis.xtrim(`events:history:${sessionId}`, 'MAXLEN', '~', '10000');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to persist event to Redis: ${errorMessage}`);
      }
    }
  }

  /**
   * Event-History abrufen
   */
  async getEventHistory(
    sessionId: string,
    options?: {
      startTime?: number;
      endTime?: number;
      domain?: EventDomain;
      limit?: number;
    },
  ): Promise<Event[]> {
    let history: Event[] = [];

    // Versuche zuerst aus Redis zu laden (wenn aktiviert)
    if (this.useRedis) {
      try {
        const streamKey = `events:history:${sessionId}`;
        const streamData = await this.redis.xrange(streamKey, '-', '+', 'COUNT', 10000);
        
        history = streamData.map(([id, fields]) => {
          const eventField = fields.find(([key]) => key === 'event');
          if (eventField) {
            return JSON.parse(eventField[1]) as Event;
          }
          return null;
        }).filter((e): e is Event => e !== null);
        
        this.logger.debug(`Loaded ${history.length} events from Redis for session: ${sessionId}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Failed to load events from Redis: ${errorMessage}, falling back to in-memory`);
        // Fallback zu In-Memory
        history = this.eventHistory.get(sessionId) || [];
      }
    } else {
      // In-Memory nur
      history = this.eventHistory.get(sessionId) || [];
    }

    let filtered = history;

    // Filter nach Zeit
    if (options?.startTime) {
      filtered = filtered.filter((e) => e.timestamp >= options.startTime!);
    }
    if (options?.endTime) {
      filtered = filtered.filter((e) => e.timestamp <= options.endTime!);
    }

    // Filter nach Domain
    if (options?.domain) {
      filtered = filtered.filter((e) => e.domain === options.domain);
    }

    // Limit
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * Replay-Session erstellen
   */
  async createReplaySession(
    sessionId: string,
    tenantId: string,
    options?: {
      startTime?: number;
      endTime?: number;
      domain?: EventDomain;
    },
  ): Promise<ReplaySession> {
    const events = await this.getEventHistory(sessionId, options);
    const replayId = `replay-${sessionId}-${Date.now()}`;

    const replaySession: ReplaySession = {
      sessionId,
      tenantId,
      events,
      startTime: options?.startTime || events[0]?.timestamp || Date.now(),
      endTime: options?.endTime || events[events.length - 1]?.timestamp,
      duration: options?.endTime && options?.startTime
        ? options.endTime - options.startTime
        : undefined,
    };

    this.replaySessions.set(replayId, replaySession);

    this.logger.log(`Replay session created: ${replayId}`, {
      eventCount: events.length,
      duration: replaySession.duration,
    });

    return replaySession;
  }

  /**
   * Replay-Session abrufen
   */
  getReplaySession(replayId: string): ReplaySession | null {
    return this.replaySessions.get(replayId) || null;
  }

  /**
   * Replay durchführen (Events erneut emittieren)
   */
  async replaySession(
    replayId: string,
    options?: {
      speed?: number; // 1.0 = normal, 2.0 = 2x speed
      startFrom?: number; // Event-Index
    },
  ): Promise<void> {
    const session = this.getReplaySession(replayId);
    if (!session) {
      throw new Error(`Replay session not found: ${replayId}`);
    }

    const speed = options?.speed || 1.0;
    const startFrom = options?.startFrom || 0;
    const events = session.events.slice(startFrom);

    this.logger.log(`Replaying session: ${replayId}`, {
      eventCount: events.length,
      speed,
    });

    // Events sequenziell emittieren (mit Zeit-Delay)
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const nextEvent = events[i + 1];

      // Emit Event
      await this.eventBus.emit(event);

      // Delay basierend auf Zeit-Differenz zum nächsten Event
      if (nextEvent) {
        const delay = (nextEvent.timestamp - event.timestamp) / speed;
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }

    this.logger.log(`Replay completed: ${replayId}`);
  }

  /**
   * Audit-Log exportieren
   */
  async exportAuditLog(
    tenantId: string,
    sessionId: string,
    format: 'json' | 'csv' = 'json',
  ): Promise<string> {
    const events = await this.getEventHistory(sessionId);
    const profile = await this.profileService.getProfile(tenantId);

    if (format === 'json') {
      return JSON.stringify(
        {
          sessionId,
          tenantId,
          profile: {
            market: profile.market,
            mode: profile.mode,
          },
          events,
          exportedAt: new Date().toISOString(),
        },
        null,
        2,
      );
    } else {
      // CSV Format
      const headers = ['timestamp', 'domain', 'action', 'sessionId', 'tenantId', 'userId'];
      const rows = events.map((e) => [
        new Date(e.timestamp).toISOString(),
        e.domain,
        e.type.split('.').pop() || '',
        e.sessionId,
        e.tenantId,
        e.userId || '',
      ]);

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
  }

  /**
   * Sleep Helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

