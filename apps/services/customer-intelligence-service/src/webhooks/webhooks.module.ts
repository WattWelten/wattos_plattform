import { Module } from '@nestjs/common';
import { PrismaModule } from '@wattweiser/db';
import { WebhooksController } from './webhooks.controller';
import { ContentEnrichmentModule } from '../content-enrichment/content-enrichment.module';
import { ContentEnrichmentService } from '../content-enrichment/content-enrichment.service';

@Module({
  imports: [PrismaModule, ContentEnrichmentModule],
  controllers: [WebhooksController],
  providers: [ContentEnrichmentService],
})
export class WebhooksModule {}

