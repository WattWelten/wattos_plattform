import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@wattweiser/db';
import { HttpService } from '@nestjs/axios';
import { ServiceDiscoveryService } from '@wattweiser/shared';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { tenantConfigSchema } from '@wattweiser/config';
import { logEventSchema } from './dto/log-event.dto';

@Injectable()
export class MvpService {
  private readonly logger = new Logger(MvpService.name);
  private readonly prisma: PrismaClient;

  constructor(
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {
    this.prisma = new PrismaClient();
  }

  async getMetrics(tenantId: string) {
    // Calculate KPIs
    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId },
      include: {
        messages: true,
      },
    });

    const sessionsPerDay = conversations.length; // Simplified
    const fcr = 0.75; // Placeholder - should calculate from feedback
    const latencies = conversations
      .flatMap((c: any) => c.messages)
      .map((m: any) => m.latencyMs)
      .filter((l: number) => l != null) as number[];

    const p95Latency =
      latencies.length > 0
        ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
        : 0;

    const artifacts = await this.prisma.artifact.findMany({
      where: { tenantId },
    });
    const contentFreshness =
      artifacts.length > 0
        ? Math.ceil(
            (Date.now() -
              new Date(
                artifacts.sort(
                  (a: any, b: any) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )[0].createdAt,
              ).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

    // Get RAG search metrics
    let ragMetrics = {
      totalSearches: 0,
      avgScore: 0,
      topQueries: [] as Array<{ query: string; count: number }>,
    };

    try {
      // Calculate from events (RAG-Service doesn't have metrics endpoint yet)
      const searchEvents = await this.prisma.event.findMany({
        where: {
          tenantId,
          type: 'search',
        },
        orderBy: { ts: 'desc' },
        take: 100,
      });

      ragMetrics.totalSearches = searchEvents.length;
      if (searchEvents.length > 0) {
        const scores = searchEvents
          .map((e: any) => (e.payloadJsonb as any)?.score)
          .filter((s: number) => s != null) as number[];
        ragMetrics.avgScore =
          scores.reduce((a: number, b: number) => a + b, 0) / scores.length || 0;

        // Count top queries
        const queryCounts = new Map<string, number>();
        searchEvents.forEach((e: any) => {
          const query = (e.payloadJsonb as any)?.query;
          if (query) {
            queryCounts.set(query, (queryCounts.get(query) || 0) + 1);
          }
        });
        ragMetrics.topQueries = Array.from(queryCounts.entries())
          .map(([query, count]) => ({ query, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }
    } catch (error: any) {
      this.logger.warn(`Failed to get RAG metrics: ${error.message}`);
    }

    return {
      sessionsPerDay,
      fcr,
      p95Latency,
      contentFreshness,
      ragMetrics,
    };
  }

  async getConversations(
    tenantId: string,
    limit = 50,
    offset = 0,
  ) {
    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId },
      include: {
        messages: true,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return conversations.map((c: any) => ({
      id: c.id,
      sessionId: c.sessionId || '',
      startedAt: c.startedAt.toISOString(),
      messageCount: c.messages.length,
      score: undefined, // TODO: Calculate from feedback
    }));
  }

  async getSources(tenantId: string) {
    return this.prisma.source.findMany({
      where: { tenantId },
    });
  }

  async getCrawls(tenantId: string) {
    return this.prisma.crawl.findMany({
      where: { tenantId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }

  async triggerCrawl(tenantId: string, url: string, schedule?: string) {
    // Get source URL if sourceId provided
    let crawlUrl = url;
    if (!url && schedule) {
      // If schedule provided but no URL, get from source config
      const source = await this.prisma.source.findFirst({
        where: { tenantId },
      });
      if (source) {
        crawlUrl = source.url;
      }
    }

    if (!crawlUrl) {
      throw new Error('URL is required for crawl');
    }

    // Create crawl record in DB
    const crawl = await this.prisma.crawl.create({
      data: {
        tenantId,
        url: crawlUrl,
        status: 'pending',
        schedule: schedule || null,
      },
    });

    try {
      // Call crawler-service via HTTP
      const crawlerUrl = this.serviceDiscovery.getServiceUrl('crawler-service', 3015);
      const response = await firstValueFrom(
        this.httpService.post<{ status?: string; id?: string }>(`${crawlerUrl}/api/v1/crawler/start`, {
          url: crawlUrl,
          tenantId,
          maxPages: 1500,
          maxDepth: 3,
        }),
      ) as { data: { status?: string; id?: string } };

      // Update crawl record with crawler-service response
      const responseData = response.data;
      await this.prisma.crawl.update({
        where: { id: crawl.id },
        data: {
          status: responseData.status || 'running',
          externalId: responseData.id,
        },
      });

      this.logger.log(`Crawl triggered: ${crawl.id} for ${crawlUrl}`);
      return crawl;
    } catch (error: any) {
      this.logger.error(`Failed to trigger crawl: ${error.message}`);
      // Update crawl status to failed
      await this.prisma.crawl.update({
        where: { id: crawl.id },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  async getArtifacts(tenantId: string) {
    return this.prisma.artifact.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteArtifact(id: string) {
    await this.prisma.artifact.delete({
      where: { id },
    });
    return { success: true };
  }

  async getTenantConfig(tenantId: string) {
    const config = await this.prisma.config.findUnique({
      where: { tenantId },
    });

    if (!config) {
      // Return default config
      return {
        tenant_id: tenantId,
        character: 'kaya',
        locales: ['de-DE'],
        sources: {
          allow_domains: [],
          patterns: [],
        },
        crawler: {
          schedule_cron: '0 5 * * *',
          delta_etag: true,
          max_pages: 1500,
        },
        retrieval: {
          two_stage: false,
          top_k: 6,
          filters: {},
        },
        skills: [],
        answer_policy: {
          style: 'kurz+schritt',
          show_sources: true,
          show_date: true,
          max_tokens: 450,
        },
        tts: {
          voice: 'de-DE-neutral',
          visemes: true,
          rate: 1.0,
          pitch: 0,
        },
        escalation: {},
      };
    }

    return config.jsonb as any;
  }

  async updateTenantConfig(tenantId: string, config: any) {
    // Validate config with Zod schema
    const validatedConfig = tenantConfigSchema.parse({
      ...config,
      tenant_id: tenantId,
    });

    await this.prisma.config.upsert({
      where: { tenantId },
      create: {
        tenantId,
        jsonb: validatedConfig,
      },
      update: {
        jsonb: validatedConfig,
      },
    });
    return { success: true };
  }

  async getEvents(
    tenantId: string,
    conversationId?: string,
    type?: string,
  ) {
    const where: any = { tenantId };
    if (conversationId) {
      where.conversationId = conversationId;
    }
    if (type) {
      where.type = type;
    }

    const events = await this.prisma.event.findMany({
      where,
      orderBy: { ts: 'asc' },
    });

    return events.map((e: any) => ({
      viseme: (e.payloadJsonb as any).viseme,
      timestamp: new Date(e.ts).getTime(),
    }));
  }

  async logEvent(tenantId: string, payload: unknown) {
    // Validierung mit Zod Schema (aus log-event.dto.ts)
    const validated = logEventSchema.parse(payload);
    
    const event = await this.prisma.event.create({
      data: {
        tenantId,
        conversationId: validated.conversation_id,
        sessionId: validated.session_id,
        type: validated.event?.type || 'kpi',
        payloadJsonb: validated.event || validated,
        metadata: validated.metadata || {},
      },
    });

    return { success: true, eventId: event.id };
  }

  streamConversations(tenantId: string): Observable<any> {
    return new Observable((subscriber) => {
      // Polling für neue Conversations (alle 2 Sekunden)
      const interval = setInterval(async () => {
        try {
          const conversations = await this.getConversations(tenantId, 10, 0);
          subscriber.next({
            type: 'conversations',
            data: conversations,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          subscriber.error(error);
        }
      }, 2000);

      // Cleanup bei Unsubscribe
      return () => {
        clearInterval(interval);
      };
    });
  }
}

