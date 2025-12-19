import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';
import { PrismaModule } from '@wattweiser/db';
import { ObservabilityModule } from '@wattweiser/shared';

@Module({
  imports: [PrismaModule, ObservabilityModule],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}


