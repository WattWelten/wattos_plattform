import { Controller } from '@nestjs/common';
import { HealthController as SharedHealthController, HealthService, MetricsService } from '@wattweiser/shared';

/**
 * Health Check Controller
 * Verwendet den standardisierten HealthController aus @wattweiser/shared
 */
@Controller('health')
export class HealthController extends SharedHealthController {
  constructor(
    healthService: HealthService,
    metricsService?: MetricsService,
  ) {
    super(healthService, metricsService);
  }
}
