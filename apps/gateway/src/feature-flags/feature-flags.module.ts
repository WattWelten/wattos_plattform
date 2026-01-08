import { Module } from '@nestjs/common';
import { FeatureFlagsModule as SharedFeatureFlagsModule } from '@wattweiser/shared';
import { FeatureFlagsController } from './feature-flags.controller';

@Module({
  imports: [SharedFeatureFlagsModule],
  controllers: [FeatureFlagsController],
})
export class FeatureFlagsModule {}
