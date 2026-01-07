import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { StructuredLoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

/**
 * Request Logging Middleware
 * Loggt alle HTTP-Requests mit Metadaten und zeichnet Metriken auf
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: StructuredLoggerService,
    private readonly metrics?: MetricsService,
  ) {
    this.logger.setContext('RequestLogging');
  }

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const requestId = (req as any).requestId || 'unknown';
    const method = req.method;
    const url = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Log Request Start
    this.logger.debug('Incoming request', {
      requestId,
      method,
      url,
      userAgent,
      ip,
      headers: {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
      },
    });

    // Track Response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Log Request Completion
      this.logger.logRequest(method, url, statusCode, duration, {
        requestId,
        userAgent,
        ip,
      });

      // Record Metrics
      if (this.metrics) {
        this.metrics.recordHttpRequest(method, url, statusCode, duration);
      }
    });

    // Track Errors
    res.on('error', (error: Error) => {
      const duration = Date.now() - startTime;
      this.logger.error('Request error', error.stack, 'RequestLogging');
      this.logger.logWithMetadata('error', 'Request error', {
        requestId,
        method,
        url,
        duration_ms: duration,
        error: error.message,
        stack: error.stack,
      });
    });

    next();
  }
}

