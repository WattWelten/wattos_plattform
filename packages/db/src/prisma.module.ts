import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule - Globales Modul für PrismaService
 * Kann in allen Services importiert werden ohne erneute Registrierung
 * 
 * Hinweis: MetricsService wird automatisch injiziert wenn ObservabilityModule
 * im gleichen Service importiert ist (Services importieren beide Module)
 * 
 * ConfigModule wird importiert, damit ConfigService für DATABASE_URL verfügbar ist
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}




