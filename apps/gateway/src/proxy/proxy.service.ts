import { Injectable } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServiceDiscoveryService } from '@wattweiser/shared';

/**
 * Service-Name zu Service-Name + Port Mapping
 * Key: Route-Name (wie in URL verwendet)
 * Value: [Service-Name für Service Discovery, Port]
 */
const SERVICE_MAPPING: Record<string, [string, number]> = {
  chat: ['chat-service', 3006],
  rag: ['rag-service', 3007],
  agent: ['agent-service', 3008],
  tool: ['tool-service', 3005],
  summary: ['summary-service', 3006],
  feedback: ['feedback-service', 3007],
  admin: ['admin-service', 3008],
  avatar: ['avatar-service', 3009],
  metaverse: ['metaverse-service', 3010],
  ingestion: ['ingestion-service', 8001],
  parsing: ['parsing-service', 3012],
  character: ['character-service', 3013],
  'customer-intelligence': ['customer-intelligence-service', 3014],
  crawler: ['crawler-service', 3015],
  voice: ['voice-service', 3016],
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

  getProxyMiddleware(serviceName: string) {
    const target = this.serviceUrls.get(serviceName);
    if (!target) {
      throw new Error(`Service ${serviceName} not found`);
    }

    return createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^/api/${serviceName}`]: '',
      },
      onProxyReq: (proxyReq, req: any) => {
        // Forward user info to downstream services
        if (req.user) {
          proxyReq.setHeader('X-User-Id', req.user.id);
          proxyReq.setHeader('X-User-Email', req.user.email);
          proxyReq.setHeader('X-Tenant-Id', req.user.tenantId || '');
        }
      },
    });
  }
}


