import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@wattweiser/db';
import { MonitoringDashboardModule } from './monitoring-dashboard/monitoring-dashboard.module';
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
    MonitoringDashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
