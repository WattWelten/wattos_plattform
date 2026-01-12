import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('liveness')
  liveness() {
    return { status: 'ok', service: 'video-service' };
  }

  @Get('readiness')
  readiness() {
    return { status: 'ok', service: 'video-service' };
  }
}
