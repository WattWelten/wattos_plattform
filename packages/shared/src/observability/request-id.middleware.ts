import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request-ID Middleware
 * Generiert eine eindeutige Request-ID für jeden Request und fügt sie zu Headers und Context hinzu
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Prüfe ob bereits eine Request-ID im Header vorhanden ist (z.B. von Upstream-Service)
    const existingRequestId = req.headers['x-request-id'] as string;
    const requestId = existingRequestId || randomUUID();

    // Füge Request-ID zu Request-Objekt hinzu (für Zugriff in Controllers/Services)
    (req as any).requestId = requestId;

    // Setze Response-Header
    res.setHeader('X-Request-ID', requestId);

    // Füge Request-ID zu AsyncLocalStorage hinzu (für Logger-Context)
    // Dies ermöglicht automatisches Hinzufügen der Request-ID zu allen Logs
    if (typeof (global as any).asyncLocalStorage !== 'undefined') {
      const store = (global as any).asyncLocalStorage.getStore();
      if (store) {
        store.requestId = requestId;
      }
    }

    next();
  }
}










