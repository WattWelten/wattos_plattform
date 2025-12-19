# F13 Integration Dokumentation

## Übersicht

F13 (Land Baden-Württemberg) ist ein **optionales Gov-Backend-Add-on** für WattOS V2. Es wird nur aktiviert, wenn ein öffentlicher Auftraggeber dies explizit verlangt.

## Architektur

### F13 als Provider-Add-on

F13 wird als Provider-Adapter integriert, nicht als Kernbestandteil:

```
packages/addons/f13/
  ├── client.ts              # F13 HTTP-Client
  ├── providers/
  │   ├── llm.provider.ts    # F13 LLM-Adapter
  │   ├── rag.provider.ts    # F13 RAG-Adapter
  │   ├── parser.provider.ts # F13 Parser-Adapter
  │   └── summarize.provider.ts # F13 Summary-Adapter
  └── config.ts              # F13-spezifische Config
```

### Aktivierung

F13 wird nur aktiviert, wenn:
- `market: "gov"` im Tenant-Profile
- `mode: "gov-f13"` im Tenant-Profile
- F13-Credentials konfiguriert sind

## F13 Client

### Konfiguration

**Umgebungsvariablen**:
- `F13_BASE_URL` - F13 API Base URL
- `F13_API_KEY` - F13 API Key (optional)
- `F13_TIMEOUT` - Request Timeout (default: 30000ms)
- `F13_RETRY_ATTEMPTS` - Retry-Versuche (default: 3)
- `F13_RETRY_DELAY` - Retry-Delay (default: 1000ms)

### Features

- **Robustes Error-Handling**: F13ApiError mit Status-Code
- **Retry-Logik**: Exponential Backoff bei transienten Fehlern
- **Timeout-Management**: Konfigurierbare Timeouts
- **Request/Response Logging**: Detailliertes Logging für Debugging

## F13 Provider

### 1. LLM Provider

**Endpoint**: `/chat/completions`

**Features**:
- Chat Completion
- Streaming Chat Completion
- Model-Auswahl
- Temperature & Max-Tokens

**Verwendung**:
```typescript
const response = await f13LLMProvider.chatCompletion(messages, {
  model: 'f13-default',
  temperature: 0.7,
  maxTokens: 2000,
});
```

### 2. RAG Provider

**Endpoint**: `/rag/search`

**Features**:
- Semantische Suche
- Knowledge-Space-Filter
- Metadaten-Filter
- Top-K Results

**Verwendung**:
```typescript
const response = await f13RAGProvider.search(query, {
  tenantId: '...',
  knowledgeSpaceId: '...',
  topK: 5,
});
```

### 3. Parser Provider

**Endpoint**: `/parser/parse`

**Features**:
- Dokumenten-Parsing
- Chunking
- Metadaten-Extraktion
- Multi-Format-Support

**Verwendung**:
```typescript
const parsed = await f13ParserProvider.parseDocument(documentUrl, {
  chunkSize: 1000,
  chunkOverlap: 200,
  extractMetadata: true,
});
```

### 4. Summary Provider

**Endpoint**: `/summary/summarize`

**Features**:
- Text-Zusammenfassung
- Multi-Text-Zusammenfassung
- Style-Auswahl (concise, detailed, bullet-points)
- Language-Support

**Verwendung**:
```typescript
const summary = await f13SummaryProvider.summarize(text, {
  maxLength: 200,
  minLength: 50,
  language: 'de',
  style: 'concise',
});
```

## Provider-Factory Integration

### Tenant-basiertes Routing

```typescript
// Provider wird basierend auf Tenant-Profile geladen
const profile = await profileService.getProfile(tenantId);

if (profile.mode === 'gov-f13' && profile.providers.rag === 'f13') {
  // F13 Provider registrieren
  ragService.registerProvider('f13', f13RAGProvider);
} else {
  // WattWeiser Provider verwenden
  ragService.registerProvider('wattweiser', wattweiserRAGProvider);
}
```

### Fallback-Logik

Bei F13-Fehlern wird automatisch auf WattWeiser-Provider zurückgegriffen:

```typescript
try {
  const response = await f13Provider.search(query, context);
  return response;
} catch (error) {
  logger.warn('F13 provider failed, falling back to WattWeiser');
  return await wattweiserProvider.search(query, context);
}
```

## Datenbank-Integration

F13-Provider-Konfiguration wird im Tenant-Profile gespeichert:

```prisma
model TenantProfile {
  // ...
  providers Json // { llm: "f13", rag: "f13", ... }
  mode     String // "gov-f13"
}
```

## Health Checks

Alle F13-Provider unterstützen Health-Checks:

```typescript
const isHealthy = await f13Client.healthCheck();
if (!isHealthy) {
  // Fallback zu WattWeiser
}
```

## Error-Handling

### F13ApiError

```typescript
try {
  await f13Client.get('/endpoint');
} catch (error) {
  if (error instanceof F13ApiError) {
    logger.error(`F13 API error: ${error.statusCode}`, error.response);
    // Fallback-Logik
  }
}
```

### Retry-Strategie

- **Transiente Fehler**: Automatischer Retry mit Exponential Backoff
- **5xx Fehler**: Retry
- **429 Rate Limit**: Retry mit Backoff
- **4xx Fehler**: Kein Retry (Client-Fehler)

## Best Practices

### 1. Lazy Loading

F13-Provider werden nur geladen, wenn benötigt:

```typescript
if (profile.mode === 'gov-f13') {
  // F13 Module dynamisch importieren
  const f13Module = await import('@wattweiser/f13');
}
```

### 2. Fallback-Strategie

Immer Fallback zu WattWeiser-Provider:

```typescript
const provider = profile.providers.rag === 'f13' ? f13Provider : wattweiserProvider;
try {
  return await provider.search(query, context);
} catch (error) {
  // Fallback
  return await wattweiserProvider.search(query, context);
}
```

### 3. Monitoring

F13-Provider-Health wird kontinuierlich überwacht:

```typescript
setInterval(async () => {
  const health = await f13Client.healthCheck();
  metrics.recordF13Health(health);
}, 60000); // Alle 60 Sekunden
```

## Weiterführende Dokumentation

- [Core Platform Dokumentation](./WATTOS_V2_CORE_PLATFORM.md)
- [Profile-System](./PROFILE_SYSTEM.md)
- [F13 Client](../packages/addons/f13/src/client.ts)
- [F13 Providers](../packages/addons/f13/src/providers/)

