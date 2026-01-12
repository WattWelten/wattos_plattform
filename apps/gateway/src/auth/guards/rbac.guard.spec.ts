/**
 * RBAC Guard Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard, RoleType } from './rbac.guard';
import { PrismaService } from '@wattweiser/db';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let mockContext: ExecutionContext;
  let mockReflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  const mockPrismaService = {
    client: {
      userRole: {
        findMany: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        RbacGuard,
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);
    
    // Stelle sicher, dass der Reflector korrekt injiziert wurde
    // Verwende Object.defineProperty für read-only Properties
    if (!guard['reflector']) {
      Object.defineProperty(guard, 'reflector', {
        value: mockReflector,
        writable: true,
        configurable: true,
      });
    }
    
    // Stelle sicher, dass PrismaService korrekt injiziert wurde
    if (!guard['prisma']) {
      Object.defineProperty(guard, 'prisma', {
        value: mockPrismaService,
        writable: true,
        configurable: true,
      });
    }

    const mockRequest = {
      user: { id: 'user-123' },
      tenantId: 'tenant-123',
    };
    
    mockContext = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn(() => ({
        getRequest: vi.fn(() => mockRequest),
      })),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles required', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      mockPrismaService.client.userRole.findMany.mockResolvedValue([
        {
          role: {
            roleType: RoleType.ADMIN,
          },
        },
      ]);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny access when user lacks required role', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      mockPrismaService.client.userRole.findMany.mockResolvedValue([
        {
          role: {
            roleType: RoleType.VIEWER,
          },
        },
      ]);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should deny access when user is not authenticated', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      const contextWithoutUser = {
        ...mockContext,
        switchToHttp: vi.fn(() => ({
          getRequest: vi.fn(() => ({
            user: null,
            tenantId: 'tenant-123',
          })),
        })),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(contextWithoutUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should deny access when tenantId is missing', async () => {
      mockReflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      const contextWithoutTenant = {
        ...mockContext,
        switchToHttp: vi.fn(() => ({
          getRequest: vi.fn(() => ({
            user: { id: 'user-123' },
            tenantId: null,
          })),
        })),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(contextWithoutTenant)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
