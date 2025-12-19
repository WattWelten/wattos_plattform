import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@wattweiser/db';
import { createClient, RedisClientType } from 'redis';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  timestamp: string;
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      message?: string;
      responseTime?: number;
    };
  };
}

@Injectable()
export class HealthService {
  private redisClient: RedisClientType | null = null;

  constructor(
    private configService?: ConfigService,
    private prisma?: PrismaService,
  ) {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = this.configService?.get<string>('REDIS_URL') || process.env.REDIS_URL;
      if (redisUrl) {
        this.redisClient = createClient({ url: redisUrl });
        this.redisClient.on('error', () => {
          // Silent error handling - will be caught in health check
        });
        await this.redisClient.connect().catch(() => {
          // Connection will be checked in health check
        });
      }
    } catch {
      // Redis optional
    }
  }

  /**
   * Vollständiger Health Check
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    // const startTime = Date.now(); // Unused for now

    // Database Check
    const dbCheck = await this.checkDatabase();
    checks.database = dbCheck;

    // Redis Check
    const redisCheck = await this.checkRedis();
    checks.redis = redisCheck;

    // External Services Checks
    const llmGatewayCheck = await this.checkLlmGateway();
    checks.llm_gateway = llmGatewayCheck;

    const ragServiceCheck = await this.checkRagService();
    checks.rag_service = ragServiceCheck;

    // Gesamtstatus bestimmen
    const allUp = Object.values(checks).every((check) => check.status === 'up');
    const criticalDown = checks.database?.status === 'down';

    let status: 'healthy' | 'unhealthy' | 'degraded';
    if (criticalDown) {
      status = 'unhealthy';
    } else if (!allUp) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
      message: status === 'healthy' 
        ? 'All systems operational' 
        : status === 'degraded' 
        ? 'Some non-critical services are down'
        : 'Critical services are down',
    };
  }

  /**
   * Database Health Check
   */
  async checkDatabase(): Promise<{ status: 'up' | 'down'; message?: string; responseTime?: number }> {
    if (!this.prisma) {
      return { status: 'down', message: 'Prisma service not available' };
    }

    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      return { status: 'up', responseTime };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return { status: 'down', message: error.message, responseTime };
    }
  }

  /**
   * Redis Health Check
   */
  async checkRedis(): Promise<{ status: 'up' | 'down'; message?: string; responseTime?: number }> {
    const startTime = Date.now();
    try {
      if (!this.redisClient) {
        // Versuche Verbindung herzustellen
        const redisUrl = this.configService?.get<string>('REDIS_URL') || process.env.REDIS_URL;
        if (!redisUrl) {
          return { status: 'down', message: 'Redis URL not configured' };
        }

        const client = createClient({ url: redisUrl });
        await client.connect();
        await client.ping();
        await client.quit();
        const responseTime = Date.now() - startTime;
        return { status: 'up', responseTime };
      }

      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }

      await this.redisClient.ping();
      const responseTime = Date.now() - startTime;
      return { status: 'up', responseTime };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return { status: 'down', message: error.message, responseTime };
    }
  }

  /**
   * LLM Gateway Health Check
   */
  async checkLlmGateway(): Promise<{ status: 'up' | 'down'; message?: string; responseTime?: number }> {
    const startTime = Date.now();
    try {
      const llmGatewayUrl = this.configService?.get<string>('LLM_GATEWAY_URL') || process.env.LLM_GATEWAY_URL || 'http://localhost:3009';
      const response = await fetch(`${llmGatewayUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      const responseTime = Date.now() - startTime;
      if (response.ok) {
        return { status: 'up', responseTime };
      } else {
        return { status: 'down', message: `HTTP ${response.status}`, responseTime };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return { status: 'down', message: error.message, responseTime };
    }
  }

  /**
   * RAG Service Health Check
   */
  async checkRagService(): Promise<{ status: 'up' | 'down'; message?: string; responseTime?: number }> {
    const startTime = Date.now();
    try {
      const ragServiceUrl = this.configService?.get<string>('RAG_SERVICE_URL') || process.env.RAG_SERVICE_URL || 'http://localhost:3007';
      const response = await fetch(`${ragServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      const responseTime = Date.now() - startTime;
      if (response.ok) {
        return { status: 'up', responseTime };
      } else {
        return { status: 'down', message: `HTTP ${response.status}`, responseTime };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return { status: 'down', message: error.message, responseTime };
    }
  }

  /**
   * Liveness Probe (einfacher Check ob Service läuft)
   */
  async liveness(): Promise<{ status: 'alive' | 'dead' }> {
    return { status: 'alive' };
  }

  /**
   * Readiness Probe (Service bereit für Traffic)
   */
  async readiness(): Promise<{ status: 'ready' | 'not_ready' }> {
    const dbCheck = await this.checkDatabase();
    if (dbCheck.status === 'up') {
      return { status: 'ready' };
    }
    return { status: 'not_ready' };
  }
}







