import { Prisma } from '@prisma/client';
import { MetricsService } from '@wattweiser/shared';

/**
 * Prisma Middleware für automatisches Query-Tracking
 * Zeichnet alle Database-Queries auf und sendet Metriken an MetricsService
 */
export function createPrismaQueryLoggerMiddleware(metricsService?: MetricsService) {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    const startTime = Date.now();
    let success = false;
    let error: Error | null = null;

    try {
      const result = await next(params);
      success = true;
      return result;
    } catch (e) {
      error = e as Error;
      throw e;
    } finally {
      const duration = Date.now() - startTime;

      // Track Query Metrics
      if (metricsService) {
        const operation = getOperationName(params);
        metricsService.recordDbQuery(operation, duration, success);
      }
    }
  };
}

/**
 * Extrahiert Operation-Name aus Prisma Params
 */
function getOperationName(params: Prisma.MiddlewareParams): string {
  const model = params.model || 'unknown';
  const action = params.action || 'unknown';
  return `${model}.${action}`;
}
