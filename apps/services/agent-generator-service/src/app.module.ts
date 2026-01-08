import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@wattweiser/db';
import { AgentGeneratorModule } from './agent-generator/agent-generator.module';
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
    AgentGeneratorModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
