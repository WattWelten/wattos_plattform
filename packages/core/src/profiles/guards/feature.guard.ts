import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagsService, FeatureNotEnabledError } from '../feature-flags.service';
import { FeatureFlags } from '../types';

/**
 * Feature Guard Metadata Key
 */
export const FEATURE_KEY = 'feature';

/**
 * Feature Decorator
 * 
 * Markiert einen Endpoint als Feature-geschützt
 * 
 * @example
 * ```typescript
 * @Feature('toolCallsEnabled')
 * @Post('tools/execute')
 * async executeTool() {
 *   // Wird nur ausgeführt wenn Feature aktiviert ist
 * }
 * ```
 */
export const Feature = (feature: string) => {
  return (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(FEATURE_KEY, feature, descriptor.value);
  };
};

/**
 * Feature Guard
 * 
 * Prüft ob ein Feature für den Tenant aktiviert ist
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Feature aus Metadata extrahieren
    const feature = this.reflector.get<string>(FEATURE_KEY, context.getHandler());
    if (!feature) {
      // Kein Feature-Requirement, erlauben
      return true;
    }

    // Tenant-ID aus Request extrahieren
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId || 'default';

    try {
      await this.featureFlags.requireFeature(tenantId, feature as keyof FeatureFlags);
      return true;
    } catch (error) {
      if (error instanceof FeatureNotEnabledError) {
        throw new ForbiddenException(
          `Feature '${feature}' is not enabled for this tenant. Please contact your administrator.`,
        );
      }
      throw error;
    }
  }
}

/**
 * Feature Guard Factory
 * 
 * Erstellt Feature Guard für spezifisches Feature
 */
export const createFeatureGuard = (feature: string) => {
  @Injectable()
  class SpecificFeatureGuard implements CanActivate {
    constructor(public readonly featureFlags: FeatureFlagsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const tenantId = request.headers['x-tenant-id'] || request.user?.tenantId || 'default';

      try {
        await this.featureFlags.requireFeature(tenantId, feature as keyof FeatureFlags);
        return true;
      } catch (error) {
        if (error instanceof FeatureNotEnabledError) {
          throw new ForbiddenException(
            `Feature '${feature}' is not enabled for this tenant. Please contact your administrator.`,
          );
        }
        throw error;
      }
    }
  }

  return SpecificFeatureGuard;
};

