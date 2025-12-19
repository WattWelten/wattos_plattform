import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MetricsDashboardController } from './metrics/metrics-dashboard.controller';
import { MetricsDashboardService } from './metrics/metrics-dashboard.service';
import { LogsViewerController } from './logs/logs-viewer.controller';
import { LogsViewerService } from './logs/logs-viewer.service';
import { TracesViewerController } from './traces/traces-viewer.controller';
import { TracesViewerService } from './traces/traces-viewer.service';
import { AlertsManagementController } from './alerts/alerts-management.controller';
import { AlertsManagementService } from './alerts/alerts-management.service';
import { RealtimeGateway } from './realtime/realtime.gateway';

@Module({
  imports: [HttpModule],
  controllers: [
    MetricsDashboardController,
    LogsViewerController,
    TracesViewerController,
    AlertsManagementController,
  ],
  providers: [
    MetricsDashboardService,
    LogsViewerService,
    TracesViewerService,
    AlertsManagementService,
    RealtimeGateway,
  ],
  exports: [
    MetricsDashboardService,
    LogsViewerService,
    TracesViewerService,
    AlertsManagementService,
  ],
})
export class MonitoringDashboardModule {}

