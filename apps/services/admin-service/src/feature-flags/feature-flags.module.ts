import { Module } from '@nestjs/common';
import { FeatureFlagModule } from '@wattweiser/shared';
import { FeatureFlagsController } from './feature-flags.controller';

@Module({
  imports: [FeatureFlagModule],
  controllers: [FeatureFlagsController],
})
export class FeatureFlagsModule {}












