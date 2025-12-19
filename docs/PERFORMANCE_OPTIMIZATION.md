# Performance-Optimierung

## Übersicht

Die WattOS Plattform implementiert umfassende Performance-Optimierungen für schnelle Response-Zeiten, hohe Skalierbarkeit und effiziente Ressourcennutzung.

## Caching-Strategien

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
4. **In-Memory Fallback**: Falls Redis nicht verfügbar

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

### Character/Persona/Agent Caching

Frequently accessed character configurations:

```typescript
async getCharacter(characterId: string) {
  return this.cache.getOrSet(
    CacheService.createKey('character', characterId),
    async () => await this.prisma.character.findUnique({ where: { id: characterId } }),
    3600 // 1 Stunde
  );
}
```

## Database-Indexing

### Wichtige Indizes

Das Prisma Schema enthält umfassende Indizes für optimale Query-Performance:

- **Multi-Tenant Indizes**: `tenantId` auf allen relevanten Tabellen
- **Composite Indizes**: `[tenantId, status]`, `[tenantId, createdAt]`
- **Foreign Key Indizes**: Alle Relations sind indexiert
- **Vector Index**: `chunks.embedding` für pgvector (via Migration)
- **Unique Constraints**: `email`, `slug`, etc.

### Query-Optimierung

- **Connection Pooling**: Prisma verwendet automatisch Connection Pooling
- **Batch Operations**: Mehrere Queries in einem Batch
- **Selective Fields**: Nur benötigte Felder abrufen

## Performance-Monitoring

### Performance Service

Der `PerformanceService` ermöglicht Performance-Monitoring:

```typescript
import { PerformanceService } from '@wattweiser/shared';

constructor(private performance: PerformanceService) {}

async expensiveOperation() {
  const start = performance.now();
  try {
    const result = await this.doWork();
    this.performance.recordMetric('expensive-operation', performance.now() - start);
    return result;
  } catch (error) {
    this.performance.recordMetric('expensive-operation-error', performance.now() - start);
    throw error;
  }
}
```

### Performance-Decorator

```typescript
import { PerformanceService } from '@wattweiser/shared';

class MyService {
  @PerformanceService.measure
  async myMethod() {
    // Automatisches Performance-Tracking
  }
}
```

## Load-Testing

### Load-Test Script

Ein TypeScript-basiertes Load-Test-Script ist verfügbar:

```bash
# Load-Test ausführen
LOAD_TEST_BASE_URL=http://localhost:3000 \
LOAD_TEST_CONCURRENT_USERS=10 \
LOAD_TEST_REQUESTS_PER_USER=10 \
ts-node scripts/load-test.ts
```

### Load-Test Features

- **Concurrent Users**: Simuliert mehrere gleichzeitige Benutzer
- **Request-Per-User**: Anzahl der Requests pro Benutzer
- **Multiple Endpoints**: Testet mehrere Endpoints gleichzeitig
- **Statistics**: P50, P95, P99 Percentile, Durchschnitt, Min/Max
- **Success Rate**: Erfolgsrate der Requests
- **Throughput**: Requests pro Sekunde

### Load-Test Ergebnisse

Das Script generiert einen detaillierten Report:

```
📊 Load Test Results:
Total Requests: 300
Successful: 295
Failed: 5
Success Rate: 98.33%

⏱️  Response Times:
Average: 125.50ms
Min: 45.20ms
Max: 450.30ms
P50: 110.00ms
P95: 250.00ms
P99: 380.00ms

📈 Throughput: 15.00 requests/second
```

## CDN-Integration

### Statische Assets

Für Production-Deployments sollten statische Assets über ein CDN ausgeliefert werden:

1. **Next.js Static Assets**: Automatisch über Vercel CDN
2. **Avatar Models**: GLTF/GLB Dateien über CDN
3. **Media Files**: Bilder, Videos über CDN

### CDN-Konfiguration

```typescript
// next.config.js
module.exports = {
  assetPrefix: process.env.CDN_URL || '',
  images: {
    domains: ['cdn.example.com'],
  },
};
```

### Cache-Headers

Für optimale CDN-Performance:

```typescript
// API Routes
res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
```

## Profiling

### Node.js Profiling

```bash
# CPU Profiling
node --cpu-prof app.js

# Memory Profiling
node --heap-prof app.js

# Chrome DevTools Profiling
node --inspect app.js
```

### Database Profiling

Prisma Query Logging:

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Performance-Analyse

1. **Slow Query Logging**: Identifiziere langsame Queries
2. **Connection Pool Monitoring**: Überwache Connection Pool Usage
3. **Cache Hit Rate**: Überwache Cache-Effektivität

## Best Practices

### 1. Caching

- **Cache häufig abgerufene Daten**: Character, Persona, Agent Configs
- **TTL anpassen**: Kurze TTL für volatile Daten, lange TTL für statische Daten
- **Cache-Invalidation**: Bei Updates Cache invalidierten

### 2. Database

- **Indizes verwenden**: Alle häufig abgerufenen Felder indexieren
- **Batch Operations**: Mehrere Queries in einem Batch
- **Selective Fields**: Nur benötigte Felder abrufen

### 3. API

- **Pagination**: Große Datensätze paginieren
- **Rate Limiting**: API-Rate-Limiting implementieren
- **Compression**: Gzip/Brotli Compression aktivieren

### 4. Frontend

- **Code Splitting**: Lazy Loading für große Komponenten
- **Image Optimization**: Next.js Image Optimization nutzen
- **CDN**: Statische Assets über CDN ausliefern

## Monitoring

### Metrics

- **Response Times**: P50, P95, P99 Percentile
- **Throughput**: Requests pro Sekunde
- **Error Rate**: Fehlerrate
- **Cache Hit Rate**: Cache-Effektivität

### Alerts

- **High Response Time**: P95 > 1s
- **High Error Rate**: > 5%
- **Low Cache Hit Rate**: < 70%
- **Database Connection Pool Exhaustion**

## Performance-Benchmarks

### Ziel-Metriken

- **API Response Time**: P95 < 500ms
- **Database Query Time**: P95 < 100ms
- **Cache Hit Rate**: > 80%
- **Throughput**: > 100 requests/second

### Load-Test Szenarien

1. **Normal Load**: 10 concurrent users, 10 requests/user
2. **High Load**: 50 concurrent users, 20 requests/user
3. **Peak Load**: 100 concurrent users, 50 requests/user

## Weitere Optimierungen

### 1. Database Connection Pooling

Prisma verwendet automatisch Connection Pooling. Pool-Größe anpassen:

```env
DATABASE_URL=postgresql://user:password@host:5432/db?connection_limit=20
```

### 2. Redis Connection Pooling

Redis Client verwendet automatisch Connection Pooling.

### 3. Batch Processing

Für große Datenmengen:

```typescript
// Statt einzelne Requests
for (const item of items) {
  await processItem(item);
}

// Batch Processing
await Promise.all(items.map(item => processItem(item)));
```

### 4. Lazy Loading

Frontend-Komponenten lazy laden:

```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## Zusammenfassung

Die WattOS Plattform implementiert umfassende Performance-Optimierungen:

- ✅ Redis-basiertes Caching mit In-Memory Fallback
- ✅ Umfassende Database-Indizes
- ✅ Performance-Monitoring Service
- ✅ Load-Testing Scripts
- ✅ CDN-Integration (Dokumentation)
- ✅ Profiling-Tools
- ✅ Best Practices und Monitoring

Diese Optimierungen gewährleisten schnelle Response-Zeiten, hohe Skalierbarkeit und effiziente Ressourcennutzung.


