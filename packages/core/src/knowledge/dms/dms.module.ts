import { Module } from '@nestjs/common';
import { EventsModule } from '../../events/events.module';
import { KnowledgeModule } from '../knowledge.module';
import { DMSIntegrationService } from './dms-integration.service';

/**
 * DMS Module
 * 
 * DMS-Integration mit Knowledge Layer
 */
@Module({
  imports: [EventsModule, KnowledgeModule],
  providers: [DMSIntegrationService],
  exports: [DMSIntegrationService],
})
export class DMSModule {}

