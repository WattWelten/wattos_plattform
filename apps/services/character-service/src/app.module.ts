import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@wattweiser/db';
import { CharacterModule } from './character/character.module';
import { ArtifactsModule } from './artifacts/artifacts.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ObservabilityModule,
    ServiceDiscoveryModule,
    CharacterModule,
    ArtifactsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

