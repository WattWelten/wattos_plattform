import { Global, Module, Optional } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ObservabilityModule } from '@wattweiser/shared';

/**
 * PrismaModule - Globales Modul für PrismaService
 * Kann in allen Services importiert werden ohne erneute Registrierung
 * 
 * Optional: ObservabilityModule für automatische DB Metrics
 */
@Global()
@Module({
  imports: [ObservabilityModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}




