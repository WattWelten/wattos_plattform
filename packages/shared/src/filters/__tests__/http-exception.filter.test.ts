import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpExceptionFilter } from '../http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException, BadRequestException, NotFoundException } from '../../exceptions/base.exception';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: Partial<ArgumentsHost>;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockRequest = {
      url: '/api/test',
      method: 'GET',
      headers: {},
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockArgumentsHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
        getResponse: vi.fn().mockReturnValue(mockResponse),
      }),
    };
  });

  describe('BaseException handling', () => {
    it('should handle BadRequestException', () => {
      const exception = new BadRequestException('Invalid input', 'INVALID_INPUT');
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle NotFoundException', () => {
      const exception = new NotFoundException('Resource not found');
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with string response', () => {
      const exception = new HttpException('Error message', HttpStatus.BAD_REQUEST);
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Error handling', () => {
    it('should handle generic Error', () => {
      const exception = new Error('Generic error');
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('Request-ID handling', () => {
    it('should extract request ID from x-request-id header', () => {
      mockRequest.headers = { 'x-request-id': 'test-request-id-123' };
      const exception = new BadRequestException('Error');
      filter.catch(exception, mockArgumentsHost as ArgumentsHost);
      const callArgs = (mockResponse.json as any).mock.calls[0][0];
      expect(callArgs).toHaveProperty('requestId');
    });
  });
});
