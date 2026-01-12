/**
 * RBAC Guard Unit Tests
 */

// Jest globals are available without import
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard, RoleType } from './rbac.guard';
import { PrismaService } from '@wattweiser/db';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let mockPrismaService: {
    client: {
      userRole: {
        findMany: ReturnType<typeof jest.fn>;
      };
    };
  };
  let mockReflector: {
    getAllAndOverride: ReturnType<typeof jest.fn>;
  };
  let mockContext: ExecutionContext;

  beforeEach(async () => {
    mockPrismaService = {
      client: {
        userRole: {
          findMany: jest.fn().mockResolvedValue([
            {
              role: {
                roleType: RoleType.ADMIN,
              },
            },
          ]),
        },
      },
    };

    mockReflector = {
      getAllAndOverride: jest.fn().mockReturnValue([RoleType.ADMIN]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);

    const mockRequest: Partial<AuthenticatedRequest> = {
      user: {
        id: 'user-123',
        tenantId: 'tenant-123',
      },
      tenantId: 'tenant-123',
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
    it('should allow access when user has required role', async () => {
      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
      expect(mockPrismaService.client.userRole.findMany).toHaveBeenCalled();
    });

    it('should allow access when no roles required', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user not authenticated', async () => {
      const request = (mockContext.switchToHttp().getRequest() as any) as Partial<AuthenticatedRequest>;
      request.user = undefined;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when tenantId missing', async () => {
      const request = (mockContext.switchToHttp().getRequest() as any) as Partial<AuthenticatedRequest>;
      request.tenantId = undefined;
      request.user = { id: 'user-123' };

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user lacks required role', async () => {
      mockPrismaService.client.userRole.findMany.mockResolvedValue([
        {
          role: {
            roleType: RoleType.VIEWER,
          },
        },
      ]);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it('should use tenantId from request if user.tenantId missing', async () => {
      const request = (mockContext.switchToHttp().getRequest() as any) as Partial<AuthenticatedRequest>;
      request.user = { id: 'user-123' };
      request.tenantId = 'tenant-123';

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockPrismaService.client.userRole.findMany).toHaveBeenCalled();
    });
  });
});
