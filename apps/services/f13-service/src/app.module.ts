import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { F13Module } from './f13/f13.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ObservabilityModule,
    ServiceDiscoveryModule,
    F13Module,
  ],
  controllers: [HealthController],
})
export class AppModule {}

