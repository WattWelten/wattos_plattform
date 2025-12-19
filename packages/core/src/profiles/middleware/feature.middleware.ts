import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FeatureFlagsService } from '../feature-flags.service';

/**
 * Feature Middleware
 * 
 * Fügt Feature-Flags zum Request hinzu
 */
@Injectable()
export class FeatureMiddleware implements NestMiddleware {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).user?.tenantId || 'default';

    try {
      // Lade alle Features für Tenant
      const features = await this.featureFlags.getAllFeatures(tenantId);

      // Füge Features zum Request hinzu
      (req as any).features = features;
      (req as any).tenantId = tenantId;

      next();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to load features: ${errorMessage}`);
      // Bei Fehler: Standard-Features (alle deaktiviert)
      (req as any).features = {};
      (req as any).tenantId = tenantId;
      next();
    }
  }
}

