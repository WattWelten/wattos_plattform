# Dashboard Service API Dokumentation

## Übersicht

Der Dashboard Service stellt Analytics, Metrics und Dashboard-Management-Funktionalität bereit. Er unterstützt:

- **Dashboard-Management**: CRUD-Operationen für Dashboards
- **Analytics**: KPIs, Trends, Conversation-Analytics
- **Metrics**: System-, Performance- und Business-Metrics
- **Caching**: Performance-Optimierung durch Caching

---

## Architektur

### Services

1. **DashboardService**: Verwaltet Dashboard-Konfigurationen
2. **DashboardDataAggregationService**: Aggregiert Daten für Widgets
3. **AnalyticsService**: Berechnet Analytics-Daten
4. **KPICalculationService**: Berechnet Key Performance Indicators
5. **TrendAnalysisService**: Analysiert Trends über Zeiträume
6. **MetricsService**: Sammelt System-Metrics

### Widget-Typen

- `overview` - Übersicht mit Key-Metriken
- `conversations` - Conversation-Liste
- `agents` - Agent-Status
- `analytics` - Analytics-Daten
- `metrics` - System-Metrics
- `kb-sync` - KB-Sync-Status

---

## API Endpoints

### Dashboard Management

#### GET `/api/v1/dashboards/:dashboardId?`

Dashboard abrufen.

**Query Parameters:**
- `tenantId` (required) - Tenant-ID

**Path Parameters:**
- `dashboardId` (optional) - Dashboard-ID (wenn nicht angegeben, wird Default-Dashboard geladen)

**Response:**
```json
{
  "id": "uuid",
  "name": "Dashboard Name",
  "layout": {
    "widgets": [...]
  },
  "widgets": {
    "overview": {...},
    "conversations": {...}
  },
  "updatedAt": "2024-12-19T..."
}
```

#### GET `/api/v1/dashboards`

Alle Dashboards für Tenant auflisten.

