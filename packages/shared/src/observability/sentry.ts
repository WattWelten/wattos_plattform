import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Sentry Integration (optional)
 * Error Tracking und Performance Monitoring
 * 
 * Installation:
 * npm install @sentry/node @sentry/profiling-node
 * 
 * Konfiguration:
 * SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
 * SENTRY_ENVIRONMENT=production
 * SENTRY_TRACES_SAMPLE_RATE=0.1
 */
@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private initialized = false;

  constructor(private configService?: ConfigService) {}

  async onModuleInit() {
    const dsn = this.configService?.get<string>('SENTRY_DSN') || process.env.SENTRY_DSN;
    
    if (!dsn) {
      this.logger.debug('Sentry is disabled. Set SENTRY_DSN to enable.');
      return;
    }

    try {
      // Sentry wird dynamisch geladen, falls verfügbar
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = require('@sentry/node');
      
      Sentry.init({
        dsn,
        environment: this.configService?.get<string>('SENTRY_ENVIRONMENT') || process.env.NODE_ENV || 'development',
        tracesSampleRate: parseFloat(
          this.configService?.get<string>('SENTRY_TRACES_SAMPLE_RATE') || 
          process.env.SENTRY_TRACES_SAMPLE_RATE || 
          '0.1'
        ),
        profilesSampleRate: parseFloat(
          this.configService?.get<string>('SENTRY_PROFILES_SAMPLE_RATE') || 
          process.env.SENTRY_PROFILES_SAMPLE_RATE || 
          '0.1'
        ),
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: undefined }), // Wird in main.ts konfiguriert
        ],
        beforeSend(event: any, hint: any) {
          // Filtere sensitive Daten
          if (event.request) {
            // Entferne Passwörter aus Request Body
            if (event.request.data && typeof event.request.data === 'object') {
              const data = event.request.data as Record<string, any>;
              if (data.password) {
                data.password = '[REDACTED]';
              }
              if (data.token) {
                data.token = '[REDACTED]';
              }
            }
          }
          return event;
        },
      });

      this.initialized = true;
      this.logger.log('Sentry initialized successfully');
    } catch (error) {
      // Sentry-Pakete nicht installiert - das ist OK
      this.logger.warn('Sentry packages not installed. Install @sentry/node to enable error tracking.');
      this.logger.debug(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Manuelles Senden eines Fehlers an Sentry
   */
  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    try {
      const Sentry = require('@sentry/node');
      Sentry.captureException(error, {
        extra: context,
      });
    } catch {
      // Ignoriere Fehler wenn Sentry nicht verfügbar ist
    }
  }

  /**
   * Manuelles Senden einer Nachricht an Sentry
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }

    try {
      const Sentry = require('@sentry/node');
      Sentry.captureMessage(message, {
        level,
        extra: context,
      });
    } catch {
      // Ignoriere Fehler wenn Sentry nicht verfügbar ist
    }
  }

  /**
   * Setzt User-Context für Sentry
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.initialized) {
      return;
    }

    try {
      const Sentry = require('@sentry/node');
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    } catch {
      // Ignoriere Fehler wenn Sentry nicht verfügbar ist
    }
  }
}
