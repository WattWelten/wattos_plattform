import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceDiscoveryService } from './service-discovery.service';

/**
 * Service Discovery Module
 * 
 * Globales Modul für Service Discovery.
 * Kann in allen Services importiert werden, ohne erneute Registrierung.
 * 
 * @example
 * ```typescript
 * // In app.module.ts
 * imports: [ServiceDiscoveryModule]
 * 
 * // In service
 * constructor(private serviceDiscovery: ServiceDiscoveryService) {}
 * ```
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [ServiceDiscoveryService],
  exports: [ServiceDiscoveryService],
})
export class ServiceDiscoveryModule {}











