import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from '@wattweiser/shared';
import { PrismaService } from '@wattweiser/db';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe - checks if service is running' })
  async liveness() {
    return {
      ok: true,
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe - checks if service is ready to accept traffic' })
  async readiness() {
    const checks: Record<string, { status: string; message?: string }> = {};

    // Database check
    try {
      await (this.prisma.client as any).$queryRaw`SELECT 1`;
      checks.database = { status: 'up' };
    } catch (error) {
      checks.database = {
        status: 'down',
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }

    // Redis check (try-catch to avoid blocking)
    try {
      const healthCheck = await this.healthService.checkHealth();
      checks.redis = healthCheck.checks.redis || { status: 'unknown' };
    } catch (error) {
      checks.redis = {
        status: 'unknown',
        message: error instanceof Error ? error.message : 'Redis check failed',
      };
    }

    const allUp = Object.values(checks).every((check) => check.status === 'up');

    return {
      ok: allUp,
      status: allUp ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Full health check - checks all dependencies' })
  async health() {
    try {
      return await this.healthService.checkHealth();
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
        checks: {},
      };
    }
  }
}
