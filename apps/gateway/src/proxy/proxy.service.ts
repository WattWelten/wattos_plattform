import { Injectable } from '@nestjs/common';
import { RequestHandler } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { ServiceDiscoveryService } from '@wattweiser/shared';

/**
 * Service-Name zu Service-Name + Port Mapping
 * Key: Route-Name (wie in URL verwendet)
 * Value: [Service-Name für Service Discovery, Port]
 */
const SERVICE_MAPPING: Record<string, [string, number]> = {
  chat: ['chat-service', 3006],
  rag: ['rag-service', 3005],
  agent: ['agent-service', 3003],
  tool: ['tool-service', 3004],
  summary: ['summary-service', 3018],
  feedback: ['feedback-service', 3010],
  admin: ['admin-service', 3007],
  avatar: ['avatar-service', 3009],
  video: ['video-service', 3017],
  metaverse: ['metaverse-service', 3012],
  ingestion: ['ingestion-service', 8001],
  parsing: ['parsing-service', 3012],
  character: ['character-service', 3013],
  'customer-intelligence': ['customer-intelligence-service', 3014],
  crawler: ['crawler-service', 3015],
  voice: ['voice-service', 3016],
  dashboard: ['dashboard-service', 3011],
  analytics: ['dashboard-service', 3011], // Alias für analytics routes
};

@Injectable()
export class ProxyService {
  private serviceUrls: Map<string, string>;

  constructor(private serviceDiscovery: ServiceDiscoveryService) {
    // Initialisiere Service URLs über Service Discovery
    this.serviceUrls = new Map();
    for (const [routeName, [serviceName, port]] of Object.entries(SERVICE_MAPPING)) {
      this.serviceUrls.set(routeName, this.serviceDiscovery.getServiceUrl(serviceName, port));
    }
  }

  getProxyMiddleware(serviceName: string): RequestHandler {
    const target = this.serviceUrls.get(serviceName);
    if (!target) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // Path-Rewrite-Logik: /api/{serviceName}/* -> /{serviceName}/*
    // Ausnahmen: admin -> '', analytics -> /analytics, dashboard -> /dashboard, character -> /v1/characters
    let pathRewrite: Record<string, string>;
    if (serviceName === 'admin') {
      pathRewrite = { [`^/api/${serviceName}`]: '' };
    } else if (serviceName === 'analytics') {
      pathRewrite = { [`^/api/analytics`]: '/analytics' };
    } else if (serviceName === 'dashboard') {
      pathRewrite = { [`^/api/dashboard`]: '/dashboard' };
    } else if (serviceName === 'character') {
      // Character-Service: /api/v1/characters/* -> /v1/characters/*
      pathRewrite = { [`^/api/v1/characters`]: '/v1/characters', [`^/api/v1/artifacts`]: '/v1/artifacts' };
    } else if (serviceName === 'agent') {
      // Agent-Service: /api/agents/* -> /agents/*, /api/v1/agents/* -> /v1/agents/*
      pathRewrite = { 
        [`^/api/agents`]: '/agents',
        [`^/api/v1/agents`]: '/v1/agents'
      };
    } else if (serviceName === 'avatar') {
      // Avatar-Service: /api/v1/avatars/* -> /api/v1/avatars/*
      pathRewrite = { [`^/api/v1/avatars`]: '/api/v1/avatars' };
    } else if (serviceName === 'video') {
      // Video-Service: /api/v1/videos/* -> /api/v1/videos/*
      pathRewrite = { [`^/api/v1/videos`]: '/api/v1/videos' };
    } else {
      pathRewrite = { [`^/api/${serviceName}`]: `/${serviceName}` };
    }

    const options: Options = {
      target,
      changeOrigin: true,
      pathRewrite,
      onProxyReq: (proxyReq: any, req: any) => {
        // Forward user info to downstream services
        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user.id);
          proxyReq.setHeader('X-User-Email', req.user.email || '');
          // Tenant-ID aus Request-Context (von TenantMiddleware gesetzt) hat Priorität
          const tenantId = (req as any).tenantId || req.user.tenantId || '';
          proxyReq.setHeader('X-Tenant-Id', tenantId);
        }
        // Forward tenantId auch wenn kein user vorhanden (für interne Services)
        if ((req as any).tenantId && !req.user) {
          proxyReq.setHeader('X-Tenant-Id', (req as any).tenantId);
        }
      },
    };

    return createProxyMiddleware(options);
  }
}
