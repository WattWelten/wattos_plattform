import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import * as opentelemetry from '@opentelemetry/api';

/**
 * Traces Service
 * 
 * Distributed Tracing mit OpenTelemetry
 */
@Injectable()
export class TracesService implements OnModuleInit {
  private readonly logger = new Logger(TracesService.name);
  private readonly sdk: NodeSDK | null = null;
  private readonly tracer: opentelemetry.Tracer;

  constructor(private readonly configService: ConfigService) {
    const jaegerEnabled = this.configService.get<boolean>('JAEGER_ENABLED', false);
    const jaegerEndpoint = this.configService.get<string>('JAEGER_ENDPOINT', 'http://localhost:14268/api/traces');

    if (jaegerEnabled) {
      try {
        this.sdk = new NodeSDK({
          resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: 'wattos-observability',
            [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
          }),
          traceExporter: new JaegerExporter({
            endpoint: jaegerEndpoint,
          }),
          instrumentations: [getNodeAutoInstrumentations()],
        });

        this.logger.log(`OpenTelemetry initialized with Jaeger: ${jaegerEndpoint}`);
      } catch (error) {
        this.logger.warn(`Failed to initialize OpenTelemetry: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      this.logger.log('OpenTelemetry disabled (JAEGER_ENABLED=false)');
    }

    this.tracer = opentelemetry.trace.getTracer('wattos-observability');
  }

  onModuleInit() {
    if (this.sdk) {
      this.sdk.start();
      this.logger.log('OpenTelemetry SDK started');
    }
  }

  /**
   * Span erstellen
   */
  createSpan(name: string, attributes?: Record<string, string | number>): opentelemetry.Span {
    const span = this.tracer.startSpan(name, {
      attributes,
    });

    return span;
  }

  /**
   * Span mit Callback ausführen
   */
  async executeWithSpan<T>(
    name: string,
    fn: (span: opentelemetry.Span) => Promise<T>,
    attributes?: Record<string, string | number>,
  ): Promise<T> {
    const span = this.createSpan(name, attributes);

    try {
      const result = await fn(span);
      span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: opentelemetry.SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Trace-Informationen abrufen
   */
  getTraceInfo(): {
    enabled: boolean;
    tracer: string;
    exporter?: string;
  } {
    return {
      enabled: this.sdk !== null,
      tracer: 'OpenTelemetry',
      exporter: this.sdk ? 'Jaeger' : undefined,
    };
  }
}


