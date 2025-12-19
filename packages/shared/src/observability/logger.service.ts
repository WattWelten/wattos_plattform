import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino from 'pino';

/**
 * Structured Logging Service
 * Verwendet Pino für performantes, strukturiertes JSON-Logging
 */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLoggerService implements LoggerService {
  private logger: pino.Logger;
  private context?: string;

  constructor(private configService?: ConfigService) {
    const nodeEnv = configService?.get<string>('NODE_ENV') || process.env.NODE_ENV || 'development';
    const logLevel = configService?.get<string>('LOG_LEVEL') || process.env.LOG_LEVEL || (nodeEnv === 'production' ? 'info' : 'debug');

    this.logger = pino({
      level: logLevel,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...(nodeEnv !== 'production' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
      base: {
        env: nodeEnv,
        service: process.env.SERVICE_NAME || 'unknown',
      },
    });
  }

  setContext(context: string) {
    this.context = context;
    return this;
  }

  private createChildLogger(additionalFields?: Record<string, any>): pino.Logger {
    const fields: Record<string, any> = {};
    if (this.context) {
      fields.context = this.context;
    }
    return this.logger.child({ ...fields, ...additionalFields });
  }

  log(message: string, ...optionalParams: any[]) {
    const child = this.createChildLogger();
    const metadata = this.extractMetadata(optionalParams);
    child.info(metadata, message);
  }

  error(message: string, trace?: string, context?: string) {
    const child = this.createChildLogger({ context: context || this.context });
    child.error({ trace, err: trace ? new Error(trace) : undefined }, message);
  }

  warn(message: string, ...optionalParams: any[]) {
    const child = this.createChildLogger();
    const metadata = this.extractMetadata(optionalParams);
    child.warn(metadata, message);
  }

  debug(message: string, ...optionalParams: any[]) {
    const child = this.createChildLogger();
    const metadata = this.extractMetadata(optionalParams);
    child.debug(metadata, message);
  }

  verbose(message: string, ...optionalParams: any[]) {
    const child = this.createChildLogger();
    const metadata = this.extractMetadata(optionalParams);
    child.trace(metadata, message);
  }

  /**
   * Strukturiertes Logging mit Metadaten
   */
  logWithMetadata(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata: Record<string, any>) {
    const child = this.createChildLogger(metadata);
    child[level](metadata, message);
  }

  /**
   * Performance-Logging
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
    const child = this.createChildLogger({
      ...metadata,
      operation,
      duration_ms: duration,
      type: 'performance',
    });
    child.info({ operation, duration_ms: duration, ...metadata }, `Performance: ${operation} took ${duration}ms`);
  }

  /**
   * Request-Logging
   */
  logRequest(method: string, url: string, statusCode: number, duration: number, metadata?: Record<string, any>) {
    const child = this.createChildLogger({
      ...metadata,
      method,
      url,
      statusCode,
      duration_ms: duration,
      type: 'http_request',
    });
    child.info({ method, url, statusCode, duration_ms: duration, ...metadata }, `${method} ${url} - ${statusCode} - ${duration}ms`);
  }

  /**
   * Metadaten aus optionalen Parametern extrahieren
   */
  private extractMetadata(optionalParams: any[]): Record<string, any> {
    if (optionalParams.length === 0) {
      return {};
    }

    // Wenn erster Parameter ein Objekt ist, verwende es als Metadaten
    if (optionalParams.length === 1 && typeof optionalParams[0] === 'object' && optionalParams[0] !== null) {
      return optionalParams[0];
    }

    // Sonst alle Parameter als Array speichern
    return { params: optionalParams };
  }
}











