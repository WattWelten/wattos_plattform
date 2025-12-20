import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number; // in ms
  maxDelay: number; // in ms
  backoffMultiplier: number;
  retryableErrors?: (error: unknown) => boolean;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  constructor(private configService?: ConfigService) {}

  /**
   * Führt eine Operation mit Retry-Logik aus
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: Partial<RetryOptions>,
  ): Promise<T> {
    const retryOptions: RetryOptions = {
      maxAttempts: this.configService?.get<number>('RETRY_MAX_ATTEMPTS', 3) || 3,
      initialDelay: this.configService?.get<number>('RETRY_INITIAL_DELAY', 1000) || 1000,
      maxDelay: this.configService?.get<number>('RETRY_MAX_DELAY', 30000) || 30000,
      backoffMultiplier: this.configService?.get<number>('RETRY_BACKOFF_MULTIPLIER', 2) || 2,
      retryableErrors: (error: unknown) => {
        // Standard: Retry bei Network-Errors und 5xx Errors
        if (error && typeof error === 'object') {
          const err = error as { code?: string; response?: { status?: number } };
          if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            return true;
          }
          if (err.response?.status && err.response.status >= 500 && err.response.status < 600) {
            return true;
          }
        }
        return false;
      },
      ...options,
    };

    let lastError: unknown;
    let delay = retryOptions.initialDelay;

    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          this.logger.log(`Operation succeeded after ${attempt} attempts`);
        }
        
        return result;
      } catch (error: unknown) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Prüfen ob Fehler retryable ist
        if (retryOptions.retryableErrors && !retryOptions.retryableErrors(error)) {
          this.logger.debug(`Error is not retryable: ${errorMessage}`);
          throw error;
        }

        // Letzter Versuch - Fehler werfen
        if (attempt === retryOptions.maxAttempts) {
          this.logger.error(`Operation failed after ${attempt} attempts: ${errorMessage}`);
          throw error;
        }

        // Exponential Backoff
        this.logger.warn(
          `Operation failed (attempt ${attempt}/${retryOptions.maxAttempts}), retrying in ${delay}ms: ${errorMessage}`,
        );

        await this.sleep(delay);
        delay = Math.min(delay * retryOptions.backoffMultiplier, retryOptions.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Retry mit Circuit Breaker kombinieren
   */
  async executeWithRetryAndCircuitBreaker<T>(
    circuitBreaker: { execute: (name: string, operation: () => Promise<T>) => Promise<T> },
    circuitName: string,
    operation: () => Promise<T>,
    retryOptions?: Partial<RetryOptions>,
  ): Promise<T> {
    return circuitBreaker.execute(circuitName, () => {
      return this.executeWithRetry(operation, retryOptions);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}










