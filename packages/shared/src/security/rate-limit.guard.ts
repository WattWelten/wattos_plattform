import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';
import { createClient, RedisClientType } from 'redis';

/**
 * Enhanced Rate Limiting Guard
 * Unterstützt Rate Limiting pro User/Tenant
 */
@Injectable()
export class EnhancedRateLimitGuard extends ThrottlerGuard {
  private redisClient: RedisClientType | null = null;

  constructor() {
    super({} as any, {} as any, {} as any);
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        this.redisClient = createClient({ url: redisUrl });
        await this.redisClient.connect();
      }
    } catch {
      // Redis optional, fallback zu in-memory
    }
  }

  async getTracker(req: Record<string, any>): Promise<string> {
    // Rate Limiting Key basierend auf User-ID oder Tenant-ID
    const user = (req as any).user;
    const ip = (req as any).ip || (req as any).connection?.remoteAddress;

    if (user?.id) {
      // Pro User
      return `rate-limit:user:${user.id}`;
    } else if (user?.tenantId) {
      // Pro Tenant
      return `rate-limit:tenant:${user.tenantId}`;
    } else {
      // Fallback: IP-basiert
      return `rate-limit:ip:${ip}`;
    }
  }

  generateKey(context: ExecutionContext, tracker: string, prefix: string): string {
    const request = context.switchToHttp().getRequest<Request>();
    const route = request.route?.path || request.url;
    
    // Key mit Route für spezifischere Rate Limits
    return `${prefix}:${tracker}:${route}`;
  }

  async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    
    const message = user 
      ? 'Rate limit exceeded for user. Please try again later.'
      : 'Rate limit exceeded. Please try again later.';
    
    throw new ThrottlerException(message);
  }
}