**Query Parameters:**
- `tenantId` (required) - Tenant-ID

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Dashboard Name",
    "isDefault": true,
    "createdAt": "2024-12-19T..."
  }
]
```

#### POST `/api/v1/dashboards`

Dashboard erstellen.

**Query Parameters:**
- `tenantId` (required) - Tenant-ID

**Body:**
```json
{
  "name": "My Dashboard",
  "layout": {
    "widgets": [
      {
        "id": "overview",
        "type": "overview",
        "position": { "x": 0, "y": 0, "w": 12, "h": 4 }
      }
    ]
  },
  "isDefault": false
}
```

#### PUT `/api/v1/dashboards/:dashboardId`

Dashboard aktualisieren.

**Query Parameters:**
- `tenantId` (required) - Tenant-ID

**Path Parameters:**
- `dashboardId` (required) - Dashboard-ID

**Body:**
```json
{
  "name": "Updated Name",
  "layout": {...},
  "isDefault": true
}
```

#### DELETE `/api/v1/dashboards/:dashboardId`

Dashboard löschen.

**Query Parameters:**
- `tenantId` (required) - Tenant-ID

**Path Parameters:**
- `dashboardId` (required) - Dashboard-ID

---

### Analytics

#### GET `/api/v1/analytics`

Analytics-Daten abrufen.

**Query Parameters:**
- `tenantId` (required) - Tenant-ID
- `timeRange` (optional) - Zeitraum (`1h`, `24h`, `7d`, `30d`, `90d`) - Default: `7d`
- `metrics` (optional) - Komma-separierte Liste von Metriken

**Response:**
```json
{
  "timeRange": "7d",
  "conversations": {
    "total": 150,
    "active": 10,
    "completed": 140,
    "avgMessages": 5.2
  },
  "agents": {
    "total": 5,
    "active": 4,
    "inactive": 1
  },
  "kpis": {
    "totalConversations": 150,
    "completedConversations": 140,
    "completionRate": 93.33,
    "avgResponseTime": 0,
    "userSatisfaction": 0,
    "kbSyncRate": 85.5
  },
  "trends": {
    "conversations": {
      "data": [...],
      "trend": "up"
    },
    "agents": {...},
    "kbArticles": {...}
  }
}
```

---

### Metrics

#### GET `/api/v1/metrics`

Metrics abrufen.

**Query Parameters:**
- `tenantId` (required) - Tenant-ID
- `types` (optional) - Komma-separierte Liste (`system`, `performance`, `business`, `all`) - Default: `all`
- `timeRange` (optional) - Zeitraum (`5m`, `15m`, `1h`, `24h`, `7d`) - Default: `1h`

**Response:**
```json
{
  "tenantId": "uuid",
  "timeRange": "1h",
  "metrics": {
    "system": {
      "cpu": 0,
      "memory": 0,
      "disk": 0,
      "network": 0
    },
    "performance": {
      "avgResponseTime": 0,
      "throughput": 0,
      "errorRate": 0
    },
    "business": {
      "conversations": 10,
      "agents": 5,
      "kbArticles": 20
    }
  },
  "generatedAt": "2024-12-19T..."
}
```

---

## Caching

### Cache-Strategie

- **Dashboard-Daten**: 5 Minuten TTL
- **Analytics-Daten**: 5 Minuten TTL
- **Metrics-Daten**: 1 Minute TTL

### Cache-Invalidierung

- Dashboard erstellt/aktualisiert/gelöscht → Cache invalidiert
- Automatische TTL-basierte Invalidierung

---

## Performance

### Optimierungen

- **Caching**: Alle Daten werden gecacht
- **Parallelisierung**: Widget-Daten werden parallel aggregiert
- **Batch-Queries**: Mehrere Queries werden parallel ausgeführt

### Limits

- Max. 100 Widgets pro Dashboard
- Max. 90 Tage Zeitraum für Analytics
- Cache-TTL: 1-5 Minuten

---

## Widget-Konfiguration

### Overview Widget

```json
{
  "id": "overview",
  "type": "overview",
  "position": { "x": 0, "y": 0, "w": 12, "h": 4 }
}
```

**Daten:**
- Total Conversations
- Total Agents
- Total KB Articles
- KB Sync Status

### Conversations Widget

```json
{
  "id": "conversations",
  "type": "conversations",
  "position": { "x": 0, "y": 4, "w": 6, "h": 4 },
  "config": {
    "limit": 10,
    "timeRange": "7d"
  }
}
```

### Analytics Widget

```json
{
  "id": "analytics",
  "type": "analytics",
  "position": { "x": 6, "y": 4, "w": 6, "h": 4 },
  "config": {
    "timeRange": "7d",
    "metrics": ["conversations", "agents"]
  }
}
```

---

## KPIs

### Berechnete KPIs

1. **Total Conversations** - Gesamtanzahl Conversations
2. **Completed Conversations** - Abgeschlossene Conversations
3. **Completion Rate** - Prozentsatz abgeschlossener Conversations
4. **Average Response Time** - Durchschnittliche Antwortzeit (MVP: Placeholder)
5. **User Satisfaction** - Nutzerzufriedenheit (MVP: Placeholder)
6. **KB Sync Rate** - Prozentsatz synchronisierter KB-Artikel

---

## Trends

### Trend-Analyse

- **Up** - Steigender Trend (>10% Anstieg)
- **Down** - Fallender Trend (>10% Rückgang)
- **Stable** - Stabiler Trend (±10%)

### Unterstützte Trends

- Conversation-Trend
- Agent-Trend
- KB-Article-Trend

---

## Deployment

### Railway

```json
{
  "name": "dashboard-service",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd apps/services/dashboard-service && pnpm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Environment Variables

```env
PORT=3008
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

---

## Testing

### Unit Tests

```typescript
describe('DashboardService', () => {
  it('should create dashboard', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
describe('Dashboard Integration', () => {
  it('should aggregate widget data', async () => {
    // Test implementation
  });
});
```

---

## Troubleshooting

### Cache-Probleme

1. Prüfe Redis-Verbindung
2. Prüfe Cache-TTL-Konfiguration
3. Cache manuell invalidieren

### Performance-Probleme

1. Reduziere Anzahl Widgets
2. Erhöhe Cache-TTL
3. Prüfe Database-Performance

---

**Status:** ✅ Implementiert  
**Version:** 0.1.0  
**Letzte Aktualisierung:** 2024-12-19


