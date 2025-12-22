import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DMSClient, DMSApiError } from '../client';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('DMSClient', () => {
  let dmsClient: DMSClient;
  let mockConfigService: ConfigService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Mock ConfigService
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          DMS_BASE_URL: 'https://dms.example.com/api',
          DMS_API_KEY: 'test-api-key',
          DMS_API_SECRET: 'test-api-secret',
          DMS_TIMEOUT: 30000,
          DMS_RETRY_ATTEMPTS: 3,
          DMS_RETRY_DELAY: 1000,
        };
        return config[key] ?? defaultValue;
      }),
    } as any;

    // Mock Axios Instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

    dmsClient = new DMSClient(mockConfigService);
  });

  describe('constructor', () => {
    it('should create axios instance with correct base URL', () => {
      expect(axios.create).toHaveBeenCalled();
      const callArgs = vi.mocked(axios.create).mock.calls[0][0];
      expect(callArgs.baseURL).toBe('https://dms.example.com/api');
    });

    it('should set timeout from config', () => {
      const callArgs = vi.mocked(axios.create).mock.calls[0][0];
      expect(callArgs.timeout).toBe(30000);
    });

    it('should set API headers when credentials are provided', () => {
      const callArgs = vi.mocked(axios.create).mock.calls[0][0];
      expect(callArgs.headers['X-API-Key']).toBe('test-api-key');
      expect(callArgs.headers['X-API-Secret']).toBe('test-api-secret');
    });
  });

  describe('get', () => {
    it('should make GET request and return data', async () => {
      const mockData = { id: 'doc-1', title: 'Test Document' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await (dmsClient as any).get('/documents');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/documents', undefined);
      expect(result).toEqual(mockData);
    });

    it('should handle errors and throw DMSApiError', async () => {
      const axiosError = {
        response: {
          status: 404,
          data: { error: 'Not found' },
        },
        message: 'Request failed',
        config: { url: '/documents' },
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect((dmsClient as any).get('/documents')).rejects.toThrow();
    });
  });

  describe('post', () => {
    it('should make POST request and return data', async () => {
      const mockData = { id: 'doc-2', title: 'New Document' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockData });

      const result = await (dmsClient as any).post('/documents', { title: 'New Document' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/documents', { title: 'New Document' }, undefined);
      expect(result).toEqual(mockData);
    });
  });

  describe('healthCheck', () => {
    it('should return true when health check succeeds', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'ok' } });

      const result = await dmsClient.healthCheck();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', { timeout: 5000 });
    });

    it('should return false when health check fails', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      const result = await dmsClient.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('DMSApiError', () => {
    it('should create error with status code and response', () => {
      const error = new DMSApiError(404, { error: 'Not found' }, 'Custom message');

      expect(error.statusCode).toBe(404);
      expect(error.response).toEqual({ error: 'Not found' });
      expect(error.message).toBe('Custom message');
      expect(error.name).toBe('DMSApiError');
    });

    it('should use default message when not provided', () => {
      const error = new DMSApiError(500, { error: 'Server error' });

      expect(error.message).toBe('DMS API error: 500');
    });
  });
});






