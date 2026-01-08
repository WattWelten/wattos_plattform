import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule - Globales Modul für PrismaService
 * Kann in allen Services importiert werden ohne erneute Registrierung
 * 
 * Hinweis: MetricsService wird automatisch injiziert wenn ObservabilityModule
 * im gleichen Service importiert ist (Services importieren beide Module)
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}




