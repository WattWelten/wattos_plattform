import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, BadRequestException, Logger, UseGuards } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { WidgetPosition, WidgetConfig } from '../common/interfaces/widget.interface';
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

@ApiTags('widgets')
@ApiBearerAuth()
@Controller('widgets')
@UseGuards(JwtAuthGuard, RbacGuard)
export class WidgetController {
  private readonly logger = new Logger(WidgetController.name);

  constructor(private readonly widgetService: WidgetService) {}

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

  @Post()
  @Roles(RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Create widget', description: 'Creates a new widget for the current tenant.' })
  @ApiBody({
    description: 'Widget creation data',
    schema: {
      type: 'object',
      required: ['type', 'name'],
      properties: {
        dashboardId: { type: 'string', description: 'Optional dashboard ID to associate widget with' },
        characterId: { type: 'string', description: 'Optional character ID to associate widget with' },
        type: { type: 'string', description: 'Widget type (e.g., "kpi", "analytics", "metrics")' },
        name: { type: 'string', description: 'Widget name' },
        config: { type: 'object', description: 'Widget configuration' },
        position: { type: 'object', description: 'Widget position on dashboard' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Widget created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createWidget(
    @Body() body: {
      dashboardId?: string;
      characterId?: string;
      type: string;
      name: string;
      config?: WidgetConfig;
      position?: WidgetPosition;
    },
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.widgetService.createWidget(tenantId, body);
  }

  @Get(':widgetId')
  @Roles(RoleType.VIEWER, RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Get widget', description: 'Retrieves a widget by ID for the current tenant.' })
  @ApiParam({ name: 'widgetId', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async getWidget(
    @Param('widgetId') widgetId: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.widgetService.getWidget(tenantId, widgetId);
  }

  @Put(':widgetId')
  @Roles(RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Update widget', description: 'Updates an existing widget for the current tenant.' })
  @ApiParam({ name: 'widgetId', description: 'Widget ID' })
  @ApiBody({
    description: 'Widget update data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Widget name' },
        config: { type: 'object', description: 'Widget configuration' },
        position: { type: 'object', description: 'Widget position on dashboard' },
        dashboardId: { type: 'string', description: 'Dashboard ID to associate widget with' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Widget updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async updateWidget(
    @Param('widgetId') widgetId: string,
    @Body() body: {
      name?: string;
      config?: WidgetConfig;
      position?: WidgetPosition;
      dashboardId?: string;
    },
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.widgetService.updateWidget(tenantId, widgetId, body);
  }

  @Delete(':widgetId')
  @Roles(RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete widget', description: 'Deletes a widget for the current tenant.' })
  @ApiParam({ name: 'widgetId', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Widget not found' })
  async deleteWidget(
    @Param('widgetId') widgetId: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.widgetService.deleteWidget(tenantId, widgetId);
  }

  @Get()
  @Roles(RoleType.VIEWER, RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'List widgets', description: 'Lists all widgets for the current tenant, optionally filtered by type or dashboard.' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by widget type' })
  @ApiQuery({ name: 'dashboardId', required: false, description: 'Filter by dashboard ID' })
  @ApiResponse({ status: 200, description: 'Widgets retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async listWidgets(
    @Query('type') type?: string,
    @Query('dashboardId') dashboardId?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.widgetService.listWidgets(tenantId, { type, dashboardId });
  }

  @Get('dashboard/:dashboardId')
  @Roles(RoleType.VIEWER, RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Get widgets by dashboard', description: 'Retrieves all widgets for a specific dashboard.' })
  @ApiParam({ name: 'dashboardId', description: 'Dashboard ID' })
  @ApiResponse({ status: 200, description: 'Widgets retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getWidgetsByDashboard(
    @Param('dashboardId') dashboardId: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.widgetService.getWidgetsByDashboard(tenantId, dashboardId);
  }

  @Get('character/:characterId')
  @Roles(RoleType.VIEWER, RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Get widgets by character', description: 'Retrieves all widgets for a specific character.' })
  @ApiParam({ name: 'characterId', description: 'Character ID' })
  @ApiResponse({ status: 200, description: 'Widgets retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getWidgetsByCharacter(
    @Param('characterId') characterId: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return await this.widgetService.getWidgetsByCharacter(tenantId, characterId);
  }
}

