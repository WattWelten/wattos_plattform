import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { F13Config, F13ConfigSchema, getDefaultF13Config } from './config';

/**
 * F13 API Error
 */
export class F13ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly response: any,
    message?: string
  ) {
    super(message || `F13 API error: ${statusCode}`);
    this.name = 'F13ApiError';
  }
}

/**
 * F13 HTTP Client
 *
 * Robuster HTTP-Client für F13 API mit Retry-Logik und Error-Handling
 */
@Injectable()
export class F13Client {
  private readonly logger = new Logger(F13Client.name);
  private readonly http: AxiosInstance;
  private readonly config: F13Config;

  constructor(private readonly configService: ConfigService) {
    const defaultConfig = getDefaultF13Config();
    const envConfig = {
      baseUrl: this.configService.get<string>('F13_BASE_URL') || defaultConfig.baseUrl,
      apiKey: this.configService.get<string>('F13_API_KEY') || defaultConfig.apiKey,
      timeout: this.configService.get<number>('F13_TIMEOUT') ?? defaultConfig.timeout,
      retryAttempts:
        this.configService.get<number>('F13_RETRY_ATTEMPTS') ?? defaultConfig.retryAttempts,
      retryDelay: this.configService.get<number>('F13_RETRY_DELAY') ?? defaultConfig.retryDelay,
    };

    this.config = F13ConfigSchema.parse(envConfig);

    this.http = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
    });

    // Request Interceptor
    this.http.interceptors.request.use(
      (config) => {
        this.logger.debug(`F13 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`F13 API Request failed: ${error.message}`);
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.http.interceptors.response.use(
      (response) => {
        this.logger.debug(`F13 API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        this.logger.error(`F13 API Response error: ${error.message}`, {
          status: error.response?.status,
          url: error.config?.url,
        });
        return Promise.reject(
          new F13ApiError(error.response?.status || 500, error.response?.data, error.message)
        );
      }
    );
  }

  /**
   * GET Request mit Retry
   */
  async get<T = any>(url: string, config?: any): Promise<T> {
    return this.requestWithRetry<T>(() => this.http.get<T>(url, config));
  }

  /**
   * POST Request mit Retry
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithRetry<T>(() => this.http.post<T>(url, data, config));
  }

  /**
   * PUT Request mit Retry
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithRetry<T>(() => this.http.put<T>(url, data, config));
  }

  /**
   * DELETE Request mit Retry
   */
  async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.requestWithRetry<T>(() => this.http.delete<T>(url, config));
  }

  /**
   * Request mit Retry-Logik
   */
  private async requestWithRetry<T>(requestFn: () => Promise<any>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await requestFn();
        return response.data;
      } catch (error: any) {
        lastError = error;

        // Prüfe ob Retry sinnvoll ist
        if (!this.shouldRetry(error, attempt)) {
          break;
        }

        // Warte vor Retry
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt); // Exponential Backoff
          this.logger.debug(
            `Retrying request (attempt ${attempt + 1}/${this.config.retryAttempts}) after ${delay}ms`
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Prüfe ob Retry sinnvoll ist
   */
  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.config.retryAttempts) {
      return false;
    }

    // Retry bei Netzwerk-Fehlern
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    // Retry bei 5xx Fehlern
    if (error instanceof F13ApiError && error.statusCode >= 500) {
      return true;
    }

    // Retry bei 429 (Rate Limit)
    if (error instanceof F13ApiError && error.statusCode === 429) {
      return true;
    }

    return false;
  }

  /**
   * Sleep Helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health Check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // F13 Health-Check Endpoint implementiert
      await this.get('/health', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
