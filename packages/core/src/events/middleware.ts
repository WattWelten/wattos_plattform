import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { EventBusService } from './bus.service';
import { EventDomain, ChannelEventSchema } from './types';
import { v4 as uuid } from 'uuid';
import { safeJsonStringify } from '@wattweiser/shared';

/**
 * Event Middleware
 * 
 * Erfasst HTTP-Requests als Channel-Events
 */
@Injectable()
export class EventMiddleware implements NestMiddleware {
  constructor(private readonly eventBus: EventBusService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    // Erstelle Session-ID falls nicht vorhanden
    const sessionId = (req.headers['x-session-id'] as string) || uuid();
    req.headers['x-session-id'] = sessionId;

    // Erfasse Request als Event (optional, kann konfiguriert werden)
    const captureEvents = process.env.CAPTURE_HTTP_EVENTS === 'true';
    
    if (captureEvents) {
      const tenantId = (req.headers['x-tenant-id'] as string) || 'default';
      const userId = (req.headers['x-user-id'] as string);

      // Emit Channel Event für eingehende Requests
      if (req.method === 'POST' || req.method === 'PUT') {
        const event = ChannelEventSchema.parse({
          id: uuid(),
          type: 'channel.message.received',
          domain: EventDomain.CHANNEL,
          action: 'message.received',
          timestamp: Date.now(),
          sessionId,
          tenantId,
          userId,
          payload: {
            channel: 'http',
            channelId: req.path,
            message: safeJsonStringify(req.body, { strict: true }),
            direction: 'inbound',
          },
        });

        this.eventBus.emit(event).catch((_error) => {
          // Nicht blockierend, nur loggen
          // Error wird bereits im EventBusService geloggt
        });
      }
    }

    next();
  }
}

