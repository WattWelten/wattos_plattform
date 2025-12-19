import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Alerts Management Service
 * 
 * Alert-Management-Funktionalität für Dashboard
 */
@Injectable()
export class AlertsManagementService {
  private readonly logger = new Logger(AlertsManagementService.name);
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
   * Alerts abrufen
   */
  async getAlerts(
    tenantId?: string,
    status?: string,
    severity?: string,
    service?: string,
    limit: number = 100,
  ): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.observabilityServiceUrl}/api/v1/alerts`, {
          params: {
            ...(tenantId && { tenantId }),
            ...(status && { status }),
            ...(severity && { severity }),
            ...(service && { service }),
            limit,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Alert-Regeln abrufen
   */
  async getAlertRules(tenantId?: string, enabled?: boolean): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.observabilityServiceUrl}/api/v1/alerts/rules`, {
          params: {
            ...(tenantId && { tenantId }),
            ...(enabled !== undefined && { enabled: enabled.toString() }),
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to fetch alert rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Alert bestätigen
   */
  async acknowledgeAlert(alertId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.observabilityServiceUrl}/api/v1/alerts/${alertId}/acknowledge`,
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to acknowledge alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Alert auflösen
   */
  async resolveAlert(alertId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.observabilityServiceUrl}/api/v1/alerts/${alertId}/resolve`,
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to resolve alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

