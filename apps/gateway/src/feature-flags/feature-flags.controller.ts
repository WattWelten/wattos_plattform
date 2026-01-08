import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeatureFlagsService } from '@wattweiser/shared';
import { FeatureFlag } from '@wattweiser/shared';

@ApiBearerAuth()
@ApiTags('feature-flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flags' })
  async getAllFlags(): Promise<FeatureFlag[]> {
    return this.featureFlagsService.getAllFlags();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get feature flag value' })
  async getFlag(@Param('key') key: string): Promise<{ key: string; enabled: boolean }> {
    const enabled = await this.featureFlagsService.getFlag(key);
    return { key, enabled };
  }

  @Post()
  @ApiOperation({ summary: 'Create or update feature flag' })
  async setFlag(@Body() flag: FeatureFlag): Promise<FeatureFlag> {
    await this.featureFlagsService.setFlag(flag);
    return flag;
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update feature flag' })
  async updateFlag(@Param('key') key: string, @Body() flag: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const currentFlag = await this.featureFlagsService.getFlag(key);
    const updatedFlag: FeatureFlag = {
      key,
      enabled: flag.enabled ?? currentFlag,
      description: flag.description,
      metadata: flag.metadata,
      ttl: flag.ttl,
    };
    await this.featureFlagsService.setFlag(updatedFlag);
    return updatedFlag;
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete feature flag' })
  async deleteFlag(@Param('key') key: string): Promise<{ success: boolean }> {
    await this.featureFlagsService.deleteFlag(key);
    return { success: true };
  }

  @Get('check/:key')
  @ApiOperation({ summary: 'Check if feature is enabled' })
  async isEnabled(@Param('key') key: string): Promise<{ key: string; enabled: boolean }> {
    const enabled = await this.featureFlagsService.isEnabled(key);
    return { key, enabled };
  }
}
