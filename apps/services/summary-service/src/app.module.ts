import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SummaryModule } from './summary/summary.module';
import { ServiceDiscoveryModule } from '@wattweiser/shared';
import { PrismaModule } from '@wattweiser/db';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    ServiceDiscoveryModule,
    SummaryModule,
  ],
})
export class AppModule {}


