# KB-Sync Worker API Dokumentation

## Übersicht

Der KB-Sync Worker ist ein automatischer Worker-Service, der KB-Artikel zu F13-OS synchronisiert. Er unterstützt:

- **Event-basierte Kommunikation**: Reagiert auf KB-Artikel-Events
- **Incremental Sync**: Nur geänderte Artikel werden synchronisiert
- **Human-in-the-Loop Approval**: Optionaler Approval-Workflow
- **Cron-basierte Synchronisation**: Automatische Sync-Jobs alle 6 Stunden

---

## Architektur

### Services

1. **KBSyncWorkerService**: Orchestriert die Synchronisation
2. **ApprovalWorkflowService**: Verwaltet den Approval-Workflow
3. **IncrementalSyncService**: Optimierte Incremental Synchronisation

### Event-Flow

```
KB Article Created/Updated
  ↓
Event: knowledge.article.created/updated
  ↓
KBSyncWorkerService
  ↓
Auto-Approve? → Yes → Sync immediately
              → No  → ApprovalWorkflowService
                        ↓
                      Event: knowledge.article.approval.requested
                        ↓
                      User Approval (via Dashboard)
                        ↓
                      Event: knowledge.article.approved
                        ↓
                      Sync Article
```

---

## Konfiguration

### Environment Variables

```env
# KB Sync Worker
KB_SYNC_MAX_CONCURRENT=3          # Max. gleichzeitige Syncs pro Tenant
KB_SYNC_BATCH_SIZE=10              # Batch-Größe für Syncs
KB_SYNC_CRON_SCHEDULE="0 */6 * * *"  # Cron-Schedule (alle 6 Stunden)

# F13 Configuration
F13_BASE_URL=https://f13.example.com
F13_API_KEY=your-api-key
```

---

## Cron-Jobs

### Incremental Sync

**Schedule:** Alle 6 Stunden (`0 */6 * * *`)  
**Zeitzone:** Europe/Berlin

Synchronisiert alle aktiven Tenants mit aktiviertem KB-Sync.

---

## Event-Typen

### Subscribed Events

- `knowledge.article.created` - KB-Artikel erstellt
- `knowledge.article.updated` - KB-Artikel aktualisiert
- `knowledge.article.approved` - KB-Artikel approved

### Emitted Events

- `knowledge.sync.completed` - Sync-Job abgeschlossen
- `knowledge.article.synced` - Artikel synchronisiert
- `knowledge.article.sync.failed` - Sync fehlgeschlagen
- `knowledge.article.approval.requested` - Approval angefragt
- `knowledge.article.approved` - Artikel approved
- `knowledge.article.rejected` - Artikel rejected

---

## Approval Workflow

### Request Approval

Wenn Auto-Approve deaktiviert ist, wird für jeden neuen KB-Artikel ein Approval angefordert.

**Event:** `knowledge.article.approval.requested`

**Payload:**
```json
{
  "articleId": "uuid",
  "title": "Article Title"
}
```

### Approve Article

**Method:** `ApprovalWorkflowService.approve(tenantId, articleId, approvedBy)`

**Event:** `knowledge.article.approved`

**Payload:**
```json
{
  "articleId": "uuid",
  "approvedBy": "user-id"
}
```

### Reject Article

**Method:** `ApprovalWorkflowService.reject(tenantId, articleId, rejectedBy, reason?)`

**Event:** `knowledge.article.rejected`

**Payload:**
```json
{
  "articleId": "uuid",
  "rejectedBy": "user-id",
  "reason": "Optional reason"
}
```

### Get Pending Approvals

**Method:** `ApprovalWorkflowService.getPendingApprovals(tenantId)`

**Returns:**
```typescript
Array<{
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}>
```

---

## Incremental Sync

### Sync Logic

1. **Find Articles to Sync:**
   - Nicht synchronisiert (`f13SyncStatus: null`)
   - Pending (`f13SyncStatus: 'pending'`)
   - Error (`f13SyncStatus: 'error'`)
   - Geändert seit letztem Sync (`updatedAt > syncedAt`)

2. **Batch Processing:**
   - Batch-Größe: 10 Artikel
   - Parallelisierung: Max. 3 gleichzeitig pro Tenant

3. **Sync Process:**
   - Status → `syncing`
   - F13-OS API Call
   - Status → `synced` oder `error`

---

## Performance

### Optimierungen

- **Batch Processing**: 10 Artikel pro Batch
- **Parallelisierung**: Max. 3 gleichzeitige Syncs
- **In-Memory Filtering**: Komplexe Queries werden in-Memory gefiltert
- **Incremental Sync**: Nur geänderte Artikel werden synchronisiert

### Limits

- Max. 200 Artikel pro Query
- Max. 100 Artikel pro Sync-Job
- Max. 3 gleichzeitige Syncs pro Tenant

---

## Error Handling

### Sync Failures

Bei Sync-Fehlern:
1. Status wird auf `error` gesetzt
2. Error-Event wird emittiert
3. Retry beim nächsten Incremental Sync

### Error Events

**Event:** `knowledge.article.sync.failed`

**Payload:**
```json
{
  "articleId": "uuid",
  "error": "Error message"
}
```

---

## Monitoring

### Logs

- `KB Sync Worker started` - Worker gestartet
- `Starting incremental KB sync job` - Sync-Job gestartet
- `KB sync completed for tenant` - Sync abgeschlossen
- `KB Article synced` - Artikel synchronisiert
- `KB sync failed` - Sync fehlgeschlagen

### Metrics

- Sync-Jobs pro Tag
- Erfolgreiche Syncs
- Fehlgeschlagene Syncs
- Durchschnittliche Sync-Zeit

---

## Deployment

### Railway

```json
{
  "name": "kb-sync-worker",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd apps/workers/kb-sync-worker && pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build
CMD ["pnpm", "--filter", "@wattweiser/kb-sync-worker", "start"]
```

---

## Testing

### Unit Tests

```typescript
describe('KBSyncWorkerService', () => {
  it('should sync KB articles on event', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
describe('KB Sync Integration', () => {
  it('should sync article to F13-OS', async () => {
    // Test implementation
  });
});
```

---

## Troubleshooting

### Sync schlägt fehl

1. Prüfe F13-OS API-Konfiguration
2. Prüfe Netzwerk-Verbindung
3. Prüfe Logs für Error-Details

### Approval-Workflow funktioniert nicht

1. Prüfe ob Auto-Approve deaktiviert ist
2. Prüfe Event-Bus-Verbindung
3. Prüfe Dashboard-Integration

### Performance-Probleme

1. Reduziere `KB_SYNC_MAX_CONCURRENT`
2. Reduziere Batch-Größe
3. Prüfe Database-Performance

---

**Status:** ✅ Implementiert  
**Version:** 0.1.0  
**Letzte Aktualisierung:** 2024-12-19


