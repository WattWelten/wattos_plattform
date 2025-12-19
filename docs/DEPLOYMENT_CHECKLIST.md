# Deployment Checklist

> **Automatisch generiert** - Diese Checkliste wird automatisch aus `scripts/services-config.json` generiert.
> **Letzte Aktualisierung:** 27.11.2025, 07:30:58
> **Umgebung:** production

## Übersicht

Diese Checkliste führt durch das vollständige Deployment der WattOS KI Plattform.
Alle Schritte müssen in der angegebenen Reihenfolge ausgeführt werden.

## Voraussetzungen

- [ ] Railway Account erstellt und eingeloggt
- [ ] Railway CLI installiert: `npm i -g @railway/cli`
- [ ] Railway Login durchgeführt: `railway login`
- [ ] Projekt verlinkt: `railway link <PROJECT_ID>`
- [ ] GitHub Secrets konfiguriert (siehe [SECRETS_SETUP.md](SECRETS_SETUP.md))

## Phase 0: Infrastructure Setup

### Infrastructure Services

- [ ] **PostgreSQL Service** erstellt: `railway add postgresql`
  - [ ] `DATABASE_URL` automatisch gesetzt (Railway)
- [ ] **Redis Service** erstellt: `railway add redis`
  - [ ] `REDIS_URL` automatisch gesetzt (Railway)

### Shared Environment Variables

- [ ] `NODE_ENV=production` gesetzt (shared)

## Phase 1: Core Services (Priority 1)

### API Gateway

- [ ] Railway Service erstellt: `railway service create api-gateway`
- [ ] Service ausgewählt: `railway service api-gateway`
- [ ] **Environment Variables:**
  - [ ] `JWT_SECRET` gesetzt: Secret für JWT-Token-Generierung
- [ ] **Infrastructure Dependencies:**
  - [ ] redis Service deployed
- [ ] Build Command validiert: `cd apps/gateway && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### LLM Gateway

- [ ] Railway Service erstellt: `railway service create llm-gateway`
- [ ] Service ausgewählt: `railway service llm-gateway`
- [ ] **Environment Variables:**
  - [ ] `OPENAI_API_KEY` gesetzt: OpenAI API Key
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
- [ ] Build Command validiert: `cd apps/services/llm-gateway && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

## Phase 2: Essential Services (Priority 2)

### Chat Service

- [ ] Railway Service erstellt: `railway service create chat-service`
- [ ] Service ausgewählt: `railway service chat-service`
- [ ] **Environment Variables:**
  - [ ] `LLM_GATEWAY_URL` gesetzt: URL des LLM Gateway Services
  - [ ] `RAG_SERVICE_URL` gesetzt: URL des RAG Services
- [ ] **Service Dependencies deployed:**
  - [ ] LLM Gateway
  - [ ] RAG Service
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
  - [ ] redis Service deployed
- [ ] Build Command validiert: `cd apps/services/chat-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### RAG Service

- [ ] Railway Service erstellt: `railway service create rag-service`
- [ ] Service ausgewählt: `railway service rag-service`
- [ ] **Environment Variables:**
  - [ ] `LLM_GATEWAY_URL` gesetzt: URL des LLM Gateway Services (für Embeddings)
- [ ] **Service Dependencies deployed:**
  - [ ] LLM Gateway
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
- [ ] Build Command validiert: `cd apps/services/rag-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Agent Service

- [ ] Railway Service erstellt: `railway service create agent-service`
- [ ] Service ausgewählt: `railway service agent-service`
- [ ] **Environment Variables:**
  - [ ] `LLM_GATEWAY_URL` gesetzt: URL des LLM Gateway Services
  - [ ] `TOOL_SERVICE_URL` gesetzt: URL des Tool Services
- [ ] **Service Dependencies deployed:**
  - [ ] LLM Gateway
  - [ ] Tool Service
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
  - [ ] redis Service deployed
- [ ] Build Command validiert: `cd apps/services/agent-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Tool Service

- [ ] Railway Service erstellt: `railway service create tool-service`
- [ ] Service ausgewählt: `railway service tool-service`
- [ ] Build Command validiert: `cd apps/services/tool-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

## Phase 3: Advanced Services (Priority 3)

### Customer Intelligence Service

- [ ] Railway Service erstellt: `railway service create customer-intelligence-service`
- [ ] Service ausgewählt: `railway service customer-intelligence-service`
- [ ] **Environment Variables:**
  - [ ] `LLM_GATEWAY_URL` gesetzt: URL des LLM Gateway Services
  - [ ] `AGENT_SERVICE_URL` gesetzt: URL des Agent Services
