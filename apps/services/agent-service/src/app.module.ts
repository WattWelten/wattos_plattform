import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '@wattweiser/db';
import { AgentModule } from './agent/agent.module';
import { GraphModule } from './graph/graph.module';
import { HitlModule } from './hitl/hitl.module';
import { KpiModule } from './kpi/kpi.module';
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
    AgentModule,
    GraphModule,
    HitlModule,
    KpiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

