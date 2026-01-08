import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@wattweiser/db';
import { ObservabilityModule as ObservabilityFeatureModule } from './observability/observability.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ObservabilityModule,
    ServiceDiscoveryModule,
    ObservabilityFeatureModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
