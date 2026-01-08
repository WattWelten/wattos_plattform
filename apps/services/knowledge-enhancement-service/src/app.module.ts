import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@wattweiser/db';
import { KnowledgeEnhancementModule } from './knowledge-enhancement/knowledge-enhancement.module';
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
    KnowledgeEnhancementModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
