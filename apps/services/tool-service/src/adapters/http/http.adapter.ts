import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IToolAdapter } from '../interfaces/adapter.interface';
import { ToolExecutionRequest, ToolExecutionResult } from '../../registry/interfaces/tool.interface';

/**
 * HTTP Adapter
 * Führt HTTP-Requests aus
 */
@Injectable()
export class HttpAdapter implements IToolAdapter {
  private readonly logger = new Logger(HttpAdapter.name);

  constructor(private readonly httpService: HttpService) {}

  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      const { method, url, headers = {}, body } = request.input;

      // Input validieren
      if (!method || !url) {
        throw new Error('Method and URL are required');
      }

      // HTTP-Request ausführen
      const response = await firstValueFrom(
        this.httpService.request({
          method: method as any,
          url,
          headers,
          data: body,
          timeout: 30000,
        }),
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        },
        executionTime,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      this.logger.error(`HTTP request failed: ${error.message}`);

      return {
        success: false,
        error: error.message || 'HTTP request failed',
        executionTime,
      };
    }
  }

  async validateInput(input: Record<string, any>): Promise<boolean> {
    if (!input.method || !input.url) {
      return false;
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(input.method.toUpperCase())) {
      return false;
    }

    try {
      new URL(input.url);
      return true;
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Einfacher Health-Check
      return true;
    } catch {
      return false;
    }
  }
}


