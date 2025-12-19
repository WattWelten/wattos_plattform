import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProfileService } from './profile.service';
import { FeatureFlagsService } from './feature-flags.service';
import { EnterpriseValidator } from './validators/enterprise.validator';
import { GovValidator } from './validators/gov.validator';
import { MediaValidator } from './validators/media.validator';
import { HealthValidator } from './validators/health.validator';
import { FeatureGuard, createFeatureGuard } from './guards/feature.guard';
import { FeatureMiddleware } from './middleware/feature.middleware';

/**
 * Profiles Module
 * 
 * Profile-System für Tenant-Konfiguration
 */
@Module({
  imports: [ConfigModule],
  providers: [
    ProfileService,
    FeatureFlagsService,
    EnterpriseValidator,
    GovValidator,
    MediaValidator,
    HealthValidator,
    FeatureGuard,
    FeatureMiddleware,
  ],
  exports: [
    ProfileService,
    FeatureFlagsService,
    FeatureGuard,
    FeatureMiddleware,
    createFeatureGuard,
  ],
})
export class ProfilesModule {}

