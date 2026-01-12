import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { AnalyticsService } from './analytics.service';
import { KpiService, KpiRange } from './kpi.service';
import { KpiMetricsService } from './kpi-metrics.service';
import { KpiAlertsService } from './kpi-alerts.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard, Roles, RoleType } from '../auth/guards/rbac.guard';

// Optional: Swagger Decorators (nur wenn @nestjs/swagger installiert ist)
let ApiTags: any, ApiOperation: any, ApiBearerAuth: any, ApiResponse: any;
try {
  const swagger = require('@nestjs/swagger');
  ApiTags = swagger.ApiTags;
  ApiOperation = swagger.ApiOperation;
  ApiBearerAuth = swagger.ApiBearerAuth;
  ApiResponse = swagger.ApiResponse;
} catch {
  // @nestjs/swagger nicht installiert - Decorators werden ignoriert
  ApiTags = () => () => {};
  ApiOperation = () => () => {};
  ApiBearerAuth = () => () => {};
  ApiResponse = () => () => {};
}

// Throttle Decorator (wird bereits in main.ts verwendet)
import { Throttle } from '@nestjs/throttler';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly kpiService: KpiService,
    private readonly kpiMetricsService: KpiMetricsService,
    private readonly kpiAlertsService: KpiAlertsService,
    private readonly trendAnalysisService: TrendAnalysisService,
  ) {}

  @Get()
  @Roles(RoleType.ADMIN, RoleType.EDITOR, RoleType.VIEWER)
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getAnalytics(
    @Query('timeRange') timeRange?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    this.logger.debug(`Getting analytics for tenant: ${tenantId}, range: ${timeRange || '7d'}`);

    return await this.analyticsService.getAnalytics(tenantId, {
      timeRange: timeRange || '7d',
    });
  }

  /**
   * KPI-Endpoint für Multi-Tenant Analytics
   * GET /analytics/kpi?range=7d
   * 
   * Tenant-ID wird aus Request-Context extrahiert (nicht aus URL-Param)
   * für bessere Security (verhindert Cross-Tenant Data Access)
   */
  @Get('kpi')
  @Roles(RoleType.ADMIN, RoleType.EDITOR, RoleType.VIEWER)
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 requests per minute (KPI-Queries sind aufwendiger)
  @ApiOperation({ summary: 'Get KPIs for current tenant' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid range parameter' })
  async getKpis(
    @Query('range') range?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    this.logger.debug(`Getting KPIs for tenant: ${tenantId}, range: ${range || '7d'}`);

    // Validiere und konvertiere range
    const kpiRange: KpiRange = this.validateAndConvertRange(range);

    try {
      const kpis = await this.kpiService.getKpis(tenantId, kpiRange);

      this.logger.log(`KPIs retrieved for tenant: ${tenantId}, range: ${kpiRange}`);

      return {
        tenantId,
        range: kpiRange,
        ...kpis,
      };
    } catch (error) {
      this.logger.error(`Failed to get KPIs for tenant ${tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Get('kpi/metrics')
  @Roles(RoleType.ADMIN, RoleType.EDITOR)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute (Metrics sind aufwendiger)
  @ApiOperation({ summary: 'Get KPI metrics export for current tenant' })
  @ApiResponse({ status: 200, description: 'KPI metrics retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getKpiMetrics(
    @Query('range') range?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    this.logger.debug(`Getting KPI metrics for tenant: ${tenantId}, range: ${range || '7d'}`);

    const kpiRange: KpiRange = this.validateAndConvertRange(range);

    try {
      const metrics = await this.kpiMetricsService.exportKpiMetrics(tenantId, kpiRange);
      this.logger.log(`KPI metrics retrieved for tenant: ${tenantId}, range: ${kpiRange}`);
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get KPI metrics for tenant ${tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  @Get('kpi/alerts')
  @Roles(RoleType.ADMIN, RoleType.EDITOR)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({ summary: 'Get KPI alerts for current tenant' })
  @ApiResponse({ status: 200, description: 'KPI alerts retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getKpiAlerts(@Req() req?: AuthenticatedRequest) {
    const tenantId = this.getTenantIdFromRequest(req);
    this.logger.debug(`Getting KPI alerts for tenant: ${tenantId}`);

    try {
      const alerts = await this.kpiAlertsService.checkTenantAlerts(tenantId);
      this.logger.log(`KPI alerts retrieved for tenant: ${tenantId}`);
      return alerts;
    } catch (error) {
      this.logger.error(`Failed to get KPI alerts for tenant ${tenantId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

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

  /**
   * Validiere und konvertiere range Parameter
   */
  private validateAndConvertRange(range?: string): KpiRange {
    if (!range) {
      return '7d';
    }

    const validRanges: KpiRange[] = ['today', '7d', '30d'];
    if (validRanges.includes(range as KpiRange)) {
      return range as KpiRange;
    }

    throw new BadRequestException(`Invalid range parameter: ${range}. Must be one of: today, 7d, 30d`);
  }

  @Get('trends')
  @Roles(RoleType.ADMIN, RoleType.EDITOR, RoleType.VIEWER)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({ summary: 'Get trend analysis', description: 'Analyzes trends by comparing current KPIs with previous period' })
  @ApiQuery({ name: 'range', required: false, description: 'Current time range (today, 7d, 30d)' })
  @ApiQuery({ name: 'compareRange', required: false, description: 'Comparison time range (optional, auto-determined if not provided)' })
  @ApiResponse({ status: 200, description: 'Trend analysis retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getTrends(
    @Query('range') range?: KpiRange,
    @Query('compareRange') compareRange?: KpiRange,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.trendAnalysisService.analyzeTrends(tenantId, range || '7d', compareRange);
  }

  @Get('trends/timeseries')
  @Roles(RoleType.ADMIN, RoleType.EDITOR, RoleType.VIEWER)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({ summary: 'Get time series data', description: 'Returns historical time series data for a specific metric' })
  @ApiQuery({ name: 'metric', required: true, description: 'Metric name (answered, selfServiceRate, csat, etc.)' })
  @ApiQuery({ name: 'range', required: false, description: 'Time range (today, 7d, 30d)' })
  @ApiQuery({ name: 'granularity', required: false, description: 'Data granularity (day, week)' })
  @ApiResponse({ status: 200, description: 'Time series data retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getTimeSeries(
    @Query('metric') metric: string,
    @Query('range') range?: KpiRange,
    @Query('granularity') granularity?: 'day' | 'week',
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.trendAnalysisService.getTimeSeries(
      tenantId,
      metric as any,
      range || '30d',
      granularity || 'day',
    );
  }
}

