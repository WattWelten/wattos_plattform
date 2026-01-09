import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get analytics overview' })
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
  async getStats(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getStats(timeRange, tenantId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage data over time' })
  async getUsageData(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getUsageData(timeRange, tenantId);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get provider distribution' })
  async getProviderData(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getProviderData(timeRange, tenantId);
  }

  @Get('costs')
  @ApiOperation({ summary: 'Get cost distribution' })
  async getCostDistribution(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getCostDistribution(timeRange, tenantId);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'Get feedback statistics' })
  async getFeedbackStats(@Query('timeRange') timeRange: string = '7d', @Req() req: Request) {
    const tenantId = (req as any).user?.tenantId;
    return this.analyticsService.getFeedbackStats(timeRange, tenantId);
  }
}
