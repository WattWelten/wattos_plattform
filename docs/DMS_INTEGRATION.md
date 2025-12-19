# DMS Integration Dokumentation

## Übersicht

Die DMS-Integration ermöglicht es, Dokumente aus einem externen Document Management System (DMS) in WattOS V2 Knowledge Spaces zu synchronisieren und für RAG-Suchen verfügbar zu machen.

## Architektur

### DMS als Add-on

DMS wird als optionales Add-on integriert:

```
packages/addons/dms/
  ├── client.ts              # DMS HTTP-Client
  ├── dms.service.ts         # DMS-Service (Sync, Import)
  └── config.ts              # DMS-spezifische Config
```

### Integration mit Knowledge Layer

```
DMS → DMS-Service → Ingestion-Service → Knowledge Space → RAG-Service
```

## DMS Client

### Konfiguration

**Umgebungsvariablen**:
- `DMS_BASE_URL` - DMS API Base URL
- `DMS_API_KEY` - DMS API Key (optional)
- `DMS_API_SECRET` - DMS API Secret (optional)
- `DMS_TIMEOUT` - Request Timeout (default: 30000ms)
- `DMS_RETRY_ATTEMPTS` - Retry-Versuche (default: 3)
- `DMS_RETRY_DELAY` - Retry-Delay (default: 1000ms)
- `DMS_SYNC_INTERVAL` - Sync-Interval (default: 3600000ms = 1h)
- `DMS_BATCH_SIZE` - Batch-Größe (default: 100)

### Features

- **Robustes Error-Handling**: DMSApiError mit Status-Code
- **Retry-Logik**: Exponential Backoff bei transienten Fehlern
- **Batch-Processing**: Effiziente Synchronisation großer Dokument-Mengen
- **Incremental Sync**: Nur geänderte Dokumente synchronisieren

## DMS Service

### Funktionen

#### 1. Dokumente abrufen

```typescript
const documents = await dmsService.getDocuments({
  folderId: 'folder-123',
  limit: 100,
  offset: 0,
  updatedSince: new Date('2024-01-01'),
});
```

#### 2. Dokument-Inhalt abrufen

```typescript
const content = await dmsService.getDocumentContent('doc-123');
// Returns: Buffer
```

#### 3. Dokumente synchronisieren

```typescript
const result = await dmsService.syncDocuments(tenantId, knowledgeSpaceId, {
  folderId: 'folder-123',
  updatedSince: new Date('2024-01-01'),
  batchSize: 100,
});

// Result:
// {
//   synced: 50,
//   failed: 2,
//   errors: [{ documentId: 'doc-1', error: '...' }]
// }
```

#### 4. Dokument importieren

```typescript
const documentId = await dmsService.importDocument(
  tenantId,
  knowledgeSpaceId,
  dmsDocument,
);
```

#### 5. Sync-Status abrufen

```typescript
const status = dmsService.getSyncStatus(tenantId);
// {
//   lastSyncAt: 1234567890,
//   documentsSynced: 50,
//   documentsFailed: 2,
//   status: 'idle' | 'syncing' | 'error',
//   error?: string
// }
```

## DMS Integration Service

### Integration mit Knowledge Layer

```typescript
// DMS zu Knowledge Space synchronisieren
const result = await dmsIntegrationService.syncDMSToKnowledgeSpace(
  tenantId,
  knowledgeSpaceId,
  {
    folderId: 'folder-123',
    updatedSince: new Date('2024-01-01'),
    autoIndex: true,
  },
);
```

### Event-basierte Kommunikation

Die DMS-Integration emittiert Events:

- `knowledge.dms.synced` - DMS-Sync abgeschlossen
- `knowledge.dms.document.imported` - Dokument importiert
- `knowledge.dms.sync.failed` - Sync fehlgeschlagen

## Synchronisations-Strategien

### 1. Vollständige Synchronisation

Alle Dokumente aus DMS synchronisieren:

```typescript
await dmsService.syncDocuments(tenantId, knowledgeSpaceId);
```

### 2. Incremental Sync

Nur geänderte Dokumente synchronisieren:

```typescript
const lastSync = new Date('2024-01-01');
await dmsService.syncDocuments(tenantId, knowledgeSpaceId, {
  updatedSince: lastSync,
});
```

### 3. Ordner-basierte Sync

Nur Dokumente aus bestimmten Ordnern:

```typescript
await dmsService.syncDocuments(tenantId, knowledgeSpaceId, {
  folderId: 'folder-123',
});
```

### 4. Automatische Sync

Periodische Synchronisation (z.B. alle 1 Stunde):

```typescript
setInterval(async () => {
  const lastSync = getLastSyncTime(tenantId);
  await dmsService.syncDocuments(tenantId, knowledgeSpaceId, {
    updatedSince: lastSync,
  });
}, 3600000); // 1 Stunde
```

## Metadaten-Mapping

DMS-Metadaten werden in Knowledge Space Metadaten gemappt:

```typescript
{
  // DMS-Metadaten
  dmsId: 'doc-123',
  dmsFolderId: 'folder-123',
  dmsTags: ['tag1', 'tag2'],
  dmsCreatedAt: '2024-01-01T00:00:00Z',
  dmsUpdatedAt: '2024-01-01T00:00:00Z',
  
  // Original DMS-Metadaten
  ...dmsDocument.metadata,
}
```

## Error-Handling

### Retry-Strategie

- **Transiente Fehler**: Automatischer Retry mit Exponential Backoff
- **5xx Fehler**: Retry
- **429 Rate Limit**: Retry mit Backoff
- **4xx Fehler**: Kein Retry (Client-Fehler)

### Fehler-Tracking

Fehler werden im Sync-Status gespeichert:

```typescript
{
  synced: 50,
  failed: 2,
  errors: [
    { documentId: 'doc-1', error: 'Invalid format' },
    { documentId: 'doc-2', error: 'Network timeout' },
  ],
}
```

## Best Practices

### 1. Incremental Sync

Immer Incremental Sync verwenden, wenn möglich:

```typescript
const lastSync = await getLastSyncTime(tenantId);
await dmsService.syncDocuments(tenantId, knowledgeSpaceId, {
  updatedSince: lastSync,
});
```

### 2. Batch-Processing

Große Dokument-Mengen in Batches verarbeiten:

```typescript
await dmsService.syncDocuments(tenantId, knowledgeSpaceId, {
  batchSize: 100, // Max. 100 Dokumente pro Batch
});
```

### 3. Error-Recovery

Fehlgeschlagene Dokumente erneut versuchen:

```typescript
const result = await dmsService.syncDocuments(tenantId, knowledgeSpaceId);
if (result.failed > 0) {
  // Retry failed documents
  for (const error of result.errors) {
    await retryDocumentImport(error.documentId);
  }
}
```

### 4. Monitoring

Sync-Status kontinuierlich überwachen:

```typescript
const status = dmsService.getSyncStatus(tenantId);
if (status.status === 'error') {
  // Alert & Retry
  await handleSyncError(tenantId, status.error);
}
```

## Weiterführende Dokumentation

- [Core Platform](./WATTOS_V2_CORE_PLATFORM.md)
- [Knowledge Layer](./packages/core/src/knowledge/)
- [DMS Client](../packages/addons/dms/src/client.ts)
- [DMS Service](../packages/addons/dms/src/dms.service.ts)

