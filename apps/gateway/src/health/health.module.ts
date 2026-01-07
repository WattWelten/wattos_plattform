import { Module } from '@nestjs/common';
import { HealthController } from '@wattweiser/shared';
import { ObservabilityModule } from '@wattweiser/shared';
import { PrismaModule } from '@wattweiser/db';

@Module({
  imports: [ObservabilityModule, PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