- [ ] **Service Dependencies deployed:**
  - [ ] LLM Gateway
  - [ ] Agent Service
  - [ ] RAG Service
  - [ ] Chat Service
  - [ ] Admin Service
  - [ ] Crawler Service
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
- [ ] Build Command validiert: `cd apps/services/customer-intelligence-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Crawler Service

- [ ] Railway Service erstellt: `railway service create crawler-service`
- [ ] Service ausgewählt: `railway service crawler-service`
- [ ] Build Command validiert: `cd apps/services/crawler-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Voice Service

- [ ] Railway Service erstellt: `railway service create voice-service`
- [ ] Service ausgewählt: `railway service voice-service`
- [ ] **Service Dependencies deployed:**
  - [ ] LLM Gateway
  - [ ] Chat Service
- [ ] Build Command validiert: `cd apps/services/voice-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

## Phase 4: Supporting Services (Priority 4-5)

### Avatar Service

- [ ] Railway Service erstellt: `railway service create avatar-service`
- [ ] Service ausgewählt: `railway service avatar-service`
- [ ] **Service Dependencies deployed:**
  - [ ] Voice Service
- [ ] Build Command validiert: `cd apps/services/avatar-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Character Service

- [ ] Railway Service erstellt: `railway service create character-service`
- [ ] Service ausgewählt: `railway service character-service`
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
- [ ] Build Command validiert: `cd apps/services/character-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Feedback Service

- [ ] Railway Service erstellt: `railway service create feedback-service`
- [ ] Service ausgewählt: `railway service feedback-service`
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
- [ ] Build Command validiert: `cd apps/services/feedback-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Summary Service

- [ ] Railway Service erstellt: `railway service create summary-service`
- [ ] Service ausgewählt: `railway service summary-service`
- [ ] **Environment Variables:**
  - [ ] `LLM_GATEWAY_URL` gesetzt: URL des LLM Gateway Services
- [ ] **Service Dependencies deployed:**
  - [ ] LLM Gateway
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
- [ ] Build Command validiert: `cd apps/services/summary-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Admin Service

- [ ] Railway Service erstellt: `railway service create admin-service`
- [ ] Service ausgewählt: `railway service admin-service`
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
  - [ ] redis Service deployed
- [ ] Build Command validiert: `cd apps/services/admin-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Ingestion Service

- [ ] Railway Service erstellt: `railway service create ingestion-service`
- [ ] Service ausgewählt: `railway service ingestion-service`

> **Python Service** - Erfordert Python Runtime auf Railway

- [ ] **Environment Variables:**
  - [ ] `ADMIN_SERVICE_URL` gesetzt: URL des Admin Services (für DB-API)
- [ ] **Service Dependencies deployed:**
  - [ ] Admin Service
- [ ] **Infrastructure Dependencies:**
  - [ ] postgresql Service deployed
  - [ ] redis Service deployed
- [ ] Build Command validiert: `cd apps/services/ingestion-service && pip install -r requirements.txt`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Metaverse Service

- [ ] Railway Service erstellt: `railway service create metaverse-service`
- [ ] Service ausgewählt: `railway service metaverse-service`
- [ ] Build Command validiert: `cd apps/services/metaverse-service && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Agent Worker

- [ ] Railway Service erstellt: `railway service create agent-worker`
- [ ] Service ausgewählt: `railway service agent-worker`

> **Worker Service** - Läuft als Background Worker

- [ ] **Environment Variables:**
  - [ ] `AGENT_SERVICE_URL` gesetzt: URL des Agent Services
- [ ] **Service Dependencies deployed:**
  - [ ] Agent Service
- [ ] **Infrastructure Dependencies:**
  - [ ] redis Service deployed
- [ ] Build Command validiert: `cd apps/workers/agent-worker && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

### Document Worker

- [ ] Railway Service erstellt: `railway service create document-worker`
- [ ] Service ausgewählt: `railway service document-worker`

> **Worker Service** - Läuft als Background Worker

- [ ] **Environment Variables:**
  - [ ] `INGESTION_SERVICE_URL` gesetzt: URL des Ingestion Services
- [ ] **Service Dependencies deployed:**
  - [ ] Ingestion Service
- [ ] **Infrastructure Dependencies:**
  - [ ] redis Service deployed
- [ ] Build Command validiert: `cd apps/workers/document-worker && npm install && npm run build`
- [ ] Service deployed: `railway up`
- [ ] Health Check erfolgreich: `curl <SERVICE_URL>/health`
- [ ] Service URL gesetzt in abhängigen Services

