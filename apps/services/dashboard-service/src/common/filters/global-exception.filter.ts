/**
 * Global Exception Filter
 * 
 * Fängt alle Exceptions ab und gibt strukturierte Error-Responses zurück.
 * Loggt Fehler für Monitoring und Debugging.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthenticatedRequest } from '../interfaces/request.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      tenantId: request.tenantId || 'unknown',
      userId: request.user?.id || 'anonymous',
      message: typeof message === 'string' ? message : (message as any).message || 'Unknown error',
      error: typeof message === 'object' ? message : undefined,
    };

    // Log Error (nur für non-4xx Errors oder wenn DEBUG=true)
    if (status >= 500 || process.env.DEBUG === 'true') {
      this.logger.error(
        `Exception caught: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : undefined,
        {
          statusCode: status,
            path: request.url,
            method: request.method,
            tenantId: request.tenantId,
            userId: request.user?.id,
        },
      );
    } else if (status >= 400) {
      this.logger.warn(
        `Client error: ${typeof message === 'string' ? message : JSON.stringify(message)}`,
        {
          statusCode: status,
            path: request.url,
            method: request.method,
            tenantId: request.tenantId,
            userId: request.user?.id,
        },
      );
    }

    response.status(status).json(errorResponse);
  }
}
