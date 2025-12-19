import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * Token Blacklist Service
 * Verwaltet eine Blacklist von invalidierten JWT-Tokens in Redis
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private redisClient: RedisClientType | null = null;
  private readonly ttl: number;

  constructor(private configService: ConfigService) {
    this.ttl = this.parseJwtExpiry(
      this.configService.get<string>('JWT_EXPIRES_IN', '1h')
    );
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
      this.redisClient = createClient({ url: redisUrl });
      
      this.redisClient.on('error', (err) => {
        this.logger.error(`Redis Client Error: ${err.message}`);
      });

      await this.redisClient.connect();
      this.logger.log('Redis client connected for token blacklist');
    } catch (error: any) {
      this.logger.warn(`Failed to connect to Redis: ${error.message}. Token blacklist will not work.`);
      // Fallback: In-Memory blacklist (nur für Entwicklung)
      this.logger.warn('Using in-memory blacklist (not recommended for production)');
    }
  }

  /**
   * JWT Expiry String in Sekunden umwandeln
   */
  private parseJwtExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default: 1 Stunde

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }

  /**
   * Token zur Blacklist hinzufügen
   */
  async addToBlacklist(token: string, userId?: string): Promise<void> {
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        // Token-Hash als Key verwenden (kürzer)
        const tokenHash = this.hashToken(token);
        await this.redisClient.setEx(`blacklist:${tokenHash}`, this.ttl, '1');
        
        if (userId) {
          // Auch User-spezifische Blacklist für schnelleres Lookup
          await this.redisClient.sAdd(`user:blacklist:${userId}`, tokenHash);
          await this.redisClient.expire(`user:blacklist:${userId}`, this.ttl);
        }
      } else {
        // Fallback: In-Memory (nur für Entwicklung)
        this.logger.warn('Redis not available, using in-memory blacklist');
      }
    } catch (error: any) {
      this.logger.error(`Failed to add token to blacklist: ${error.message}`);
    }
  }

  /**
   * Prüfen ob Token in Blacklist ist
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        const tokenHash = this.hashToken(token);
        const result = await this.redisClient.get(`blacklist:${tokenHash}`);
        return result === '1';
      }
      return false;
    } catch (error: any) {
      this.logger.error(`Failed to check token blacklist: ${error.message}`);
      return false; // Bei Fehler: Token nicht blockieren
    }
  }

  /**
   * Alle Tokens eines Users invalidieren
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        // User-spezifische Blacklist löschen (wird bei nächstem Login neu erstellt)
        await this.redisClient.del(`user:blacklist:${userId}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to invalidate user tokens: ${error.message}`);
    }
  }

  /**
   * Einfacher Hash für Token (SHA-256 wäre besser, aber für Blacklist ausreichend)
   */
  private hashToken(token: string): string {
    // Einfacher Hash für Demo (in Produktion: crypto.createHash('sha256'))
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async onModuleDestroy() {
    if (this.redisClient && this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }
}











