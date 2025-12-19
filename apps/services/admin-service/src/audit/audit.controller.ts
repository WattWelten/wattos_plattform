import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.auditService.getAuditLogs(query);
  }

  @Get('logs/:logId')
  async getAuditLog(@Param('logId') logId: string) {
    return this.auditService.getAuditLog(logId);
  }

  @Get('stats')
  async getAuditStats(
    @Query('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getAuditStats(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}


