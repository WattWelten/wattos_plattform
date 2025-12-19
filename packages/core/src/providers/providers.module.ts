import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ProviderFactoryService } from './provider-factory.service';

/**
 * Providers Module
 * 
 * Provider-Factory für Tenant-basiertes Routing
 */
@Module({
  imports: [ProfilesModule, KnowledgeModule],
  providers: [ProviderFactoryService],
  exports: [ProviderFactoryService],
})
export class ProvidersModule {}

