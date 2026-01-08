import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@wattweiser/db';
import { PersonaGeneratorModule } from './persona-generator/persona-generator.module';
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
    PersonaGeneratorModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
