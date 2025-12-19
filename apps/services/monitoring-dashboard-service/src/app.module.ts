import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonitoringDashboardModule } from './monitoring-dashboard/monitoring-dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MonitoringDashboardModule,
  ],
})
export class AppModule {}

