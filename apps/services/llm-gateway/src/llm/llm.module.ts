import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { ProviderFactory } from './services/provider-factory';
import { CostTrackingService } from './services/cost-tracking.service';
import { ProviderHealthService } from './services/provider-health.service';
import { ResilienceModule, ObservabilityModule } from '@wattweiser/shared';

@Module({
  imports: [HttpModule, ResilienceModule, ObservabilityModule],
  controllers: [LlmController],
  providers: [LlmService, ProviderFactory, CostTrackingService, ProviderHealthService],
})
export class LlmModule {}
