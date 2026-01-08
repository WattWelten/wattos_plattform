import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base Exception Class
 * Alle benutzerdefinierten Exceptions sollten von dieser Klasse erben
 */
export abstract class BaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    public readonly code?: string,
    public readonly details?: Record<string, any>,
  ) {
    super(
      {
        message,
        code,
        ...details,
      },
      statusCode,
    );
  }
}

/**
 * Bad Request Exception (400)
 */
export class BadRequestException extends BaseException {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message, HttpStatus.BAD_REQUEST, code || 'BAD_REQUEST', details);
  }
}

/**
 * Unauthorized Exception (401)
 */
export class UnauthorizedException extends BaseException {
  constructor(message: string = 'Unauthorized', code?: string, details?: Record<string, any>) {
    super(message, HttpStatus.UNAUTHORIZED, code || 'UNAUTHORIZED', details);
  }
}

/**
 * Forbidden Exception (403)
 */
export class ForbiddenException extends BaseException {
  constructor(message: string = 'Forbidden', code?: string, details?: Record<string, any>) {
    super(message, HttpStatus.FORBIDDEN, code || 'FORBIDDEN', details);
  }
}

/**
 * Not Found Exception (404)
 */
export class NotFoundException extends BaseException {
  constructor(message: string = 'Resource not found', code?: string, details?: Record<string, any>) {
    super(message, HttpStatus.NOT_FOUND, code || 'NOT_FOUND', details);
  }
}

/**
 * Conflict Exception (409)
 */
export class ConflictException extends BaseException {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message, HttpStatus.CONFLICT, code || 'CONFLICT', details);
  }
}

/**
 * Unprocessable Entity Exception (422)
 */
export class UnprocessableEntityException extends BaseException {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, code || 'UNPROCESSABLE_ENTITY', details);
  }
}

/**
 * Internal Server Error Exception (500)
 */
export class InternalServerErrorException extends BaseException {
  constructor(message: string = 'Internal server error', code?: string, details?: Record<string, any>) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, code || 'INTERNAL_SERVER_ERROR', details);
  }
}

/**
 * Service Unavailable Exception (503)
 */
export class ServiceUnavailableException extends BaseException {
  constructor(message: string = 'Service unavailable', code?: string, details?: Record<string, any>) {
    super(message, HttpStatus.SERVICE_UNAVAILABLE, code || 'SERVICE_UNAVAILABLE', details);
  }
}
