/**
 * Tenant Config Module
 * 
 * NestJS Module für Tenant-Config-Loader
 */

import { Module } from '@nestjs/common';
import { TenantConfigLoader } from './tenant-config.loader';

@Module({
  providers: [TenantConfigLoader],
  exports: [TenantConfigLoader],
})
export class TenantConfigModule {}
