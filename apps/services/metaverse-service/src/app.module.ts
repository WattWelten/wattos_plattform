import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetaverseModule } from './metaverse/metaverse.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ObservabilityModule,
    ServiceDiscoveryModule,
    MetaverseModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}


