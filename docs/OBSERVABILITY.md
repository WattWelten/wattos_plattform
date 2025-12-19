# Observability & Monitoring

## Übersicht

Die WattOS KI Plattform implementiert umfassende Observability-Features für Production-Ready Monitoring, Logging und Metrics.

## Structured Logging

### Pino-basiertes Logging

Alle Services verwenden strukturiertes JSON-Logging mit Pino:

```typescript
import { StructuredLoggerService } from '@wattweiser/shared';

constructor(private logger: StructuredLoggerService) {
  this.logger.setContext('MyService');
}

// Strukturiertes Logging
this.logger.logWithMetadata('info', 'User logged in', {
  userId: user.id,
  tenantId: user.tenantId,
  ipAddress: request.ip,
});

// Performance-Logging
this.logger.logPerformance('database_query', duration, {
  query: 'SELECT * FROM users',
  rows: 100,
});
```

### Log-Levels

- **error**: Kritische Fehler
- **warn**: Warnungen
- **info**: Informative Nachrichten
- **debug**: Debug-Informationen (nur in Development)
- **verbose**: Detaillierte Traces

### Log-Format

In Production wird JSON-Format verwendet:
```json
{
  "level": "INFO",
  "time": "2024-01-15T10:30:00.000Z",
  "context": "AuthService",
  "message": "User logged in",
  "userId": "123",
  "tenantId": "tenant-1"
}
```

## Metrics

### Prometheus-kompatible Metriken

Der Metrics Service sammelt automatisch Metriken:

```typescript
import { MetricsService } from '@wattweiser/shared';

// HTTP Request Metrik
this.metricsService.recordHttpRequest('POST', '/api/chat', 200, 150);

// LLM Call Metrik
this.metricsService.recordLlmCall('openai', 'gpt-4', 1000, 0.03, 2000);

// Database Query Metrik
this.metricsService.recordDbQuery('SELECT', 50, true);

// Cache Metrik
this.metricsService.recordCacheOperation('hit', 'user:123');
```

### Verfügbare Metriken

- `http_requests_total` - HTTP Request Counter
- `http_request_duration_ms` - Request Latency Histogram
- `llm_calls_total` - LLM API Calls
- `llm_tokens_total` - Token Usage
- `llm_cost_usd` - Kosten in USD
- `db_queries_total` - Database Queries
- `db_query_duration_ms` - Query Latency
- `cache_operations_total` - Cache Hits/Misses

### Metrics Endpoint

Alle Services exportieren Metriken unter `/health/metrics`:

```bash
curl http://localhost:3001/health/metrics
```

## Health Checks

### Endpunkte

- **`GET /health/liveness`** - Liveness Probe (Service läuft)
- **`GET /health/readiness`** - Readiness Probe (Service bereit)
- **`GET /health`** - Vollständiger Health Check

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 5
    },
    "redis": {
      "status": "up",
      "responseTime": 2
    },
    "llm_gateway": {
      "status": "up",
      "responseTime": 10
    }
  }
}
```

### Status-Werte

- **healthy**: Alle Checks erfolgreich
- **degraded**: Einige non-kritische Services down
- **unhealthy**: Kritische Services down

## Distributed Tracing

### OpenTelemetry (Geplant)

Für Production wird OpenTelemetry für Distributed Tracing empfohlen:

```typescript
// TODO: OpenTelemetry Integration
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('wattos-ki');
const span = tracer.startSpan('llm_call');
// ... operation
span.end();
```

## Best Practices

1. **Strukturiertes Logging**: Immer Metadaten mitgeben
2. **Performance-Logging**: Langsame Operationen tracken
3. **Error Context**: Fehler mit vollständigem Context loggen
4. **Metrics**: Alle wichtigen Operationen metrifizieren
5. **Health Checks**: Regelmäßig prüfen

## Monitoring Setup

### Prometheus

```yaml
scrape_configs:
  - job_name: 'wattos-ki'
    static_configs:
      - targets: ['gateway:3001', 'chat-service:3006']
    metrics_path: '/health/metrics'
```

### Grafana Dashboards

Empfohlene Dashboards:
- Request Rate & Latency
- Error Rate
- LLM Cost Tracking
- Database Performance
- Cache Hit Rate

## Alerting

Empfohlene Alerts:
- Error Rate > 5%
- P95 Latency > 1s
- Health Check Failures
- LLM Cost Spike
- Database Connection Failures











