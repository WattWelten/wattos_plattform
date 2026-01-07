/**
 * Type declarations for optional OpenTelemetry packages
 * Diese Pakete sind optional und müssen nur installiert werden, wenn OpenTelemetry aktiviert wird
 */
declare module '@opentelemetry/sdk-node' {
  export class NodeSDK {
    constructor(options: any);
    start(): Promise<void>;
    shutdown(): Promise<void>;
  }
}

declare module '@opentelemetry/auto-instrumentations-node' {
  export function getNodeAutoInstrumentations(options?: any): any[];
}

declare module '@opentelemetry/api' {
  export namespace trace {
    export function getTracer(name: string): {
      startActiveSpan<T>(name: string, fn: (span: any) => Promise<T>): Promise<T>;
    };
  }
}

declare module '@opentelemetry/exporter-jaeger' {
  export class JaegerExporter {
    constructor(options: any);
  }
}

declare module '@opentelemetry/exporter-zipkin' {
  export class ZipkinExporter {
    constructor(options: any);
  }
}

declare module '@opentelemetry/exporter-otlp-http' {
  export class OTLPTraceExporter {
    constructor(options: any);
  }
}

declare module '@opentelemetry/sdk-trace-base' {
  export class ConsoleSpanExporter {
    constructor();
  }
}










