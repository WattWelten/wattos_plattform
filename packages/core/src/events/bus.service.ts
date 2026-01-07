import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuid } from 'uuid';
import { Event, EventHandler, BaseEventSchema } from './types';
import { safeJsonParse, safeJsonStringify } from '@wattweiser/shared';

/**
 * Event Bus Service
 * 
 * Implementiert einen Redis-basierten Event-Bus für event-basierte Kommunikation
 * zwischen Services und Agenten.
 */
@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    
    this.publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    
    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }

  async onModuleInit() {
    try {
      await this.subscriber.ping();
      this.isConnected = true;
      this.logger.log('Event Bus connected to Redis');
      
      // Starte Subscriber
      this.subscriber.on('message', (channel, message) => {
        this.handleMessage(channel, message).catch((error) => {
          this.logger.error(`Error handling message from channel ${channel}: ${error.message}`, error.stack);
        });
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to connect to Redis: ${errorMessage}`);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    await this.publisher.quit();
    await this.subscriber.quit();
    this.logger.log('Event Bus disconnected from Redis');
  }

  /**
   * Event emittieren
   */
  async emit(event: Event): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Event Bus not connected, event will be lost', { eventType: event.type });
      return;
    }

    try {
      // Validiere Event
      const validatedEvent = BaseEventSchema.parse({
        ...event,
        id: event.id || uuid(),
        timestamp: event.timestamp || Date.now(),
      });

      // Publish zu Redis
      const channel = `events:${event.domain}:${event.action}`;
      await this.publisher.publish(channel, safeJsonStringify(validatedEvent, { strict: true }));
      
      this.logger.debug(`Event emitted: ${event.type}`, { channel, eventId: validatedEvent.id });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to emit event: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Event-Handler registrieren
   */
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
      
      // Subscribe zu Redis Channel
      const channel = this.getChannelFromEventType(eventType);
      this.subscriber.subscribe(channel).catch((error) => {
        this.logger.error(`Failed to subscribe to channel ${channel}: ${error.message}`);
      });
    }
    
    this.handlers.get(eventType)!.add(handler);
    this.logger.debug(`Handler registered for event type: ${eventType}`);
  }

  /**
   * Pattern-basierte Subscription (für Wildcards)
   * Nutzt Redis PSUBSCRIBE für Pattern-Matching
   */
  subscribePattern(pattern: string, handler: EventHandler): void {
    // Pattern-Format: "domain.*" oder "*.*"
    const redisPattern = this.getChannelPatternFromEventPattern(pattern);
    
    // Subscribe zu Redis Pattern
    this.subscriber.psubscribe(redisPattern).catch((error) => {
      this.logger.error(`Failed to subscribe to pattern ${redisPattern}: ${error.message}`);
    });

    // Handler für Pattern speichern
    if (!this.handlers.has(pattern)) {
      this.handlers.set(pattern, new Set());
    }
    this.handlers.get(pattern)!.add(handler);
    
    this.logger.debug(`Pattern handler registered: ${pattern}`);
    
    // Pattern-Message-Handler
    this.subscriber.on('pmessage', (pattern, channel, message) => {
      if (pattern === redisPattern) {
        this.handleMessage(channel, message).catch((error) => {
          this.logger.error(`Error handling pattern message: ${error.message}`, error.stack);
        });
      }
    });
  }

  /**
   * Event-Pattern zu Redis Pattern konvertieren
   */
  private getChannelPatternFromEventPattern(pattern: string): string {
    // "domain.*" -> "events:domain:*"
    // "*.*" -> "events:*"
    if (pattern === '*.*') {
      return 'events:*';
    }
    const [domain, action] = pattern.split('.');
    if (action === '*') {
      return `events:${domain}:*`;
    }
    return `events:${pattern.replace('.', ':')}`;
  }

  /**
   * Event-Handler entfernen
   */
  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
        const channel = this.getChannelFromEventType(eventType);
        this.subscriber.unsubscribe(channel).catch((error) => {
          this.logger.error(`Failed to unsubscribe from channel ${channel}: ${error.message}`);
        });
      }
    }
  }

  /**
   * Nachricht von Redis verarbeiten
   */
  private async handleMessage(channel: string, message: string): Promise<void> {
    try {
      const event: Event = safeJsonParse<Event>(message, { strict: true });
      const eventType = `${event.domain}.${event.action}`;
      
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        // Führe alle Handler parallel aus
        await Promise.all(
          Array.from(handlers).map(async (handler) => {
            try {
              await handler(event);
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              const errorStack = error instanceof Error ? error.stack : undefined;
              this.logger.error(
                `Error in event handler for ${eventType}: ${errorMessage}`,
                errorStack,
              );
            }
          }),
        );
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to handle message from channel ${channel}: ${errorMessage}`, errorStack);
    }
  }

  /**
   * Event-Type zu Redis Channel konvertieren
   */
  private getChannelFromEventType(eventType: string): string {
    // eventType Format: "domain.action" -> "events:domain:action"
    const [domain, ...actionParts] = eventType.split('.');
    const action = actionParts.join('.');
    return `events:${domain}:${action}`;
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.publisher.ping();
      return this.isConnected;
    } catch {
      return false;
    }
  }
}

