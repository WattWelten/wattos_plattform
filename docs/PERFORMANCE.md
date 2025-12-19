# Performance-Optimierungen

## Übersicht

Die WattOS KI Plattform implementiert umfassende Performance-Optimierungen für schnelle Response-Zeiten und effiziente Ressourcennutzung.

## Caching

### Redis-basiertes Caching

Alle Services können Redis für Caching nutzen:

```typescript
import { CacheService } from '@wattweiser/shared';

constructor(private cache: CacheService) {}

async getCachedData(key: string) {
  return this.cache.getOrSet(
    CacheService.createKey('data', key),
    async () => {
      // Expensive operation
      return await this.fetchFromDatabase(key);
    },
    3600 // TTL: 1 Stunde
  );
}
```

### Cache-Strategien

1. **Cache-Aside**: Daten werden bei Bedarf geladen
2. **Write-Through**: Daten werden beim Schreiben gecacht
3. **TTL-basiert**: Automatische Expiration

### RAG Query Caching

Häufige RAG-Queries werden gecacht:

```typescript
async search(query: string, knowledgeSpaceId: string) {
  const cacheKey = CacheService.createKey('rag', knowledgeSpaceId, query);
  
  return this.cache.getOrSet(cacheKey, async () => {
    return await this.vectorStore.search(query);
  }, 1800); // 30 Minuten
}
```

## Batch-Processing

### Embedding-Batch-Processing

Mehrere Embeddings werden in einem Batch generiert:

```typescript
async generateEmbeddingsBatch(texts: string[]) {
  // Statt einzelne Requests, Batch-Request
  const response = await this.llmGateway.post('/v1/embeddings', {
    input: texts, // Array statt einzelner String
    model: 'text-embedding-3-small',
  });
  return response.data;
}
```

## Database-Optimierungen

### Connection Pooling

Prisma verwendet automatisch Connection Pooling:

```typescript
// packages/db/src/prisma.service.ts
// Singleton Pattern verhindert Connection Pool Exhaustion
```

### Indexing

Wichtige Indizes:
- `chunks.embedding` - Vector Index (pgvector)
- `users.email` - Unique Index
- `audit_logs.tenantId_createdAt` - Composite Index

### Query-Optimierung

- Nur benötigte Felder selektieren
- Pagination für große Result Sets
- Batch-Inserts statt einzelne Inserts

## Response-Streaming

### SSE (Server-Sent Events)

Chat-Responses werden gestreamt:

```typescript
// apps/services/chat-service/src/streaming/streaming.service.ts
// Token-für-Token Streaming für bessere UX
```

## Frontend-Optimierungen

### Lazy Loading

- Code-Splitting für Routes
- Lazy Loading für große Komponenten
- Image Lazy Loading

### Caching

- Service Worker für Offline-Support
- Browser-Cache für statische Assets

## Performance-Metriken

### Wichtige KPIs

- **P50 Latency**: Median Response Time
- **P95 Latency**: 95th Percentile
- **P99 Latency**: 99th Percentile
- **Throughput**: Requests pro Sekunde
- **Error Rate**: Fehlerquote

### Monitoring

Alle Performance-Metriken werden automatisch getrackt:

```typescript
this.metricsService.recordHttpRequest(method, route, statusCode, duration);
this.logger.logPerformance('operation', duration, metadata);
```

## Best Practices

1. **Caching**: Häufige Queries cachen
2. **Batch-Processing**: Mehrere Operationen zusammenfassen
3. **Connection Pooling**: DB-Connections wiederverwenden
4. **Streaming**: Große Responses streamen
5. **Monitoring**: Performance-Metriken tracken

## Optimierungs-Checkliste

- [ ] Redis Caching aktiviert
- [ ] Database Indizes vorhanden
- [ ] Connection Pooling konfiguriert
- [ ] Batch-Processing implementiert
- [ ] Response-Streaming aktiv
- [ ] Frontend Code-Splitting
- [ ] Performance-Metriken getrackt











