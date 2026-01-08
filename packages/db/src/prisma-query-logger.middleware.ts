/**
 * Prisma Middleware für automatisches Query-Tracking
 * Zeichnet alle Database-Queries auf und sendet Metriken an MetricsService
 * 
 * NOTE: Diese Middleware wird in prisma.service.ts verwendet.
 * Der Import von @wattweiser/shared wird zur Laufzeit aufgelöst.
 */
export function createPrismaQueryLoggerMiddleware(metricsService?: any) {
  return async (params: any, next: (params: any) => Promise<any>) => {
    const startTime = Date.now();
    let success = false;

    try {
      const result = await next(params);
      success = true;
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track Query Metrics für Fehler
      if (metricsService && metricsService.recordDbQuery) {
        const operation = getOperationName(params);
        metricsService.recordDbQuery(operation, duration, false);
      }
      
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      // Track Query Metrics
      if (metricsService && metricsService.recordDbQuery && success) {
        const operation = getOperationName(params);
        metricsService.recordDbQuery(operation, duration, true);
      }
    }
  };
}

/**
 * Extrahiert Operation-Name aus Prisma Params
 */
function getOperationName(params: any): string {
  const model = params.model || 'unknown';
  const action = params.action || 'unknown';
  return `${model}.${action}`;
}
