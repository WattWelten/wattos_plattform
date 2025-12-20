import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KnowledgeEnhancementController } from './knowledge-enhancement.controller';
import { KnowledgeEnhancementService } from './knowledge-enhancement.service';
import { PublicSourceCrawlerService } from './public-source-crawler.service';
import { DataValidatorService } from './data-validator.service';
import { DataEnrichmentService } from './data-enrichment.service';
import { MetadataExtractionService } from './metadata-extraction.service';
@Module({
  imports: [HttpModule],
  controllers: [KnowledgeEnhancementController],
  providers: [
    KnowledgeEnhancementService,
    PublicSourceCrawlerService,
    DataValidatorService,
    DataEnrichmentService,
    MetadataExtractionService,
  ],
  exports: [
    KnowledgeEnhancementService,
    PublicSourceCrawlerService,
    DataValidatorService,
    DataEnrichmentService,
    MetadataExtractionService,
  ],
})
export class KnowledgeEnhancementModule {}
