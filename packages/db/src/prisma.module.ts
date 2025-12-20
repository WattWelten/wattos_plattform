import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Optional: ObservabilityModule from @wattweiser/shared (if available)
// import { ObservabilityModule } from '@wattweiser/shared';

/**
 * PrismaModule - Globales Modul für PrismaService
 * Kann in allen Services importiert werden ohne erneute Registrierung
 * 
 * Optional: ObservabilityModule für automatische DB Metrics
 */
@Global()
@Module({
  // imports: [ObservabilityModule], // Optional: Enable if @wattweiser/shared is available
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}




