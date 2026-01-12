# Dashboard Service

Multi-Tenant Dashboard-Service für KPI-Analytics, Dashboards, Widgets und Reporting.

## Übersicht

Der Dashboard-Service bietet:
- **KPI-Berechnung**: 8 KPIs für ICP Kommune/Schule
- **Dashboard-Management**: Erstellen, Verwalten und Anzeigen von Dashboards
- **Widget-System**: Konfigurierbare Widgets für verschiedene Metriken
- **Analytics**: Detaillierte Analytics und Trend-Analysen
- **Reporting**: Generierung von Reports
- **Prometheus Export**: Metriken im Prometheus-Format

## Features

### KPI-Berechnung

Berechnet folgende KPIs für jeden Tenant:

1. **Anzahl beantworteter Anfragen** - Gesamtzahl der beantworteten Queries
2. **Self-Service-Quote** - Anteil der selbst gelösten Anfragen (0-1)
3. **Vollständig gelöst** - Anzahl der vollständig gelösten Anfragen
4. **Zeitersparnis (h)** - Geschätzte Zeitersparnis in Stunden
5. **FTE-Ersparnis** - Vollzeitäquivalent-Ersparnis
6. **Außerhalb Öffnungszeiten** - Prozent der Anfragen außerhalb der Bürozeiten
7. **Top-5 Themen** - Die 5 häufigsten Themen
8. **Abdeckungsgrad** - Anteil der Top-Themen mit quality>=good (0-100%)

Zusätzliche Metriken:
- **P95 Latency** - 95. Perzentil der Antwortzeit in Millisekunden
- **CSAT** - Customer Satisfaction Score (1-5)

### Performance-Optimierungen

- **Redis-Caching**: KPI-Ergebnisse werden gecacht (TTL: 5-30 Minuten je nach Range)
- **SQL Views**: Optimierte Views für KPI-Berechnungen
- **View-Fallback**: Automatischer Fallback auf direkte Queries wenn Views fehlen
- **Parallele Berechnung**: KPIs werden parallel berechnet für bessere Performance
- **Cache-Invalidierung**: Automatische Cache-Invalidierung bei Datenänderungen

## API-Endpoints

### Analytics

- `GET /analytics` - Analytics-Daten abrufen
- `GET /analytics/kpis` - KPIs abrufen
- `GET /analytics/kpis/metrics` - KPI-Metriken exportieren
- `GET /analytics/kpis/alerts` - KPI-Alerts prüfen

### Dashboard

- `GET /dashboard?dashboardId={id}` - Dashboard abrufen (optional: spezifisches Dashboard)
- `POST /dashboard` - Dashboard erstellen
- `PUT /dashboard/:dashboardId` - Dashboard aktualisieren
- `DELETE /dashboard/:dashboardId` - Dashboard löschen

### Widgets

- `GET /widgets` - Alle Widgets auflisten (optional: Filter nach type/dashboardId)
- `GET /widgets/:widgetId` - Widget abrufen
- `POST /widgets` - Widget erstellen
- `PUT /widgets/:widgetId` - Widget aktualisieren
- `DELETE /widgets/:widgetId` - Widget löschen
- `GET /widgets/dashboard/:dashboardId` - Widgets eines Dashboards abrufen
- `GET /widgets/character/:characterId` - Widgets eines Characters abrufen

### Metrics

- `GET /metrics?types={types}&timeRange={range}` - Metriken abrufen

### Reporting

- `GET /reporting?type={type}&options={json}` - Report generieren (GET)
- `POST /reporting` - Report generieren (POST)

### Prometheus

- `GET /metrics` - Prometheus-Metriken exportieren (nur ADMIN/EDITOR)

## Authentifizierung & Autorisierung

Alle Endpoints erfordern:
- **JWT-Authentifizierung**: Via Gateway oder `X-User-Id` Header
- **RBAC**: Rollenbasierte Zugriffskontrolle
  - `VIEWER`: Lesen (GET)
  - `EDITOR`: Lesen + Erstellen/Ändern (GET, POST, PUT)
  - `ADMIN`: Vollzugriff (GET, POST, PUT, DELETE)

