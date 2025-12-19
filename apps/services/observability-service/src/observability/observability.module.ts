import { Module } from '@nestjs/common';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsService } from './metrics/metrics.service';
import { LogsController } from './logs/logs.controller';
import { LogsService } from './logs/logs.service';
import { TracesController } from './traces/traces.controller';
import { TracesService } from './traces/traces.service';
import { AlertsController } from './alerts/alerts.controller';
import { AlertsService } from './alerts/alerts.service';
import { AlertRuleService } from './alerts/alert-rule.service';

@Module({
  controllers: [
    MetricsController,
    LogsController,
    TracesController,
    AlertsController,
  ],
  providers: [
    MetricsService,
    LogsService,
    TracesService,
    AlertsService,
    AlertRuleService,
  ],
  exports: [
    MetricsService,
    LogsService,
    TracesService,
    AlertsService,
  ],
})
export class ObservabilityModule {}


