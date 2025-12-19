# Resilience & Error Handling

## Übersicht

Die WattOS KI Plattform implementiert umfassende Resilience-Patterns für robuste Fehlerbehandlung und Service-Stabilität.

## Circuit Breaker

### Implementierung

Der Circuit Breaker verhindert, dass fehlerhafte Services überlastet werden:

```typescript
import { CircuitBreakerService } from '@wattweiser/shared';

constructor(private circuitBreaker: CircuitBreakerService) {}

async callLlmGateway(request: any) {
  return this.circuitBreaker.execute('llm-gateway', async () => {
    return this.httpService.post('/v1/chat/completions', request);
  }, {
    failureThreshold: 5, // 5 Fehler bevor Circuit öffnet
    resetTimeout: 60000, // 60s bis Retry
  });
}
```

### Circuit States

- **CLOSED**: Normal operation
- **OPEN**: Circuit offen, Requests werden abgelehnt
- **HALF_OPEN**: Test-Phase nach Timeout

### Konfiguration

```env
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=60000
CIRCUIT_BREAKER_MONITORING_PERIOD=60000
```

## Retry-Strategien

### Exponential Backoff

Automatische Retries mit Exponential Backoff:

```typescript
import { RetryService } from '@wattweiser/shared';

constructor(private retryService: RetryService) {}

async fetchData() {
  return this.retryService.executeWithRetry(async () => {
    return this.httpService.get('/api/data');
  }, {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: (error) => {
      // Nur bei 5xx Errors retry
      return error?.response?.status >= 500;
    },
  });
}
```

### Retry + Circuit Breaker

Kombination für maximale Resilienz:

```typescript
async callService() {
  return this.retryService.executeWithRetryAndCircuitBreaker(
    this.circuitBreaker,
    'service-name',
    async () => this.httpService.get('/api/data'),
    { maxAttempts: 3 }
  );
}
```

### Konfiguration

```env
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY=1000
RETRY_MAX_DELAY=30000
RETRY_BACKOFF_MULTIPLIER=2
```

## Graceful Degradation

### RAG Service Fallback

Wenn Vector Store nicht verfügbar ist, fällt RAG auf einfache Text-Suche zurück:

```typescript
async search(query: string) {
  try {
    return await this.vectorStore.search(query);
  } catch (error) {
    this.logger.warn('Vector store unavailable, falling back to text search');
    return await this.textSearch(query); // Fallback
  }
}
```

### LLM Gateway Fallback

Automatischer Provider-Wechsel bei Ausfällen:

```typescript
// Bereits implementiert in llm.service.ts
// Versucht Provider in Priority-Order
const providers = ['openai', 'azure', 'anthropic', 'google', 'ollama'];
```

## Error Handling

### Global Exception Filter

Alle Services verwenden einen globalen Exception Filter:

```typescript
// packages/shared/src/filters/http-exception.filter.ts
// Standardisiertes Error-Format für alle Services
```

### Error Response Format

```json
{
  "statusCode": 500,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/chat",
  "method": "POST",
  "message": "Internal server error",
  "error": "Error details (nur in Development)"
}
```

## Best Practices

1. **Circuit Breaker**: Für alle externen Service-Calls
2. **Retry**: Bei transienten Fehlern (Network, 5xx)
3. **Timeout**: Alle externen Calls haben Timeout
4. **Fallback**: Graceful Degradation wo möglich
5. **Monitoring**: Circuit Breaker Status tracken

## Monitoring

### Circuit Breaker Metrics

- Circuit State Changes
- Failure Count
- Success Rate nach Recovery

### Retry Metrics

- Retry Count
- Success Rate nach Retry
- Average Retry Attempts











