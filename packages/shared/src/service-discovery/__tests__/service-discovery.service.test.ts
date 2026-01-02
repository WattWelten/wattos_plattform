import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ServiceDiscoveryService } from '../service-discovery.service';
import { ConfigService } from '@nestjs/config';

describe('ServiceDiscoveryService', () => {
  let serviceDiscovery: ServiceDiscoveryService;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    // Reset environment
    delete process.env.DEPLOYMENT_PLATFORM;
    delete process.env.CHAT_SERVICE_URL;
    delete process.env.CHAT_SERVICE_SERVICE_URL;

    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        return process.env[key] ?? defaultValue;
      }),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('platform detection', () => {
    it('should detect railway platform from DEPLOYMENT_PLATFORM', () => {
      process.env.DEPLOYMENT_PLATFORM = 'railway';
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('chat-service', 3006);
      expect(url).toContain('localhost'); // Fallback
    });

    it('should detect kubernetes platform', () => {
      process.env.DEPLOYMENT_PLATFORM = 'kubernetes';
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('chat-service', 3006);
      expect(url).toBe('http://chat:3006');
    });

    it('should default to local platform', () => {
      delete process.env.DEPLOYMENT_PLATFORM;
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('chat-service', 3006);
      expect(url).toBe('http://localhost:3006');
    });
  });

  describe('getServiceUrl - Railway', () => {
    beforeEach(() => {
      process.env.DEPLOYMENT_PLATFORM = 'railway';
    });

    it('should use CHAT_SERVICE_URL from environment', () => {
      process.env.CHAT_SERVICE_URL = 'https://chat-service.up.railway.app';
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('chat-service', 3006);

      expect(url).toBe('https://chat-service.up.railway.app');
    });

    it('should use CHAT_SERVICE_SERVICE_URL as fallback', () => {
      process.env.CHAT_SERVICE_SERVICE_URL = 'https://chat-service-2.up.railway.app';
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('chat-service', 3006);

      expect(url).toBe('https://chat-service-2.up.railway.app');
    });

    it('should fallback to localhost if no env var found', () => {
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('chat-service', 3006);

      expect(url).toBe('http://localhost:3006');
    });
  });

  describe('getServiceUrl - Kubernetes', () => {
    beforeEach(() => {
      process.env.DEPLOYMENT_PLATFORM = 'kubernetes';
    });

    it('should generate DNS-based URL for service', () => {
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('chat-service', 3006);

      expect(url).toBe('http://chat:3006');
    });

    it('should remove -service suffix', () => {
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('rag-service', 3007);

      expect(url).toBe('http://rag:3007');
    });

    it('should remove -gateway suffix', () => {
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('llm-gateway', 3009);

      expect(url).toBe('http://llm:3009');
    });
  });

  describe('getServiceUrl - Local', () => {
    it('should use localhost for local platform', () => {
      delete process.env.DEPLOYMENT_PLATFORM;
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url = serviceDiscovery.getServiceUrl('chat-service', 3006);

      expect(url).toBe('http://localhost:3006');
    });
  });

  describe('caching', () => {
    it('should cache service URLs', () => {
      process.env.CHAT_SERVICE_URL = 'https://chat-service.up.railway.app';
      process.env.DEPLOYMENT_PLATFORM = 'railway';
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const url1 = serviceDiscovery.getServiceUrl('chat-service', 3006);
      const url2 = serviceDiscovery.getServiceUrl('chat-service', 3006);

      expect(url1).toBe(url2);
      expect(mockConfigService.get).toHaveBeenCalledTimes(1); // Cached
    });

    it('should cache different services separately', () => {
      process.env.DEPLOYMENT_PLATFORM = 'railway';
      process.env.CHAT_SERVICE_URL = 'https://chat.up.railway.app';
      process.env.RAG_SERVICE_URL = 'https://rag.up.railway.app';
      serviceDiscovery = new ServiceDiscoveryService(mockConfigService);

      const chatUrl = serviceDiscovery.getServiceUrl('chat-service', 3006);
      const ragUrl = serviceDiscovery.getServiceUrl('rag-service', 3007);

      expect(chatUrl).toBe('https://chat.up.railway.app');
      expect(ragUrl).toBe('https://rag.up.railway.app');
    });
  });
});







