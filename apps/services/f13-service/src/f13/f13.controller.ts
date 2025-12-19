import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { F13Service } from './f13.service';
import { KBSyncService } from './kb-sync.service';
import { F13RAGService } from './f13-rag.service';
import { F13ChatService } from './f13-chat.service';

@Controller('f13')
export class F13Controller {
  constructor(
    private readonly f13Service: F13Service,
    private readonly kbSyncService: KBSyncService,
    private readonly f13RAGService: F13RAGService,
    private readonly f13ChatService: F13ChatService,
  ) {}

  /**
   * F13-Konfiguration abrufen
   */
  @Get('config/:tenantId')
  async getConfig(@Param('tenantId') tenantId: string) {
    return this.f13Service.getF13Config(tenantId);
  }

  /**
   * F13-Konfiguration aktualisieren
   */
  @Put('config/:tenantId')
  async updateConfig(
    @Param('tenantId') tenantId: string,
    @Body() updates: {
      baseUrl?: string;
      apiKey?: string;
      kbSyncEnabled?: boolean;
      kbSyncInterval?: string;
      autoApprove?: boolean;
    },
  ) {
    await this.f13Service.updateF13Config(tenantId, updates);
    return { message: 'F13 config updated' };
  }

  /**
   * Health Check
   */
  @Get('health')
  async healthCheck(@Query('tenantId') tenantId?: string) {
    return this.f13Service.healthCheck(tenantId);
  }

  /**
   * KB-Artikel synchronisieren
   */
  @Post('kb/sync/:tenantId/:kbArticleId')
  @HttpCode(HttpStatus.OK)
  async syncKBArticle(
    @Param('tenantId') tenantId: string,
    @Param('kbArticleId') kbArticleId: string,
    @Body() options?: { autoApprove?: boolean },
  ) {
    return this.kbSyncService.syncKBArticleToF13(tenantId, kbArticleId, options);
  }

  /**
   * Incremental KB-Sync
   */
  @Post('kb/sync/incremental/:tenantId')
  @HttpCode(HttpStatus.OK)
  async syncIncremental(@Param('tenantId') tenantId: string) {
    return this.kbSyncService.syncIncremental(tenantId);
  }

  /**
   * RAG-Suche
   */
  @Post('rag/search')
  @HttpCode(HttpStatus.OK)
  async ragSearch(
    @Body() body: {
      query: string;
      context: {
        tenantId: string;
        knowledgeSpaceId?: string;
        topK?: number;
      };
    },
  ) {
    return this.f13RAGService.search(body.query, body.context);
  }

  /**
   * Chat Completion
   */
  @Post('chat/completions')
  @HttpCode(HttpStatus.OK)
  async chatCompletion(
    @Body() body: {
      messages: Array<{ role: string; content: string }>;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ) {
    return this.f13ChatService.chatCompletion(body.messages, {
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });
  }
}