## Tenant-Isolation

- Tenant-ID wird aus Request-Context extrahiert (nicht aus URL-Param)
- Verhindert Cross-Tenant Data Access
- Unterstützt Gateway-Routing und direkte API-Calls

## KPI-Berechnung

### Zeiträume

- `today`: Heute (00:00:00 bis jetzt)
- `7d`: Letzte 7 Tage inkl. heute (6 Tage zurück + heute)
- `30d`: Letzte 30 Tage inkl. heute (29 Tage zurück + heute)

### Cache-Strategie

- **Cache-Keys**: `kpi:{tenantId}:{range}`
- **TTL**: 
  - `today`: 5 Minuten
  - `7d`: 15 Minuten
  - `30d`: 30 Minuten
- **Invalidierung**: Automatisch bei Datenänderungen (ConversationMessage, Feedback, etc.)

### SQL Views

Der Service nutzt optimierte SQL Views für Performance:
- `vw_kpi_answered` - Beantwortete Anfragen
- `vw_kpi_self_service` - Self-Service-Quote
- `vw_kpi_after_hours` - Außerhalb Öffnungszeiten

Bei fehlenden Views fällt der Service automatisch auf direkte Queries zurück.

## Swagger-Dokumentation

Swagger/OpenAPI-Dokumentation ist verfügbar unter:
- `/api/docs` (wenn @nestjs/swagger installiert ist)

Alle Controller sind vollständig dokumentiert mit:
- Endpoint-Beschreibungen
- Request/Response-Schemas
- Beispielen
- Fehlercodes

## Umgebungsvariablen

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Redis (optional, für Caching)
REDIS_URL=redis://localhost:6379

# Service
PORT=3011
CORS_ORIGIN=http://localhost:3000

# Development
DEFAULT_TENANT_ID=optional-default-tenant-uuid
```

## Entwicklung

### Setup

```bash
# Dependencies installieren
pnpm install

# Type-Check
pnpm type-check

# Lint
pnpm lint

# Tests
pnpm test
```

### Tests

- **Unit Tests**: `pnpm test` (Jest)
- **Integration Tests**: `pnpm test:integration:tenant` (Vitest)
- **E2E Tests**: `pnpm test:e2e:kpi` (Playwright)

## Architektur

### Services

- **KpiService**: KPI-Berechnung mit Caching
- **DashboardService**: Dashboard-Management
- **WidgetService**: Widget-Management
- **AnalyticsService**: Analytics-Aggregation
- **MetricsService**: Metriken-Export
- **ReportingService**: Report-Generierung
- **KpiCacheService**: Cache-Invalidierung
- **KpiEventHandlerService**: Event-basierte Cache-Invalidierung
- **KpiMetricsService**: KPI-Metriken-Export
- **KpiAlertsService**: Alert-Management

### Guards & Middleware

- **JwtAuthGuard**: JWT-Authentifizierung
- **RbacGuard**: Rollenbasierte Zugriffskontrolle
- **TenantMiddleware**: Tenant-ID-Extraktion

## Performance

- **Caching**: Redis-basiertes Caching für KPIs und Dashboards
- **Parallele Berechnung**: KPIs werden parallel berechnet
- **SQL Views**: Optimierte Views für häufige Queries
- **View-Fallback**: Graceful Degradation bei fehlenden Views
- **Timeout-Handling**: 30s Timeout für Prometheus-Export pro Tenant

## Monitoring

- **Prometheus Export**: `/metrics` Endpoint für Prometheus
- **Health Checks**: `/health` Endpoint (via ObservabilityModule)
- **Structured Logging**: Alle Services verwenden StructuredLoggerService

## Sicherheit

- **Tenant-Isolation**: Tenant-ID wird aus Request-Context extrahiert
- **RBAC**: Rollenbasierte Zugriffskontrolle
- **Input-Validierung**: UUID-Validierung für Tenant-IDs
- **SQL Injection Prevention**: Parameterized Queries mit Prisma
- **Rate Limiting**: Via @nestjs/throttler (100 req/min default)

## Lizenz

Siehe Haupt-README des Projekts.
