import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class DataAggregationService {
  private readonly logger = new Logger(DataAggregationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  /**
   * Website-Daten vom Crawler-Service sammeln
   */
  async aggregateCrawlerData(tenantId: string): Promise<any[]> {
    try {
      const crawlerServiceUrl = this.serviceDiscovery.getServiceUrl('crawler-service', 3015);
      const response = await firstValueFrom(
        this.httpService.get(`${crawlerServiceUrl}/api/v1/crawler/data`, {
          headers: { 'X-Tenant-Id': tenantId },
        }),
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.warn(`Failed to aggregate crawler data: ${error.message}`);
      return [];
    }
  }

  /**
   * Dokumente über Admin-Service DB-API sammeln
   */
  async aggregateDocumentData(tenantId: string): Promise<any[]> {
    try {
      const adminServiceUrl = this.serviceDiscovery.getServiceUrl('admin-service', 3008);
      // Annahme: Admin-Service hat einen Endpunkt für Dokumente
      const response = await firstValueFrom(
        this.httpService.get(`${adminServiceUrl}/db/documents`, {
          headers: { 'X-Tenant-Id': tenantId },
        }),
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.warn(`Failed to aggregate document data: ${error.message}`);
      return [];
    }
  }

  /**
   * Chat-Historie über Chat-Service API sammeln
   */
  async aggregateConversationData(tenantId: string): Promise<any[]> {
    try {
      const chatServiceUrl = this.serviceDiscovery.getServiceUrl('chat-service', 3006);
      const response = await firstValueFrom(
        this.httpService.get(`${chatServiceUrl}/v1/conversations`, {
          headers: { 'X-Tenant-Id': tenantId },
          params: { tenantId },
        }),
      );
      return response.data || [];
    } catch (error: any) {
      this.logger.warn(`Failed to aggregate conversation data: ${error.message}`);
      return [];
    }
  }

  /**
   * Alle Datenquellen aggregieren
   */
  async aggregateAllData(tenantId: string, dataSources: string[] = ['crawler', 'documents', 'conversations']): Promise<{
    crawler: any[];
    documents: any[];
    conversations: any[];
  }> {
    const results = await Promise.allSettled([
      dataSources.includes('crawler') ? this.aggregateCrawlerData(tenantId) : Promise.resolve([]),
      dataSources.includes('documents') ? this.aggregateDocumentData(tenantId) : Promise.resolve([]),
      dataSources.includes('conversations') ? this.aggregateConversationData(tenantId) : Promise.resolve([]),
    ]);

    return {
      crawler: results[0].status === 'fulfilled' ? results[0].value : [],
      documents: results[1].status === 'fulfilled' ? results[1].value : [],
      conversations: results[2].status === 'fulfilled' ? results[2].value : [],
    };
  }
}





