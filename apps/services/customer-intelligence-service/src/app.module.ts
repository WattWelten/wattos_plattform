import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { AnalysisModule } from './analysis/analysis.module';
import { PersonasModule } from './personas/personas.module';
import { AgentGenerationModule } from './agent-generation/agent-generation.module';
import { ContentEnrichmentModule } from './content-enrichment/content-enrichment.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { ServiceDiscoveryModule } from '@wattweiser/shared';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    HttpModule,
    ServiceDiscoveryModule,
    AnalysisModule,
    PersonasModule,
    AgentGenerationModule,
    ContentEnrichmentModule,
    WebhooksModule,
    HealthModule,
  ],
})
export class AppModule {}

