import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/create-analysis.dto';

@Controller('api/v1/analytics')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('analyze')
  async createAnalysis(@Req() req: Request, @Body() dto: CreateAnalysisDto) {
    const tenantId = (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
    if (!tenantId) {
      throw new Error('Tenant ID not found');
    }
    return this.analysisService.createAnalysis(tenantId, dto);
  }

  @Get(':id')
  async getAnalysis(@Param('id') id: string) {
    return this.analysisService.getAnalysis(id);
  }

  @Get(':id/report')
  async getAnalysisReport(@Param('id') id: string) {
    return this.analysisService.getAnalysisReport(id);
  }
}














