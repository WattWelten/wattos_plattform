import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagService, FeatureFlag } from '@wattweiser/shared';
import { JwtAuthGuard } from '@nestjs/passport';

@Controller('feature-flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Get()
  async getAllFlags(): Promise<FeatureFlag[]> {
    return this.featureFlagService.getAllFlags();
  }

  @Get(':key')
  async getFlag(@Param('key') key: string): Promise<FeatureFlag | null> {
    return this.featureFlagService.getFlag(key);
  }

  @Get(':key/check')
  async checkFlag(
    @Param('key') key: string,
    @Query('userId') userId?: string,
  ): Promise<{ enabled: boolean }> {
    const enabled = await this.featureFlagService.isEnabled(key, userId);
    return { enabled };
  }

  @Post()
  async createFlag(@Body() flag: FeatureFlag): Promise<FeatureFlag> {
    await this.featureFlagService.setFlag(flag);
    return flag;
  }

  @Put(':key')
  async updateFlag(@Param('key') key: string, @Body() flag: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const existingFlag = await this.featureFlagService.getFlag(key);
    if (!existingFlag) {
      throw new Error(`Feature flag ${key} not found`);
    }
    const updatedFlag = { ...existingFlag, ...flag, key };
    await this.featureFlagService.setFlag(updatedFlag);
    return updatedFlag;
  }

  @Delete(':key')
  async deleteFlag(@Param('key') key: string): Promise<{ success: boolean }> {
    await this.featureFlagService.deleteFlag(key);
    return { success: true };
  }

  @Post('emergency/disable')
  async emergencyDisable(): Promise<{ success: boolean }> {
    await this.featureFlagService.emergencyDisable();
    return { success: true };
  }
}

