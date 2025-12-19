import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SearchModule } from './search/search.module';
import { ContextModule } from './context/context.module';
import { CitationsModule } from './citations/citations.module';
import { ObservabilityModule, HealthController, CacheModule, ServiceDiscoveryModule } from '@wattweiser/shared';
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
    ObservabilityModule,
    CacheModule,
    ServiceDiscoveryModule,
    SearchModule,
    ContextModule,
    CitationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}