## Phase 5: Post-Deployment Validation

- [ ] **Database Migration ausgeführt:**
  - [ ] Prisma Client generiert: `cd packages/db && npx prisma generate`
  - [ ] Migrationen deployed: `npx prisma migrate deploy`

- [ ] **Service URLs synchronisiert:**
  - [ ] Alle Service-URLs in Railway abgerufen
  - [ ] Service-URLs in abhängigen Services gesetzt
  - [ ] Script ausgeführt: `./scripts/sync-service-urls.sh production`

- [ ] **Health Checks durchgeführt:**
  - [ ] Alle Services Health Checks erfolgreich
  - [ ] Script ausgeführt: `./scripts/health-check.sh production`

- [ ] **Smoke Tests durchgeführt:**
  - [ ] Alle Smoke Tests erfolgreich
  - [ ] Script ausgeführt: `./scripts/smoke-tests.sh production`

- [ ] **Deployment Validation:**
  - [ ] Vollständige Validierung erfolgreich
  - [ ] Script ausgeführt: `./scripts/validate-deployment.sh production`

- [ ] **Monitoring aktiviert:**
  - [ ] Railway Monitoring für alle Services aktiviert
  - [ ] Alerts konfiguriert
  - [ ] Logs überprüft

- [ ] **Frontend Integration:**
  - [ ] Frontend deployed (Vercel)
  - [ ] `NEXT_PUBLIC_API_URL` auf API Gateway URL gesetzt
  - [ ] CORS korrekt konfiguriert
  - [ ] Frontend-Backend Integration getestet

## Service-Status Übersicht

| Service | Status | Health Check | URL |
|---------|--------|--------------|-----|
| API Gateway | ⬜ Nicht deployed | - | - |
| Chat Service | ⬜ Nicht deployed | - | - |
| RAG Service | ⬜ Nicht deployed | - | - |
| Agent Service | ⬜ Nicht deployed | - | - |
| LLM Gateway | ⬜ Nicht deployed | - | - |
| Customer Intelligence Service | ⬜ Nicht deployed | - | - |
| Crawler Service | ⬜ Nicht deployed | - | - |
| Voice Service | ⬜ Nicht deployed | - | - |
| Avatar Service | ⬜ Nicht deployed | - | - |
| Character Service | ⬜ Nicht deployed | - | - |
| Feedback Service | ⬜ Nicht deployed | - | - |
| Summary Service | ⬜ Nicht deployed | - | - |
| Tool Service | ⬜ Nicht deployed | - | - |
| Admin Service | ⬜ Nicht deployed | - | - |
| Ingestion Service | ⬜ Nicht deployed | - | - |
| Metaverse Service | ⬜ Nicht deployed | - | - |
| Agent Worker | ⬜ Nicht deployed | - | - |
| Document Worker | ⬜ Nicht deployed | - | - |

**Legende:**
- ✅ Deployed und gesund
- ⚠️ Deployed, aber Probleme
- ❌ Deployment fehlgeschlagen
- ⬜ Nicht deployed

## Fehlende Services in Dokumentation

Die folgenden Services sind im Code vorhanden, aber noch nicht vollständig in der Deployment-Dokumentation:

- **Character Service** (character-service) - Typ: nestjs
- **Feedback Service** (feedback-service) - Typ: nestjs
- **Summary Service** (summary-service) - Typ: nestjs
- **Tool Service** (tool-service) - Typ: nestjs
- **Admin Service** (admin-service) - Typ: nestjs
- **Ingestion Service** (ingestion-service) - Typ: python
- **Metaverse Service** (metaverse-service) - Typ: nestjs
- **Agent Worker** (agent-worker) - Typ: worker
- **Document Worker** (document-worker) - Typ: worker

## Nächste Schritte

Nach erfolgreichem Deployment:

1. Vollständige Integration Tests durchführen
2. Performance Monitoring aktivieren
3. Cost Monitoring einrichten
4. Dokumentation aktualisieren mit tatsächlichen Service-URLs
5. Team über Deployment informieren

## Troubleshooting

Bei Problemen siehe:
- [Deployment Railway Guide](DEPLOYMENT_RAILWAY.md)
- [First Deployment Guide](FIRST_DEPLOYMENT.md)
- [Runbooks](runbooks/)

---

**Hinweis:** Diese Checkliste wird automatisch generiert. Bei Änderungen an Services-Konfiguration die Checkliste neu generieren:
```bash
node scripts/generate-deployment-checklist.js [staging|production]
# oder
./scripts/generate-deployment-checklist.sh [staging|production]
```