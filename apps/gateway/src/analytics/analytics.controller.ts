import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get analytics overview' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d', '90d'], required: false, default: '7d' })
  async getAnalytics(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;

    const [stats, usageData, providerData, costDistribution, feedbackStats] = await Promise.all([
      this.analyticsService.getStats(timeRange, tenantId),
      this.analyticsService.getUsageData(timeRange, tenantId),
      this.analyticsService.getProviderData(timeRange, tenantId),
      this.analyticsService.getCostDistribution(timeRange, tenantId),
      this.analyticsService.getFeedbackStats(timeRange, tenantId),
    ]);

    return {
      stats,
      usageData,
      providerData,
      costDistribution,
      feedbackStats,
      costData: usageData.map((d) => ({ date: d.date, cost: d.cost })),
      performanceData: usageData.map((d) => ({ date: d.date, latency: d.latency, errors: d.errors })),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get analytics stats' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d', '90d'], required: false, default: '7d' })
  async getStats(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getStats(timeRange, tenantId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage data over time' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d', '90d'], required: false, default: '7d' })
  async getUsageData(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getUsageData(timeRange, tenantId);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get provider distribution' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d', '90d'], required: false, default: '7d' })
  async getProviderData(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getProviderData(timeRange, tenantId);
  }

  @Get('costs')
  @ApiOperation({ summary: 'Get cost distribution' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d', '90d'], required: false, default: '7d' })
  async getCostDistribution(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getCostDistribution(timeRange, tenantId);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'Get feedback statistics' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d', '90d'], required: false, default: '7d' })
  async getFeedbackStats(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getFeedbackStats(timeRange, tenantId);
  }
}
