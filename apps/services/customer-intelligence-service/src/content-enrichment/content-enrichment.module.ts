import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@wattweiser/db';
import { ContentEnrichmentController } from './content-enrichment.controller';
import { ContentEnrichmentService } from './content-enrichment.service';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [ContentEnrichmentController],
  providers: [ContentEnrichmentService],
  exports: [ContentEnrichmentService],
})
export class ContentEnrichmentModule {}

