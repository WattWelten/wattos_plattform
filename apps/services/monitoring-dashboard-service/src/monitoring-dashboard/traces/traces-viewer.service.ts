import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Traces Viewer Service
 * 
 * Trace-Viewer-Funktionalität für Dashboard
 */
@Injectable()
export class TracesViewerService {
  private readonly logger = new Logger(TracesViewerService.name);
  private readonly observabilityServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.observabilityServiceUrl =
      this.configService.get<string>('OBSERVABILITY_SERVICE_URL') ||
      'http://localhost:3020';
  }

  /**
   * Trace-Informationen abrufen
   */
  async getTraceInfo(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.observabilityServiceUrl}/api/v1/traces/info`),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch trace info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        enabled: false,
        tracer: 'OpenTelemetry',
        exporter: undefined,
      };
    }
  }

  /**
   * Trace-Liste abrufen (Placeholder - in Production: aus Jaeger/Trace-Backend)
   */
  async getTraces(
    tenantId?: string,
    service?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<any[]> {
    // MVP: Placeholder
    // In Production: Traces aus Jaeger/Trace-Backend abrufen
    this.logger.debug('Trace retrieval not yet fully implemented');
    return [];
  }
}

