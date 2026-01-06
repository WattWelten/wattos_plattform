import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
import { HttpService } from '@nestjs/axios';
import { ServiceDiscoveryService } from '@wattweiser/shared';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { tenantConfigSchema } from '@wattweiser/config';
import { logEventSchema } from './dto/log-event.dto';

@Injectable()
export class MvpService {
  private readonly logger = new Logger(MvpService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  async getMetrics(tenantId: string) {
    // Calculate KPIs
    const conversations = await this.prismaService.client.conversation.findMany({
      where: { tenantId },
      include: {
        messages: true,
      },
    });

    const sessionsPerDay = conversations.length; // Simplified
    
    // Calculate FCR from feedback
    const feedbacks = await this.prismaService.client.feedback.findMany({
      where: {
        userId: {
          in: conversations.map((c: any) => c.userId).filter(Boolean),
        },
      },
    });
    const positiveFeedbacks = feedbacks.filter((f: any) => f.rating && f.rating >= 4).length;
    const fcr = feedbacks.length > 0 ? positiveFeedbacks / feedbacks.length : 0.75;
    
    const latencies = conversations
      .flatMap((c: any) => c.messages)
      .map((m: any) => m.latencyMs)
      .filter((l: number) => l != null) as number[];

    const p95Latency =
      latencies.length > 0
        ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
        : 0;

    const artifacts = await this.prismaService.client.artifact.findMany({
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
      const searchEvents = await this.prismaService.client.event.findMany({
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

    // Get LLM Cost Tracking metrics
    let costMetrics = {
      totalCost: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      usageCount: 0,
      byProvider: {} as Record<string, { cost: number; tokens: number; count: number }>,
      byModel: {} as Record<string, { cost: number; tokens: number; count: number }>,
    };

    try {
      const llmUsage = await this.prismaService.client.lLMUsage.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });

      costMetrics.totalCost = llmUsage.reduce((sum: number, u: any) => sum + Number(u.costUsd), 0);
      costMetrics.totalTokens = llmUsage.reduce((sum: number, u: any) => sum + u.totalTokens, 0);
      costMetrics.promptTokens = llmUsage.reduce((sum: number, u: any) => sum + u.promptTokens, 0);
      costMetrics.completionTokens = llmUsage.reduce((sum: number, u: any) => sum + u.completionTokens, 0);
      costMetrics.usageCount = llmUsage.length;

      // Group by provider
      llmUsage.forEach((u: any) => {
        const provider = u.provider;
        if (!costMetrics.byProvider[provider]) {
          costMetrics.byProvider[provider] = { cost: 0, tokens: 0, count: 0 };
        }
        costMetrics.byProvider[provider].cost += Number(u.costUsd);
        costMetrics.byProvider[provider].tokens += u.totalTokens;
        costMetrics.byProvider[provider].count += 1;
      });

      // Group by model
      llmUsage.forEach((u: any) => {
        const model = u.model;
        if (!costMetrics.byModel[model]) {
          costMetrics.byModel[model] = { cost: 0, tokens: 0, count: 0 };
        }
        costMetrics.byModel[model].cost += Number(u.costUsd);
        costMetrics.byModel[model].tokens += u.totalTokens;
        costMetrics.byModel[model].count += 1;
      });
    } catch (error: any) {
      this.logger.warn(`Failed to get cost metrics: ${error.message}`);
    }

    return {
      sessionsPerDay,
      fcr,
      p95Latency,
      contentFreshness,
      ragMetrics,
      costMetrics,
    };
  }

  async getConversations(
    tenantId: string,
    limit = 50,
    offset = 0,
  ) {
    const conversations = await this.prismaService.client.conversation.findMany({
      where: { tenantId },
      include: {
        messages: true,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get feedback for conversations
    const conversationIds = conversations.map((c: any) => c.id);
    const feedbacks = await this.prismaService.client.feedback.findMany({
      where: {
        userId: {
          in: conversations.map((c: any) => c.userId).filter(Boolean),
        },
        metadata: {
          path: ['conversationId'],
          in: conversationIds,
        },
      },
    });

    // Calculate scores from feedback
    const scoresByConversation = new Map<string, number>();
    feedbacks.forEach((f: any) => {
      const conversationId = (f.metadata as any)?.conversationId;
      if (conversationId && f.rating) {
        const currentScore = scoresByConversation.get(conversationId) || 0;
        scoresByConversation.set(conversationId, currentScore + f.rating);
      }
    });

    return conversations.map((c: any) => {
      const score = scoresByConversation.get(c.id);
      // Calculate average score if multiple feedbacks exist
      const feedbackCount = feedbacks.filter(
        (f: any) => (f.metadata as any)?.conversationId === c.id,
      ).length;
      const avgScore = score && feedbackCount > 0 ? score / feedbackCount : undefined;

      return {
        id: c.id,
        sessionId: c.sessionId || '',
        startedAt: c.startedAt.toISOString(),
        messageCount: c.messages.length,
        score: avgScore,
      };
    });
  }

  async getSources(tenantId: string) {
    return this.prismaService.client.source.findMany({
      where: { tenantId },
    });
  }

  async getCrawls(tenantId: string) {
    return this.prismaService.client.crawl.findMany({
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
      const source = await this.prismaService.client.source.findFirst({
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
    const crawl = await this.prismaService.client.crawl.create({
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
      await this.prismaService.client.crawl.update({
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
      await this.prismaService.client.crawl.update({
        where: { id: crawl.id },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  async getArtifacts(tenantId: string) {
    return this.prismaService.client.artifact.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteArtifact(id: string) {
    await this.prismaService.client.artifact.delete({
      where: { id },
    });
    return { success: true };
  }

  async getTenantConfig(tenantId: string) {
    const config = await this.prismaService.client.config.findUnique({
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

    await this.prismaService.client.config.upsert({
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

    const events = await this.prismaService.client.event.findMany({
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
    
    const event = await this.prismaService.client.event.create({
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

  /**
   * Conversation Messages abrufen
   */
  async getConversationMessages(conversationId: string, tenantId: string): Promise<Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
    latencyMs?: number;
    citations?: any;
  }>> {
    // Prüfe ob Conversation existiert und zu Tenant gehört
    const conversation = await this.prismaService.client.conversation.findFirst({
      where: {
        id: conversationId,
        tenantId,
      },
    });

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    // Lade Messages
    const messages = await this.prismaService.client.conversationMessage.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return messages.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.createdAt.toISOString(),
      latencyMs: m.latencyMs || undefined,
      citations: m.citations || undefined,
    }));
  }
}

