# WattOS Plattform MVP Setup Guide

## Übersicht

Dieser Guide beschreibt die Einrichtung der WattOS Plattform MVP für die Test-Server-Präsentation.

## Voraussetzungen

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL 15+ (mit pgvector Extension)
- Redis 7+
- Docker (optional)

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/WattWelten/wattos_plattform.git
cd wattos_plattform
```

### 2. Dependencies installieren

```bash
pnpm install
```

### 3. Environment Variables konfigurieren

```bash
cp .env.example .env
```

Wichtige Variablen:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/wattos_plattform
REDIS_URL=redis://localhost:6379
LLM_GATEWAY_URL=http://localhost:3009
```

### 4. Database Setup

```bash
# Migrationen ausführen
pnpm db:migrate

# Prisma Client generieren
pnpm db:generate
```

## Services starten

### Core Services

```bash
# LLM Gateway
cd apps/services/llm-gateway
pnpm dev

# Character Service
cd apps/services/character-service
pnpm dev

# Crawler Scheduler Worker
cd apps/workers/crawler-scheduler
pnpm dev
```

### Generator Services

```bash
# Persona Generator
cd apps/services/persona-generator-service
pnpm dev

# Agent Generator
cd apps/services/agent-generator-service
pnpm dev
```

## Workflow: Character → Personas → Agents

### 1. Character definieren

```bash
curl -X POST http://localhost:3000/api/v1/characters/define \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-id",
    "prompt": "Du bist Kaya, die Bürgerassistenz vom Landkreis Oldenburg..."
  }'
```

### 2. Crawling starten

```bash
# Crawl Job erstellen
curl -X POST http://localhost:3015/api/v1/crawler/start \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://landkreis-oldenburg.de",
    "tenantId": "tenant-id"
  }'
```

### 3. Personas generieren

```bash
curl -X POST http://localhost:3020/api/v1/personas/generate \
  -H "Content-Type: application/json" \
  -d '{
    "characterId": "character-id",
    "maxPersonas": 10
  }'
```

### 4. Agents generieren

```bash
curl -X POST http://localhost:3021/api/v1/agents/generate \
  -H "Content-Type: application/json" \
  -d '{
    "personaIds": ["persona-id-1", "persona-id-2"]
  }'
```

## Testing

### Kritische Integration-Tests

```bash
pnpm test:integration
```

### E2E Tests

```bash
pnpm test:e2e
```

## Troubleshooting

### Database Connection Issues

```bash
# Prisma Studio öffnen
pnpm db:studio
```

### Redis Connection Issues

```bash
# Redis Status prüfen
redis-cli ping
```

## Nächste Schritte

Nach erfolgreichem Setup:
1. Avatar-Integration implementieren
2. F13-Service für Kommune/Schule
3. Dashboard & Analytics
4. Widget-System

## Support

Bei Problemen siehe:
- `docs/API_CHARACTER_SERVICE.md`
- `docs/API_CRAWLER_SCHEDULER.md`
- `docs/API_PERSONA_AGENT_GENERATOR.md`


