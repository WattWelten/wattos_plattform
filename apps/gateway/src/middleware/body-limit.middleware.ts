import { Injectable, NestMiddleware, PayloadTooLargeException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Body Size Limit Middleware
 * Begrenzt die Größe von Request Bodies
 */
@Injectable()
export class BodyLimitMiddleware implements NestMiddleware {
  private maxSize: number;

  constructor(private configService: ConfigService) {
    const bodyLimit = this.configService.get<string>('BODY_LIMIT', '2mb');
    this.maxSize = this.parseSize(bodyLimit);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > this.maxSize) {
        throw new PayloadTooLargeException(
          `Request body too large. Maximum size is ${this.formatSize(this.maxSize)}`
        );
      }
    }

    // Überwache tatsächliche Body-Größe während des Streams
    let receivedSize = 0;
    const originalOn = req.on.bind(req);
    
    req.on = function (event: string, listener: any) {
      if (event === 'data') {
        return originalOn(event, (chunk: Buffer) => {
          receivedSize += chunk.length;
          if (receivedSize > this.maxSize) {
            res.status(413).json({
              statusCode: 413,
              message: `Request body too large. Maximum size is ${this.formatSize(this.maxSize)}`,
            });
            return;
          }
          listener(chunk);
        });
      }
      return originalOn(event, listener);
    }.bind(this);

    next();
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+)([a-z]+)$/);
    if (!match) {
      return 2 * 1024 * 1024; // Default 2MB
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    return value * (units[unit] || 1);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }
}
