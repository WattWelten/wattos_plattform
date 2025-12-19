import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service Discovery Service
 * 
 * Abstrahiert Service Discovery für verschiedene Deployment-Plattformen:
 * - Railway: Nutzt ENV-Variablen (CHAT_SERVICE_URL, etc.)
 * - Kubernetes: Nutzt DNS-basierte URLs (http://chat-service:3006)
 * - Lokal: localhost Fallbacks
 * 
 * Diese Abstraktion ermöglicht einfache Migration von Railway zu Kubernetes,
 * ohne Code in allen Services ändern zu müssen.
 */
@Injectable()
export class ServiceDiscoveryService {
  private platform: 'railway' | 'kubernetes' | 'local';
  private readonly urlCache: Map<string, string> = new Map();
  private readonly cacheMaxAge = 60000; // 1 Minute
  private readonly cacheTimestamps: Map<string, number> = new Map();

  constructor(private configService: ConfigService) {
    this.platform = this.detectPlatform();
  }

  /**
   * Ermittelt die Service-URL für einen gegebenen Service
   * 
   * @param serviceName - Name des Services (z.B. 'chat-service', 'llm-gateway')
   * @param port - Port des Services (z.B. 3006, 3009)
   * @returns Service-URL
   * 
   * @example
   * // Railway: process.env.CHAT_SERVICE_URL oder http://localhost:3006
   * // Kubernetes: http://chat-service:3006
   * // Lokal: http://localhost:3006
   */
  getServiceUrl(serviceName: string, port: number): string {
    const cacheKey = `${serviceName}:${port}`;
    const now = Date.now();

    // Prüfe Cache
    const cachedUrl = this.urlCache.get(cacheKey);
    const cacheTimestamp = this.cacheTimestamps.get(cacheKey);
    if (cachedUrl && cacheTimestamp && (now - cacheTimestamp) < this.cacheMaxAge) {
      return cachedUrl;
    }

    let url: string;

    // Kubernetes: DNS-basierte URLs
    if (this.platform === 'kubernetes') {
      // Kubernetes Service-Namen sind normalerweise ohne Suffix
      const k8sServiceName = serviceName.replace(/-service$/, '').replace(/-gateway$/, '');
      url = `http://${k8sServiceName}:${port}`;
    }
    // Railway: ENV-Variablen
    else if (this.platform === 'railway') {
      // Versuche verschiedene ENV-Variable-Formate
      const envVarFormats = [
        `${serviceName.toUpperCase().replace(/-/g, '_')}_URL`,
        `${serviceName.toUpperCase().replace(/-/g, '_')}_SERVICE_URL`,
        serviceName
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join('') + 'ServiceUrl',
      ];

      for (const envVar of envVarFormats) {
        const foundUrl = this.configService.get<string>(envVar);
        if (foundUrl) {
          url = foundUrl;
          break;
        }
      }

      // Fallback: Prüfe auch direkte ENV-Variablen
      if (!url) {
        url = process.env[envVarFormats[0]] || process.env[envVarFormats[1]] || undefined;
      }
    }

    // Lokal: localhost Fallback
    if (!url) {
      url = `http://localhost:${port}`;
    }

    // Cache speichern
    this.urlCache.set(cacheKey, url as string);
    this.cacheTimestamps.set(cacheKey, now);

    return url;
  }

  /**
   * Cache leeren (für Testing oder nach Konfigurationsänderungen)
   */
  clearCache(): void {
    this.urlCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Ermittelt die aktuelle Deployment-Plattform
   * 
   * @returns 'railway' | 'kubernetes' | 'local'
   */
  private detectPlatform(): 'railway' | 'kubernetes' | 'local' {
    // Explizite Konfiguration hat höchste Priorität
    const platform = this.configService.get<string>('DEPLOYMENT_PLATFORM');
    if (platform === 'kubernetes' || platform === 'k8s') {
      return 'kubernetes';
    }
    if (platform === 'railway') {
      return 'railway';
    }

    // Auto-Detection basierend auf Environment-Variablen
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_NAME) {
      return 'railway';
    }

    if (
      process.env.KUBERNETES_SERVICE_HOST ||
      process.env.KUBERNETES_SERVICE_PORT ||
      process.env.KUBERNETES_PORT
    ) {
      return 'kubernetes';
    }

    // Default: Lokal
    return 'local';
  }

  /**
   * Gibt die aktuelle Plattform zurück (für Debugging)
   */
  getPlatform(): 'railway' | 'kubernetes' | 'local' {
    return this.platform;
  }

  /**
   * Prüft, ob Service Discovery für eine bestimmte Plattform konfiguriert ist
   */
  isPlatform(platform: 'railway' | 'kubernetes' | 'local'): boolean {
    return this.platform === platform;
  }
}


