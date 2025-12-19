# Testing Guide

**Zweck:** Vollständige Anleitung für lokales Testen der WattOS Plattform

## Voraussetzungen

- Node.js >= 20.9.0
- pnpm >= 9.0.0
- PostgreSQL 15+ (mit pgvector)
- Redis 7+
- Python 3.10+ (für `ingestion-service`)

## Setup

### 1. Dependencies installieren

```bash
pnpm install
```

### 2. Environment Variables

Kopiere `.env.example` zu `.env.local` und setze die erforderlichen Werte:

```bash
cp .env.example .env.local
```

**Erforderliche Variablen:**
- `DATABASE_URL` - PostgreSQL Connection String
- `REDIS_URL` - Redis Connection String
- `JWT_SECRET` - Secret für JWT-Tokens
- `OPENAI_API_KEY` - OpenAI API Key (optional für Tests)

Siehe `docs/ENVIRONMENT_VARIABLES.md` für vollständige Liste.

### 3. Infrastructure starten

**Mit Docker Compose:**
```bash
docker-compose up -d
```

**Ohne Docker:**
- PostgreSQL auf Port 5432 starten
- Redis auf Port 6379 starten

### 4. Mock-API Server starten

```bash
pnpm mock:start
```

Der Mock-Server läuft auf `http://localhost:4001` und simuliert:
- Chat API
- TTS API
- Session API
- Tool Config API
- Conversations API

## Test-Suites

### Unit Tests

```bash
pnpm test:unit
```

**Framework:** Vitest (Frontend), Jest (Backend)

**Bereiche:**
- Core-Utils (Parser, Mappings, Reducer)
- Hooks (React Hooks)
- Services (Cache, Metrics, Circuit Breaker)
- Avatar Morph-Handler

**Coverage:**
```bash
pnpm coverage
```

### Integration Tests

```bash
pnpm test:integration
```

**Voraussetzung:** Mock-API Server muss laufen (`pnpm mock:start`)

**Bereiche:**
- REST-API Endpoints (Chat, TTS, Conversations)
- Environment Variable Validation
- Service Health Checks

### Contract Tests

```bash
pnpm test:contract
```

**Zweck:** OpenAPI Schema Conformance

**Bereiche:**
- API Request/Response Schemas
- Type Generation aus OpenAPI Specs

### E2E Tests (Playwright)

```bash
pnpm test:e2e
```

**Voraussetzung:** Frontend muss laufen (`pnpm dev` im `apps/web` Verzeichnis)

**Bereiche:**
- Homepage Load (9:16 Layout)
- A11y-Header Sichtbarkeit
- Chat Send & Receive (Mock-Antwort)
- Avatar-Lab: Viseme-Buttons (MBP/FV/TH/AA)

**Screenshots & Traces:**
- Screenshots: `apps/web/test-results/`
- Traces: `apps/web/playwright-report/`

**UI-Modus:**
```bash
cd apps/web
pnpm test:e2e:ui
```

**Headed-Modus:**
```bash
cd apps/web
pnpm test:e2e:headed
```

### Performance Tests

```bash
pnpm test:perf
```

**Framework:** Autocannon

**Zweck:** API Load-Tests (Chat Endpoint)

**Konfiguration:**
- Dauer: 20s
- Concurrency: 20
- Endpoint: `http://localhost:4001/api/v1/chat`

## Alle Tests ausführen

```bash
# Alle Tests (Unit + Integration + Contract + E2E)
pnpm test

# Mit Coverage
pnpm coverage
```

## Lokale Entwicklung mit Tests

### 1. Alle Services starten

```bash
# Mock-API + alle Services parallel
pnpm dev:all
```

### 2. Tests in Watch-Modus

```bash
# Unit Tests (Watch)
cd apps/web
pnpm test:unit --watch

# E2E Tests (UI)
cd apps/web
pnpm test:e2e:ui
```

## Test-Struktur

```
D:\WattOS_Plattform\
├── scripts/
│   ├── mock-api.ts          # Mock-API Server
│   └── test-integration.ts  # Integration Tests
├── apps/
│   └── web/
│       ├── e2e/              # E2E Tests (Playwright)
│       ├── src/
│       │   └── __tests__/    # Unit Tests
│       └── vitest.config.ts  # Vitest Config
├── reports/
│   ├── service-matrix.md     # Service-Übersicht
│   └── test-summary.md       # Test-Zusammenfassung
└── docs/
    └── TESTING.md            # Diese Datei
```

## Mock-API Endpoints

**Base URL:** `http://localhost:4001`

### Chat
- `POST /api/v1/chat` - Chat mit Lipsync-Timeline

### Conversations
- `POST /api/v1/conversations` - Conversation erstellen
- `GET /api/v1/conversations/:threadId` - Conversation abrufen
- `POST /api/v1/conversations/message` - Message senden

### TTS
- `POST /api/v1/tts` - TTS Audio generieren

### Tools
- `GET /api/v1/tools/search_tool_config` - Tool Config abrufen

### Health
- `GET /health` - Health Check

## Troubleshooting

### Mock-API startet nicht

```bash
# Prüfe ob Port 4001 frei ist
netstat -ano | findstr :4001

# Installiere Dependencies
pnpm install
```

### E2E Tests schlagen fehl

```bash
# Installiere Playwright Browser
cd apps/web
npx playwright install

# Prüfe ob Frontend läuft
curl http://localhost:3000
```

### Integration Tests schlagen fehl

```bash
# Prüfe ob Mock-API läuft
curl http://localhost:4001/health

# Starte Mock-API
pnpm mock:start
```

### Python Service Linting

Der `ingestion-service` benötigt `ruff` (Python Linter):

```bash
# Installiere ruff
pip install ruff

# Oder skip lint für Python-Service
# (wird in CI/CD automatisch gehandhabt)
```

## CI/CD Integration

Tests werden automatisch in GitHub Actions ausgeführt:

```yaml
# .github/workflows/ci.yml
- name: Run Tests
  run: |
    pnpm test:unit
    pnpm test:integration
    pnpm test:e2e
```

## Best Practices

1. **Mock-API verwenden:** Für externe Dependencies immer Mock-API nutzen
2. **Isolation:** Jeder Test sollte unabhängig sein
3. **Cleanup:** Nach jedem Test aufräumen (DB, Redis, etc.)
4. **Coverage:** Ziel: 80% Statements, 70% Branches, 70% Functions
5. **Performance:** Performance-Tests regelmäßig ausführen

## Weitere Ressourcen

- [Service Matrix](../reports/service-matrix.md)
- [Test Summary](../reports/test-summary.md)
- [Architecture](../docs/ARCHITECTURE.md)
- [Environment Variables](../docs/ENVIRONMENT_VARIABLES.md)

