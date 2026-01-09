import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ObservabilityModule } from '@wattweiser/shared';
import { PrismaModule, PrismaService } from '@wattweiser/db';
import { HealthController } from './health.controller';
import { HealthService } from '@wattweiser/shared';

@Global()
@Module({
  imports: [ConfigModule, ObservabilityModule, PrismaModule],
  controllers: [HealthController],
  providers: [
    {
      provide: HealthService,
      useFactory: (configService: ConfigService, prismaService: PrismaService) => {
        return new HealthService(configService, prismaService);
      },
      inject: [ConfigService, PrismaService],
    },
  ],
  exports: [HealthService],
})
export class HealthModule {}
