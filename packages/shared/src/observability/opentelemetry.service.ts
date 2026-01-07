import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * OpenTelemetry Service
 * Basis-Setup für OpenTelemetry (optional, für erweiterte Observability)
 * 
 * In Produktion sollte OpenTelemetry mit einem Collector (z.B. Jaeger, Zipkin, Grafana Tempo) integriert werden.
 * 
 * Installation:
 * npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/instrumentation
 * 
 * Beispiel-Konfiguration:
 * - Jaeger: OTEL_EXPORTER_JAEGER_ENDPOINT=http://localhost:14268/api/traces
 * - Zipkin: OTEL_EXPORTER_ZIPKIN_ENDPOINT=http://localhost:9411/api/v2/spans
 * - OTLP: OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
 */
@Injectable()
export class OpenTelemetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OpenTelemetryService.name);
  private initialized = false;

  constructor(private configService?: ConfigService) {}

  async onModuleInit() {
    const enabled = this.configService?.get<boolean>('OTEL_ENABLED', false) ?? false;
    
    if (!enabled) {
      this.logger.debug('OpenTelemetry is disabled. Set OTEL_ENABLED=true to enable.');
      return;
    }

    try {
      // OpenTelemetry SDK wird dynamisch geladen, falls verfügbar
      // Dies verhindert Fehler wenn die Pakete nicht installiert sind
      const { NodeSDK } = await import('@opentelemetry/sdk-node');
      const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
      
      const sdk = new NodeSDK({
        serviceName: this.configService?.get<string>('SERVICE_NAME') || process.env.SERVICE_NAME || 'wattos-service',
        instrumentations: [
          getNodeAutoInstrumentations({
            // Deaktiviere bestimmte Instrumentierungen falls nötig
            '@opentelemetry/instrumentation-fs': {
              enabled: false,
            },
          }),
        ],
        traceExporter: this.getTraceExporter(),
      });

      await sdk.start();
      this.initialized = true;
      this.logger.log('OpenTelemetry initialized successfully');
    } catch (error) {
      // OpenTelemetry-Pakete nicht installiert - das ist OK für MVP
      this.logger.warn('OpenTelemetry packages not installed. Install @opentelemetry/sdk-node and @opentelemetry/auto-instrumentations-node to enable.');
      this.logger.debug(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async onModuleDestroy() {
    if (this.initialized) {
      try {
        const { NodeSDK } = await import('@opentelemetry/sdk-node');
        // SDK wird automatisch beim Shutdown geschlossen
        this.logger.log('OpenTelemetry shutdown');
      } catch (error) {
        // Ignoriere Fehler beim Shutdown
      }
    }
  }

  private getTraceExporter() {
    const exporterType = this.configService?.get<string>('OTEL_EXPORTER_TYPE', 'console') || 'console';
    
    try {
      switch (exporterType) {
        case 'jaeger':
          const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
          return new JaegerExporter({
            endpoint: this.configService?.get<string>('OTEL_EXPORTER_JAEGER_ENDPOINT', 'http://localhost:14268/api/traces'),
          });
        
        case 'zipkin':
          const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
          return new ZipkinExporter({
            url: this.configService?.get<string>('OTEL_EXPORTER_ZIPKIN_ENDPOINT', 'http://localhost:9411/api/v2/spans'),
          });
        
        case 'otlp':
          const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');
          return new OTLPTraceExporter({
            url: this.configService?.get<string>('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318/v1/traces'),
          });
        
        case 'console':
        default:
          const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
          return new ConsoleSpanExporter();
      }
    } catch (error) {
      this.logger.warn(`Failed to initialize ${exporterType} exporter, falling back to console`);
      const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
      return new ConsoleSpanExporter();
    }
  }

  /**
   * Manuelles Erstellen eines Spans (falls OpenTelemetry aktiviert ist)
   */
  async createSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.initialized) {
      return fn();
    }

    try {
      const { trace } = await import('@opentelemetry/api');
      const tracer = trace.getTracer('wattos-tracer');
      return await tracer.startActiveSpan(name, async (span: any) => {
        try {
          const result = await fn();
          span.setStatus({ code: 1 }); // OK
          return result;
        } catch (error) {
          span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) }); // ERROR
          span.recordException(error instanceof Error ? error : new Error(String(error)));
          throw error;
        } finally {
          span.end();
        }
      });
    } catch (error) {
      // Fallback wenn OpenTelemetry nicht verfügbar ist
      return fn();
    }
  }
}

