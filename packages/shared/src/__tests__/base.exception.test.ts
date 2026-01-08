import { describe, it, expect } from 'vitest';
import {
  BaseException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '../exceptions/base.exception';
import { HttpStatus } from '@nestjs/common';

describe('BaseException', () => {
  it('should create exception with message and status code', () => {
    class TestException extends BaseException {
      constructor(message: string) {
        super(message, HttpStatus.BAD_REQUEST);
      }
    }

    const exception = new TestException('Test error');
    expect(exception.message).toBe('Test error');
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should include code and details in response', () => {
    class TestException extends BaseException {
      constructor(message: string, code?: string, details?: Record<string, any>) {
        super(message, HttpStatus.BAD_REQUEST, code, details);
      }
    }

    const exception = new TestException('Test error', 'TEST_CODE', { field: 'value' });
    const response = exception.getResponse();
    
    expect(response).toHaveProperty('message', 'Test error');
    expect(response).toHaveProperty('code', 'TEST_CODE');
    expect(response).toHaveProperty('field', 'value');
  });
});

describe('BadRequestException', () => {
  it('should create BadRequestException with 400 status', () => {
    const exception = new BadRequestException('Invalid input');
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(exception.message).toBe('Invalid input');
  });

  it('should include code and details', () => {
    const exception = new BadRequestException('Invalid input', 'INVALID_INPUT', { field: 'email' });
    const response = exception.getResponse();
    expect(response).toHaveProperty('code', 'INVALID_INPUT');
    expect(response).toHaveProperty('field', 'email');
  });
});

describe('UnauthorizedException', () => {
  it('should create UnauthorizedException with 401 status', () => {
    const exception = new UnauthorizedException();
    expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(exception.message).toBe('Unauthorized');
  });

  it('should accept custom message', () => {
    const exception = new UnauthorizedException('Custom unauthorized message');
    expect(exception.message).toBe('Custom unauthorized message');
  });
});

describe('ForbiddenException', () => {
  it('should create ForbiddenException with 403 status', () => {
    const exception = new ForbiddenException();
    expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(exception.message).toBe('Forbidden');
  });
});

describe('NotFoundException', () => {
  it('should create NotFoundException with 404 status', () => {
    const exception = new NotFoundException('Resource not found');
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.message).toBe('Resource not found');
  });

  it('should use default message if not provided', () => {
    const exception = new NotFoundException();
    expect(exception.message).toBe('Resource not found');
  });
});

describe('ConflictException', () => {
  it('should create ConflictException with 409 status', () => {
    const exception = new ConflictException('Resource conflict');
    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.message).toBe('Resource conflict');
  });
});

describe('UnprocessableEntityException', () => {
  it('should create UnprocessableEntityException with 422 status', () => {
    const exception = new UnprocessableEntityException('Validation failed');
    expect(exception.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(exception.message).toBe('Validation failed');
  });
});

describe('InternalServerErrorException', () => {
  it('should create InternalServerErrorException with 500 status', () => {
    const exception = new InternalServerErrorException();
    expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exception.message).toBe('Internal server error');
  });

  it('should accept custom message', () => {
    const exception = new InternalServerErrorException('Custom error');
    expect(exception.message).toBe('Custom error');
  });
});

describe('ServiceUnavailableException', () => {
  it('should create ServiceUnavailableException with 503 status', () => {
    const exception = new ServiceUnavailableException();
    expect(exception.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(exception.message).toBe('Service unavailable');
  });

  it('should accept custom message', () => {
    const exception = new ServiceUnavailableException('Service temporarily unavailable');
    expect(exception.message).toBe('Service temporarily unavailable');
  });
});
