# Service Discovery Dokumentation

## Übersicht

Die WattOS KI Plattform verwendet eine zentrale Service Discovery Abstraktion, die es ermöglicht, nahtlos zwischen verschiedenen Deployment-Plattformen (Railway, Kubernetes, lokal) zu wechseln, ohne Code in allen Services ändern zu müssen.

## ServiceDiscoveryService

### Konzept

Der `ServiceDiscoveryService` abstrahiert die Service-URL-Auflösung für verschiedene Deployment-Plattformen:

- **Railway**: Nutzt ENV-Variablen (z.B. `CHAT_SERVICE_URL`, `LLM_GATEWAY_URL`)
- **Kubernetes**: Nutzt DNS-basierte URLs (z.B. `http://chat-service:3006`)
- **Lokal**: Fallback auf `http://localhost:{port}`

### Auto-Detection

Die Plattform wird automatisch erkannt basierend auf:

1. **Explizite Konfiguration**: `DEPLOYMENT_PLATFORM=railway|kubernetes|local`
2. **Railway**: `RAILWAY_ENVIRONMENT` oder `RAILWAY_SERVICE_NAME` vorhanden
3. **Kubernetes**: `KUBERNETES_SERVICE_HOST` oder `KUBERNETES_PORT` vorhanden
4. **Default**: Lokal

### Verwendung

```typescript
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class MyService {
  constructor(
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}

  async callOtherService() {
    // Service-URL automatisch auflösen
    const chatServiceUrl = this.serviceDiscovery.getServiceUrl('chat-service', 3006);
    
    // Service aufrufen
    const response = await this.httpService.get(`${chatServiceUrl}/health`);
  }
}
```

### Service-Namen Mapping

Die Service-Namen folgen einem konsistenten Schema:

- `chat-service` → Port 3006
- `rag-service` → Port 3007
- `agent-service` → Port 3008
- `llm-gateway` → Port 3009
- `tool-service` → Port 3005
- `customer-intelligence-service` → Port 3014
- `crawler-service` → Port 3015
- `voice-service` → Port 3016
- `avatar-service` → Port 3009
- `admin-service` → Port 3008
- `character-service` → Port 3013
- `ingestion-service` → Port 8001

## Integration in Services

### 1. ServiceDiscoveryModule importieren

```typescript
import { ServiceDiscoveryModule } from '@wattweiser/shared';

@Module({
  imports: [
    ServiceDiscoveryModule, // Globales Modul, einmal importieren
    // ... andere Module
  ],
})
export class AppModule {}
```

### 2. ServiceDiscoveryService injizieren

```typescript
import { ServiceDiscoveryService } from '@wattweiser/shared';

@Injectable()
export class MyService {
  constructor(
    private readonly serviceDiscovery: ServiceDiscoveryService,
  ) {}
}
```

### 3. Service-URLs verwenden

```typescript
// Vorher (hardcoded)
const llmGatewayUrl = this.configService.get<string>('LLM_GATEWAY_URL', 'http://localhost:3009');

// Nachher (Service Discovery)
const llmGatewayUrl = this.serviceDiscovery.getServiceUrl('llm-gateway', 3009);
```

## Railway Deployment

### ENV-Variablen Setup

Auf Railway müssen die Service-URLs als ENV-Variablen gesetzt werden:

```bash
# Für jeden Service
CHAT_SERVICE_URL=https://chat-service-production.up.railway.app
RAG_SERVICE_URL=https://rag-service-production.up.railway.app
LLM_GATEWAY_URL=https://llm-gateway-production.up.railway.app
# ... etc.
```

### Automatische Synchronisation

Das Script `scripts/sync-service-urls.sh` synchronisiert automatisch Service-URLs:

```bash
./scripts/sync-service-urls.sh production
```

## Kubernetes Deployment

### Service Discovery

In Kubernetes werden Service-URLs automatisch über DNS aufgelöst:

```typescript
// Kubernetes: http://chat-service:3006
// Railway: https://chat-service-production.up.railway.app
// Lokal: http://localhost:3006
```

### Service-Namen

Kubernetes Service-Namen entsprechen den Service-Namen ohne Suffix:

- `chat-service` → `http://chat-service:3006`
- `llm-gateway` → `http://llm-gateway:3009`

## Migration von Railway zu Kubernetes

### Schritt 1: Service Discovery integrieren

Alle Services müssen `ServiceDiscoveryService` verwenden statt direkter ENV-Variablen.

### Schritt 2: Plattform-Konfiguration

```bash
# Railway
DEPLOYMENT_PLATFORM=railway

# Kubernetes
DEPLOYMENT_PLATFORM=kubernetes
```

### Schritt 3: Service-URLs entfernen

ENV-Variablen für Service-URLs können entfernt werden, da Service Discovery diese automatisch auflöst.

## Vorteile

1. **Plattform-Abstraktion**: Einfacher Wechsel zwischen Railway und Kubernetes
2. **Konsistenz**: Einheitliche Service-URL-Auflösung in allen Services
3. **Wartbarkeit**: Zentrale Logik für Service Discovery
4. **Flexibilität**: Unterstützung für verschiedene Deployment-Strategien

## Best Practices

1. **Service-Namen konsistent verwenden**: Immer den vollständigen Service-Namen verwenden (z.B. `chat-service`, nicht `chat`)
2. **Ports dokumentieren**: Ports sollten in der Dokumentation und im Code konsistent sein
3. **Fallbacks**: Service Discovery hat immer einen Fallback auf `localhost` für lokale Entwicklung
4. **Testing**: Lokale Tests funktionieren automatisch ohne zusätzliche Konfiguration

## Troubleshooting

### Service-URL wird nicht gefunden

1. Prüfe, ob `ServiceDiscoveryModule` importiert wurde
2. Prüfe, ob `DEPLOYMENT_PLATFORM` korrekt gesetzt ist
3. Prüfe ENV-Variablen auf Railway (für Railway-Deployment)
4. Prüfe Kubernetes Service-Namen (für Kubernetes-Deployment)

### Falsche Service-URL

1. Prüfe Service-Namen (muss exakt übereinstimmen)
2. Prüfe Port-Nummer
3. Prüfe Plattform-Erkennung: `serviceDiscovery.getPlatform()`

## Weitere Informationen

- [Railway Deployment Guide](DEPLOYMENT_RAILWAY.md)
- [Kubernetes Migration Guide](MIGRATION_RAILWAY_TO_OTC.md) (in Arbeit)










