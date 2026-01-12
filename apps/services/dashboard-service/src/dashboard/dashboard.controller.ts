import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, BadRequestException, Logger, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { DashboardLayout } from '../common/interfaces/dashboard.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard, Roles, RoleType } from '../auth/guards/rbac.guard';

// Optional: Swagger Decorators (nur wenn @nestjs/swagger installiert ist)
let ApiTags: any, ApiOperation: any, ApiBearerAuth: any, ApiResponse: any, ApiQuery: any, ApiParam: any, ApiBody: any;
try {
  const swagger = require('@nestjs/swagger');
  ApiTags = swagger.ApiTags;
  ApiOperation = swagger.ApiOperation;
  ApiBearerAuth = swagger.ApiBearerAuth;
  ApiResponse = swagger.ApiResponse;
  ApiQuery = swagger.ApiQuery;
  ApiParam = swagger.ApiParam;
  ApiBody = swagger.ApiBody;
} catch {
  // @nestjs/swagger nicht installiert - Decorators werden ignoriert
  ApiTags = () => () => {};
  ApiOperation = () => () => {};
  ApiBearerAuth = () => () => {};
  ApiResponse = () => () => {};
  ApiQuery = () => () => {};
  ApiParam = () => () => {};
  ApiBody = () => () => {};
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

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
  @ApiOperation({ summary: 'Get dashboard', description: 'Retrieves a dashboard for the current tenant. If dashboardId is not provided, returns the default dashboard.' })
  @ApiQuery({ name: 'dashboardId', required: false, description: 'Optional dashboard ID. If not provided, returns the default dashboard.' })
  @ApiResponse({ status: 200, description: 'Dashboard retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Tenant context required' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getDashboard(
    @Query('dashboardId') dashboardId?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.dashboardService.getDashboard(tenantId, dashboardId);
  }

  @Post()
  @Roles(RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create dashboard', description: 'Creates a new dashboard for the current tenant.' })
  @ApiBody({
    description: 'Dashboard creation data',
    schema: {
      type: 'object',
      required: ['name', 'layout'],
      properties: {
        name: { type: 'string', description: 'Dashboard name' },
        layout: { type: 'object', description: 'Dashboard layout configuration' },
        isDefault: { type: 'boolean', description: 'Whether this should be the default dashboard', default: false },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Dashboard created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createDashboard(
    @Body() body: { name: string; layout: DashboardLayout; isDefault?: boolean },
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.dashboardService.createDashboard(
      tenantId,
      body.name,
      body.layout,
      body.isDefault || false,
    );
  }

  @Put(':dashboardId')
  @Roles(RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update dashboard', description: 'Updates an existing dashboard for the current tenant.' })
  @ApiParam({ name: 'dashboardId', description: 'Dashboard ID' })
  @ApiBody({
    description: 'Dashboard update data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Dashboard name' },
        layout: { type: 'object', description: 'Dashboard layout configuration' },
        isDefault: { type: 'boolean', description: 'Whether this should be the default dashboard' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Dashboard updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async updateDashboard(
    @Param('dashboardId') dashboardId: string,
    @Body() body: { name?: string; layout?: DashboardLayout; isDefault?: boolean },
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.dashboardService.updateDashboard(tenantId, dashboardId, body);
  }

  @Delete(':dashboardId')
  @Roles(RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete dashboard', description: 'Deletes a dashboard for the current tenant.' })
  @ApiParam({ name: 'dashboardId', description: 'Dashboard ID' })
  @ApiResponse({ status: 200, description: 'Dashboard deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async deleteDashboard(
    @Param('dashboardId') dashboardId: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.dashboardService.deleteDashboard(tenantId, dashboardId);
  }
}

