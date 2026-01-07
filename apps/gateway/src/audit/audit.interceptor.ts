import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { MetricsService } from '@wattweiser/shared';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private metricsService?: MetricsService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params } = request;
    const user = (request as any).user;
    const startTime = Date.now();

    // Tenant-ID aus Header extrahieren (falls vorhanden)
    const tenantId = (request.headers['x-tenant-id'] as string) || user?.tenantId;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode || 200;

        // Resource-ID aus query extrahieren (kann string, array oder undefined sein)
        const queryId = query?.id;
        const resourceId = params?.id || (typeof queryId === 'string' ? queryId : undefined);

        // Audit Logging
        this.auditService.log(
          `${method} ${url}`,
          {
            method,
            url,
            body,
            query,
            params,
          },
          {
            ...(user?.id && { userId: user.id }),
            ...(tenantId && { tenantId }),
            ...(this.extractResourceType(url) && { resourceType: this.extractResourceType(url) }),
            ...(resourceId && { resourceId }),
            ...(request.ip && { ipAddress: request.ip }),
            ...(request.get('user-agent') && { userAgent: request.get('user-agent') }),
          }
        );

        // Metrics Tracking
        if (this.metricsService) {
          this.metricsService.recordHttpRequest(method, url, statusCode, duration);
        }
      }),
      catchError((error: unknown) => {
        const duration = Date.now() - startTime;
        const statusCode =
          error &&
          typeof error === 'object' &&
          'status' in error &&
          typeof error.status === 'number'
            ? error.status
            : 500;

        // Metrics Tracking für Fehler
        if (this.metricsService) {
          this.metricsService.recordHttpRequest(method, url, statusCode, duration);
        }

        throw error;
      })
    );
  }

  private extractResourceType(url: string): string | undefined {
    // Resource-Typ aus URL extrahieren (z.B. /api/v1/characters -> 'character')
    const match = url.match(/\/api\/v?\d*\/(\w+)/);
    return match && match[1] ? match[1].replace(/s$/, '') : undefined;
  }
}
