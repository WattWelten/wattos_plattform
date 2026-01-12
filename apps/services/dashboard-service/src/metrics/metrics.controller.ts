import { Controller, Get, Param, Query, Req, BadRequestException, Logger, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard, Roles, RoleType } from '../auth/guards/rbac.guard';

// Optional: Swagger Decorators (nur wenn @nestjs/swagger installiert ist)
let ApiTags: any, ApiOperation: any, ApiBearerAuth: any, ApiResponse: any, ApiQuery: any;
try {
  const swagger = require('@nestjs/swagger');
  ApiTags = swagger.ApiTags;
  ApiOperation = swagger.ApiOperation;
  ApiBearerAuth = swagger.ApiBearerAuth;
  ApiResponse = swagger.ApiResponse;
  ApiQuery = swagger.ApiQuery;
} catch {
  // @nestjs/swagger nicht installiert - Decorators werden ignoriert
  ApiTags = () => () => {};
  ApiOperation = () => () => {};
  ApiBearerAuth = () => () => {};
  ApiResponse = () => () => {};
  ApiQuery = () => () => {};
}

@ApiTags('metrics')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(private readonly metricsService: MetricsService) {}

  /**
   * Extrahiere Tenant-ID aus Request-Context (nicht aus URL-Param)
   * Dies verhindert Cross-Tenant Data Access
   */
  private getTenantIdFromRequest(req?: AuthenticatedRequest): string {
    if (!req) {
      throw new BadRequestException('Request context required');
    }

    // 1. Prüfe req.tenantId (von TenantMiddleware gesetzt)
    const tenantId = req?.tenantId;
    if (tenantId) {
      return tenantId;
    }

    // 2. Fallback: Prüfe user.tenantId (von AuthMiddleware gesetzt)
    const userTenantId = req?.user?.tenantId;
    if (userTenantId) {
      return userTenantId;
    }

    // 3. Fallback: Prüfe X-Tenant-Id Header (für direkte API-Calls)
    const headerTenantId = req.header('x-tenant-id');
    if (headerTenantId) {
      return headerTenantId;
    }

    this.logger.error('No tenant ID found in request context');
    throw new BadRequestException('Tenant context required. Please provide X-Tenant-Id header or ensure TenantMiddleware is configured.');
  }

  @Get()
  @Roles(RoleType.VIEWER, RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Get metrics', description: 'Retrieves metrics for the current tenant. Supports filtering by metric types and time range.' })
  @ApiQuery({ name: 'types', required: false, description: 'Comma-separated list of metric types to retrieve (e.g., "queries,answers,latency")' })
  @ApiQuery({ name: 'timeRange', required: false, description: 'Time range for metrics (e.g., "1h", "24h", "7d")', default: '1h' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getMetrics(
    @Query('types') types?: string,
    @Query('timeRange') timeRange?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    const typesArray = types ? types.split(',') : undefined;
    return await this.metricsService.getMetrics(tenantId, {
      ...(typesArray && { types: typesArray }),
      timeRange: timeRange || '1h',
    });
  }
}

