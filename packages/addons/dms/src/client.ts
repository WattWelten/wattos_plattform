import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { DMSConfig, DMSConfigSchema, getDefaultDMSConfig } from './config';

/**
 * DMS API Error
 */
export class DMSApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly response: any,
    message?: string,
  ) {
    super(message || `DMS API error: ${statusCode}`);
    this.name = 'DMSApiError';
  }
}

/**
 * DMS Document
 */
export interface DMSDocument {
  id: string;
  title: string;
  content?: string;
  contentUrl?: string;
  mimeType: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
  tags?: string[];
}

/**
 * DMS Folder
 */
export interface DMSFolder {
  id: string;
  name: string;
  parentId?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * DMS HTTP Client
 * 
 * Robuster HTTP-Client für DMS API mit Retry-Logik und Error-Handling
 */
@Injectable()
export class DMSClient {
  private readonly logger = new Logger(DMSClient.name);
  private readonly http: AxiosInstance;
  private readonly config: DMSConfig;

  constructor(private readonly configService: ConfigService) {
    const defaultConfig = getDefaultDMSConfig();
    const envConfig = {
      baseUrl: this.configService.get<string>('DMS_BASE_URL') || defaultConfig.baseUrl,
      apiKey: this.configService.get<string>('DMS_API_KEY') || defaultConfig.apiKey,
      apiSecret: this.configService.get<string>('DMS_API_SECRET') || defaultConfig.apiSecret,
      timeout: this.configService.get<number>('DMS_TIMEOUT') ?? defaultConfig.timeout,
      retryAttempts: this.configService.get<number>('DMS_RETRY_ATTEMPTS') ?? defaultConfig.retryAttempts,
      retryDelay: this.configService.get<number>('DMS_RETRY_DELAY') ?? defaultConfig.retryDelay,
      syncInterval: this.configService.get<number>('DMS_SYNC_INTERVAL') ?? defaultConfig.syncInterval,
      batchSize: this.configService.get<number>('DMS_BATCH_SIZE') ?? defaultConfig.batchSize,
    };

    this.config = DMSConfigSchema.parse(envConfig);

    this.http = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
        ...(this.config.apiSecret && { 'X-API-Secret': this.config.apiSecret }),
      },
    });

    // Request Interceptor
    this.http.interceptors.request.use(
      (config) => {
        this.logger.debug(`DMS API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`DMS API Request failed: ${error.message}`);
        return Promise.reject(error);
      },
    );

    // Response Interceptor
    this.http.interceptors.response.use(
      (response) => {
        this.logger.debug(`DMS API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        this.logger.error(`DMS API Response error: ${error.message}`, {
          status: error.response?.status,
          url: error.config?.url,
        });
        return Promise.reject(
          new DMSApiError(
            error.response?.status || 500,
            error.response?.data,
            error.message,
          ),
        );
      },
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
          this.logger.debug(`Retrying request (attempt ${attempt + 1}/${this.config.retryAttempts}) after ${delay}ms`);
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
    if (error instanceof DMSApiError && error.statusCode >= 500) {
      return true;
    }

    // Retry bei 429 (Rate Limit)
    if (error instanceof DMSApiError && error.statusCode === 429) {
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
   * 
   * @note Prüft die Verfügbarkeit der DMS API über den /health Endpoint
   * 
   * @returns {Promise<boolean>} true wenn DMS API erreichbar ist, sonst false
   */
  async healthCheck(): Promise<boolean> {
    try {
      // TODO: DMS Health-Check Endpoint implementieren
      // Der Endpoint sollte folgende Informationen zurückgeben:
      // - API Version
      // - Service Status
      // - Verfügbare Features
      await this.get('/health', { timeout: 5000 });
      return true;
    } catch (error: any) {
      this.logger.debug(`DMS health check failed: ${error.message}`);
      return false;
    }
  }
}

