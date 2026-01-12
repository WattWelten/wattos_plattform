import { Controller, Get, Post, Body, Param, Query, Req, BadRequestException, Logger, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard, Roles, RoleType } from '../auth/guards/rbac.guard';

// Optional: Swagger Decorators (nur wenn @nestjs/swagger installiert ist)
let ApiTags: any, ApiOperation: any, ApiBearerAuth: any, ApiResponse: any, ApiQuery: any, ApiBody: any;
try {
  const swagger = require('@nestjs/swagger');
  ApiTags = swagger.ApiTags;
  ApiOperation = swagger.ApiOperation;
  ApiBearerAuth = swagger.ApiBearerAuth;
  ApiResponse = swagger.ApiResponse;
  ApiQuery = swagger.ApiQuery;
  ApiBody = swagger.ApiBody;
} catch {
  // @nestjs/swagger nicht installiert - Decorators werden ignoriert
  ApiTags = () => () => {};
  ApiOperation = () => () => {};
  ApiBearerAuth = () => () => {};
  ApiResponse = () => () => {};
  ApiQuery = () => () => {};
  ApiBody = () => () => {};
}

@ApiTags('reporting')
@ApiBearerAuth()
@Controller('reporting')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ReportingController {
  private readonly logger = new Logger(ReportingController.name);

  constructor(private readonly reportingService: ReportingService) {}

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
  @ApiOperation({ summary: 'Generate report', description: 'Generates a report for the current tenant. Report type and options can be specified as query parameters.' })
  @ApiQuery({ name: 'type', required: true, description: 'Report type (e.g., "kpi", "analytics", "usage")' })
  @ApiQuery({ name: 'options', required: false, description: 'JSON string with report options (e.g., time range, filters)' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid report type or options' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getReport(
    @Query('type') type: string,
    @Query('options') options?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    const parsedOptions = options ? JSON.parse(options) : {};
    return this.reportingService.generateReport(tenantId, type, parsedOptions);
  }

  @Post()
  @Roles(RoleType.VIEWER, RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Generate report (POST)', description: 'Generates a report for the current tenant using POST method. Allows more complex options in request body.' })
  @ApiBody({
    description: 'Report generation data',
    schema: {
      type: 'object',
      required: ['type'],
      properties: {
        type: { type: 'string', description: 'Report type (e.g., "kpi", "analytics", "usage")' },
        options: { type: 'object', description: 'Report options (e.g., time range, filters, format)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid report type or options' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async createReport(
    @Body() body: { type: string; options?: Record<string, any> },
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    return this.reportingService.generateReport(tenantId, body.type, body.options);
  }

  @Get('pdf')
  @Roles(RoleType.VIEWER, RoleType.EDITOR, RoleType.ADMIN)
  @ApiOperation({ summary: 'Generate PDF report', description: 'Generates a PDF report for the current tenant. PDF generation requires puppeteer or pdfkit.' })
  @ApiQuery({ name: 'type', required: true, description: 'Report type (e.g., "kpi", "analytics", "usage")' })
  @ApiQuery({ name: 'options', required: false, description: 'JSON string with report options (e.g., time range, filters)' })
  @ApiResponse({ status: 200, description: 'PDF report generated successfully', content: { 'application/pdf': {} } })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid report type or options' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 501, description: 'PDF generation not implemented - requires puppeteer or pdfkit' })
  async getPdfReport(
    @Query('type') type: string,
    @Query('options') options?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    const tenantId = this.getTenantIdFromRequest(req);
    const parsedOptions = options ? JSON.parse(options) : {};
    
    // Prüfe ob PDF-Generierung verfügbar ist
    try {
      const pdfBuffer = await this.reportingService.generatePdfReport(tenantId, type, parsedOptions);
      
      // Setze Response-Header für PDF
      req?.res?.setHeader('Content-Type', 'application/pdf');
      req?.res?.setHeader('Content-Disposition', `attachment; filename="report-${type}-${Date.now()}.pdf"`);
      
      return pdfBuffer;
    } catch (error) {
      this.logger.error(`PDF generation error: ${error}`);
      req?.res?.status(501);
      return {
        error: 'PDF generation not available',
        message: 'PDF generation requires puppeteer or pdfkit to be installed. Please install one of these packages.',
      };
    }
  }
}
