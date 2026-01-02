import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '@wattweiser/db';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { MetricsModule } from './metrics/metrics.module';
import { DbModule } from './db/db.module';
import { KnowledgeSpacesModule } from './knowledge-spaces/knowledge-spaces.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { MvpModule } from './mvp/mvp.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    PrismaModule,
    ObservabilityModule,
    ServiceDiscoveryModule,
    RbacModule,
    AuditModule,
    MetricsModule,
    DbModule,
    KnowledgeSpacesModule,
    FeatureFlagsModule,
    MvpModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}


