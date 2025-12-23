import { Controller, Get, Post, Put, Delete, Body, Param, Query, Sse, BadRequestException } from '@nestjs/common';
import { MvpService } from './mvp.service';
import { Tenant } from '../common/decorators/tenant.decorator';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { triggerCrawlSchema, TriggerCrawlDto } from './dto/trigger-crawl.dto';
import { logEventSchema } from './dto/log-event.dto';
import { tenantConfigSchema } from '@wattweiser/config';

@Controller('admin')
export class MvpController {
  constructor(private readonly mvpService: MvpService) {}

  @Get('metrics')
  async getMetrics(@Tenant() tenantId: string) {
    return this.mvpService.getMetrics(tenantId);
  }

  @Get('conversations')
  async getConversations(
    @Tenant() tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.mvpService.getConversations(tenantId, limit, offset);
  }

  @Get('sources')
  async getSources(@Tenant() tenantId: string) {
    return this.mvpService.getSources(tenantId);
  }

  @Get('crawls')
  async getCrawls(
    @Tenant() tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.mvpService.getCrawls(tenantId, status);
  }

  @Post('crawls/trigger')
  async triggerCrawl(
    @Tenant() tenantId: string,
    @Body() body: TriggerCrawlDto,
  ) {
    // Zod-Validierung
    const validated = triggerCrawlSchema.safeParse(body);
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Invalid crawl request',
        errors: validated.error.issues,
      });
    }
    return this.mvpService.triggerCrawl(tenantId, validated.data.url, validated.data.schedule);
  }

  @Get('artifacts')
  async getArtifacts(@Tenant() tenantId: string) {
    return this.mvpService.getArtifacts(tenantId);
  }

  @Delete('artifacts/:id')
  async deleteArtifact(
    @Tenant() _tenantId: string,
    @Param('id') id: string,
  ) {
    return this.mvpService.deleteArtifact(id);
  }

  @Get('tenants/:id/config')
  async getTenantConfig(@Param('id') id: string) {
    return this.mvpService.getTenantConfig(id);
  }

  @Put('tenants/:id/config')
  async updateTenantConfig(
    @Param('id') id: string,
    @Body() config: unknown,
  ) {
    // Zod-Validierung mit tenantConfigSchema
    const configObj = config && typeof config === 'object' ? config as Record<string, unknown> : {};
    const validated = tenantConfigSchema.safeParse({ tenant_id: id, ...configObj });
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Invalid tenant config',
        errors: validated.error.issues,
      });
    }
    return this.mvpService.updateTenantConfig(id, validated.data);
  }

  @Get('events')
  async getEvents(
    @Tenant() tenantId: string,
    @Query('conversationId') conversationId?: string,
    @Query('type') type?: string,
  ) {
    return this.mvpService.getEvents(tenantId, conversationId, type);
  }

  @Post('log')
  async logEvent(
    @Tenant() tenantId: string,
    @Body() payload: unknown,
  ) {
    // Zod-Validierung
    const validated = logEventSchema.safeParse(payload);
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Invalid event payload',
        errors: validated.error.issues,
      });
    }
    return this.mvpService.logEvent(tenantId, validated.data);
  }

  @Sse('conversations/stream')
  streamConversations(@Tenant() tenantId: string): Observable<any> {
    return this.mvpService.streamConversations(tenantId).pipe(
      map((data) => ({
        data: JSON.stringify(data),
      })),
    );
  }
}
