import { Module } from '@nestjs/common';
import { ObservabilityModule } from '@wattweiser/shared';
import { HealthController } from './health.controller';

@Module({
  imports: [ObservabilityModule],
  controllers: [HealthController],
})
export class HealthModule {}














