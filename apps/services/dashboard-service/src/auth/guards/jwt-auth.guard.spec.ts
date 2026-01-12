/**
 * JWT Auth Guard Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);

    const mockRequest: Partial<AuthenticatedRequest> = {
      user: undefined,
      header: jest.fn(),
    };

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => mockRequest),
      })),
    } as unknown as ExecutionContext;
  });

  describe('canActivate', () => {
    it('should allow access when user is present', () => {
      const request = (mockContext.switchToHttp().getRequest() as any) as Partial<AuthenticatedRequest>;
      request.user = { id: 'user-123' };

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when X-User-Id header is present', () => {
      const request = (mockContext.switchToHttp().getRequest() as any) as Partial<AuthenticatedRequest>;
      (request.header as ReturnType<typeof jest.fn>)
        .mockReturnValueOnce('user-123') // x-user-id
        .mockReturnValueOnce('user@example.com') // x-user-email
        .mockReturnValueOnce('tenant-123'); // x-tenant-id

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(request.user).toBeDefined();
      expect(request.user?.id).toBe('user-123');
    });

    it('should throw UnauthorizedException when no user or header', () => {
      const request = (mockContext.switchToHttp().getRequest() as any) as Partial<AuthenticatedRequest>;
      (request.header as ReturnType<typeof jest.fn>).mockReturnValue(undefined);

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });
  });
});
