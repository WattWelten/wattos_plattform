# Nächste Schritte - MVP Kaya Dashboard Suite

## ✅ Bereits implementiert

- [x] Packages: `ui`, `config`, `characters`, `metrics`
- [x] Datenmodell erweitert (Source, Crawl, Event, Config, Index)
- [x] Migration erstellt
- [x] Apps: `customer-portal` und `console` mit allen Seiten
- [x] Backend-API: MVP-Endpoints im Admin-Service
- [x] Apple Design System & WattWeiser Branding
- [x] Viseme-Heatmap & No-Code Form Builder

## 🔧 Sofortige nächste Schritte

### 1. Dependencies installieren & Type-Checking ✅
```bash
pnpm install
pnpm type-check
```
**Status**: Dependencies installiert, Type-Checking Scripts hinzugefügt

### 2. Database Migration ausführen ✅
```bash
cd packages/db
npx prisma@6 migrate dev --name add_mvp_models
# Oder manuell:
psql $DATABASE_URL -f migrations/20250122000000_add_mvp_models/migration.sql
```
**Status**: Migration SQL erstellt, siehe `MIGRATION_NOTES.md` für Details
**Hinweis**: Prisma 7 Kompatibilität beachten - verwende `prisma@6` für Migration

### 3. Gateway-Routing prüfen ✅
- ✅ Gateway hat bereits `/admin/*` Routing → `/api/admin/metrics` sollte funktionieren
- ✅ Path-Rewrite korrigiert: `/api/admin/metrics` → `/admin/metrics` im Admin-Service
- Prüfen: `apps/gateway/src/proxy/proxy.controller.ts` Zeile 55-60

### 4. Admin-Service starten & testen
```bash
cd apps/services/admin-service
pnpm dev
# Test: curl http://localhost:3008/admin/metrics?tenantId=demo-tenant
```

### 5. Frontend-Apps starten ✅
```bash
# Customer Portal
cd apps/customer-portal
cp .env.local.example .env.local  # Falls nicht vorhanden
pnpm dev  # Port 3002

# Console
cd apps/console
cp .env.local.example .env.local  # Falls nicht vorhanden
pnpm dev  # Port 3003
```
**Status**: `.env.local.example` Dateien erstellt für beide Apps

## 🐛 Bekannte Probleme & Fixes

### Problem 1: PrismaClient Import
- **Datei**: `apps/services/admin-service/src/mvp/mvp.service.ts`
- **Status**: ✅ Behoben - verwendet jetzt `PrismaClient` direkt

### Problem 2: Tenant-ID aus Request
- **Datei**: `apps/services/admin-service/src/mvp/mvp.controller.ts`
- **Status**: ✅ Verwendet `@Tenant()` Decorator

### Problem 3: API-Client Base URL
- **Datei**: `apps/customer-portal/src/lib/api.ts`
- **Fix**: Umgebungsvariable `NEXT_PUBLIC_API_URL` setzen oder `.env.local` erstellen

## 📋 Weitere Implementierungen

### Phase 4: Integration & Testing

#### 4.1 Backend-Integration vervollständigen
- [x] Event-Service für `/log` Endpoint (Metrics SDK)
- [x] SSE-Endpoint für Live-Conversations (`/admin/conversations/stream`)
- [x] Crawler-Service Integration für `/admin/crawls/trigger`
- [x] RAG-Service Integration für Search-Metriken
- [x] Tenant-Config Validierung mit Zod

#### 4.2 Frontend-Verbesserungen
- [x] Auth-Integration für beide Apps (Customer Portal & Console)
- [x] Tenant-ID aus Auth-Context extrahieren
- [x] Error-Handling & Loading States
- [x] SSE für Live-Conversations
- [x] TTS-Probe Audio-Playback implementieren

#### 4.3 Testing
- [x] Vitest: Utils, Components (`packages/ui`, `packages/config`)
- [x] Playwright: Smoke-Tests (Login, Overview, Settings)
- [ ] E2E: No-Code Form → Config speichern → Apply

#### 4.4 A11y (WCAG AA)
- [x] ARIA-Labels für alle interaktiven Elemente
- [x] Keyboard-Navigation (Tab, Enter, Escape)
- [x] Contrast AA prüfen (Primary-500, Error-500, etc.)
- [x] Skip-Links und Focus-Styles
- [ ] Screen-Reader-Tests mit NVDA/JAWS

## 🎨 UI/UX Verbesserungen

### Charts & Visualisierungen
- [ ] Recharts/ECharts Integration für Overview-Zeitserien
- [ ] Viseme-Heatmap mit besserer Visualisierung
- [ ] Lipsync-Jitter Chart (µ/σ als Histogramm)

### No-Code Form Builder
- [ ] JSON Preview mit Syntax-Highlighting (react-syntax-highlighter)
- [ ] Dry-Run Endpoint implementieren
- [ ] Validierungs-Feedback verbessern
- [ ] Form-Felder für alle Config-Optionen

### Conversations Page
- [x] TanStack Table mit Filtering & Sorting
- [x] Replay-View mit Message-Timeline
- [x] SSE für Live-Updates

## 🔐 Security & Compliance

- [ ] Zod-Guards für alle API-Endpoints
- [ ] XSS-Schutz für JSON-Preview
- [ ] Tenant-Isolation prüfen (keine Cross-Tenant-Zugriffe)
- [ ] Rate-Limiting für Admin-Endpoints

## 📊 Monitoring & Observability

- [ ] Metrics-Event Ingestion (`/log` Endpoint)
- [ ] Dashboard-Metriken aus Events berechnen
- [ ] Error-Tracking (Sentry/LogRocket)

## 🚀 Deployment-Vorbereitung

- [ ] Environment-Variablen dokumentieren
- [ ] Docker-Compose für lokale Entwicklung
- [ ] CI/CD Pipeline erweitern (Build customer-portal, console)
- [ ] Production-Builds testen

## 📝 Dokumentation

- [ ] API-Dokumentation (Swagger/OpenAPI)
- [ ] Frontend-Komponenten Storybook
- [ ] Deployment-Guide
- [ ] User-Guide für No-Code Config

## 🎯 Prioritäten für MVP-Release

1. **Kritisch** (vor Live-Release):
   - Database Migration ausführen
   - Auth-Integration
   - Tenant-ID Handling
   - Error-Handling

2. **Wichtig** (für Beta):
   - Testing (Smoke-Tests)
   - A11y-Basics
   - Charts funktionsfähig

3. **Nice-to-have** (Post-MVP):
   - Erweiterte Visualisierungen
   - Performance-Optimierungen
   - Erweiterte Tests
