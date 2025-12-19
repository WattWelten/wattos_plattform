import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number; // in ms
  maxDelay: number; // in ms
  backoffMultiplier: number;
  retryableErrors?: (error: any) => boolean;
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
      retryableErrors: (error: any) => {
        // Standard: Retry bei Network-Errors und 5xx Errors
        if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
          return true;
        }
        if (error?.response?.status >= 500 && error?.response?.status < 600) {
          return true;
        }
        return false;
      },
      ...options,
    };

    let lastError: any;
    let delay = retryOptions.initialDelay;

    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          this.logger.log(`Operation succeeded after ${attempt} attempts`);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;

        // Prüfen ob Fehler retryable ist
        if (retryOptions.retryableErrors && !retryOptions.retryableErrors(error)) {
          this.logger.debug(`Error is not retryable: ${error.message}`);
          throw error;
        }

        // Letzter Versuch - Fehler werfen
        if (attempt === retryOptions.maxAttempts) {
          this.logger.error(`Operation failed after ${attempt} attempts: ${error.message}`);
          throw error;
        }

        // Exponential Backoff
        this.logger.warn(
          `Operation failed (attempt ${attempt}/${retryOptions.maxAttempts}), retrying in ${delay}ms: ${error.message}`,
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
    circuitBreaker: any,
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











