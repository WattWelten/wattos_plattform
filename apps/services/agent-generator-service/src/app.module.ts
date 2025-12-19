import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentGeneratorModule } from './agent-generator/agent-generator.module';
import { ObservabilityModule, HealthController, ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ObservabilityModule,
    ServiceDiscoveryModule,
    AgentGeneratorModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

