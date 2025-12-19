# WattOS V2 - Nächste Schritte

**Stand**: 2024-12-04  
**Projekt**: `D:\wattos_v2`  
**Status**: ✅ Bereit für Deployment-Vorbereitung

## 🎯 Übersicht

Diese Anleitung führt Sie durch die nächsten Schritte zur Vorbereitung des Railway Deployments.

## Phase 1: Lokale Entwicklungsumgebung (Optional, aber empfohlen)

### Schritt 1.1: Dependencies installieren

```bash
cd D:\wattos_v2
pnpm install
```

**Erwartete Dauer**: 5-10 Minuten  
**Prüfung**: `node_modules/` Verzeichnis sollte erstellt werden

### Schritt 1.2: Environment-Variablen vorbereiten

```bash
# Prüfe ob .env.example existiert
# Falls nicht, erstelle eine .env Datei basierend auf der Dokumentation
```

**Wichtige Variablen für lokale Entwicklung**:
- `DATABASE_URL` - PostgreSQL Connection String
- `REDIS_URL` - Redis Connection String  
- `JWT_SECRET` - JWT Secret (generiere mit: `openssl rand -base64 32`)
- `NODE_ENV=development`

**Dokumentation**: Siehe `docs/ENVIRONMENT_VARIABLES.md`

### Schritt 1.3: Lokale Datenbank & Redis starten

**Option A: Docker Compose** (falls vorhanden)
```bash
docker-compose up -d postgres redis
```

**Option B: Lokale Installation**
- PostgreSQL 15+ mit pgvector Extension
- Redis 7+

### Schritt 1.4: Datenbank-Migrationen ausführen

```bash
cd packages/db
npx prisma generate
npx prisma migrate deploy
```

**Prüfung**: Datenbank-Schema sollte erstellt sein

---

## Phase 2: Railway Deployment Vorbereitung

### Schritt 2.1: Railway CLI installieren

```bash
npm install -g @railway/cli
```

**Prüfung**: `railway --version` sollte funktionieren

### Schritt 2.2: Railway Login

```bash
railway login
```

**Erwartung**: Browser öffnet sich für Authentifizierung

### Schritt 2.3: Railway Projekt linken

```bash
cd D:\wattos_v2
railway link
```

**Oder mit Projekt-ID**:
```bash
railway link a97f01bc-dc80-4941-b911-ed7ebb3efa7a
```

**Prüfung**: `.railway/` Verzeichnis sollte erstellt werden

### Schritt 2.4: Infrastructure Services erstellen

#### PostgreSQL Service

```bash
railway add postgresql
```

**Wichtig**: Railway setzt automatisch `DATABASE_URL` als Environment Variable

#### Redis Service

```bash
railway add redis
```

**Wichtig**: Railway setzt automatisch `REDIS_URL` als Environment Variable

**Prüfung**: 
```bash
railway variables
# Sollte DATABASE_URL und REDIS_URL anzeigen
```

---

## Phase 3: Services deployen (Priorität)

### Schritt 3.1: Shared Environment Variables setzen

```bash
# NODE_ENV für alle Services
railway variables set NODE_ENV=production --shared

# DEPLOYMENT_PLATFORM für Service Discovery
railway variables set DEPLOYMENT_PLATFORM=railway --shared
```

### Schritt 3.2: Kritische Services deployen (Reihenfolge beachten!)

#### 1. LLM Gateway (Priorität 1)

```bash
# Service erstellen
railway service create llm-gateway

# Service auswählen
railway service llm-gateway

# Environment Variables setzen
railway variables set OPENAI_API_KEY=<dein-openai-key>
# Optional: ANTHROPIC_API_KEY, AZURE_OPENAI_API_KEY

# Deployen
railway up --service llm-gateway
```

**Prüfung**: Service sollte unter `https://llm-gateway-production.up.railway.app` erreichbar sein

#### 2. API Gateway (Priorität 1)

```bash
railway service create api-gateway
railway service api-gateway

# Environment Variables
railway variables set JWT_SECRET=<generiere-mit-openssl-rand-base64-32>
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app

# Deployen
railway up --service api-gateway
```

**Prüfung**: Health Check unter `/health` sollte funktionieren

#### 3. RAG Service (Priorität 2)

```bash
railway service create rag-service
railway service rag-service

# Deployen
railway up --service rag-service
```

#### 4. Chat Service (Priorität 2)

```bash
railway service create chat-service
railway service chat-service

# Environment Variables
railway variables set JWT_SECRET=<gleicher-wie-api-gateway>

# Deployen
railway up --service chat-service
```

#### 5. Agent Service (Priorität 2)

```bash
railway service create agent-service
railway service agent-service

# Deployen
railway up --service agent-service
```

### Schritt 3.3: Service URLs synchronisieren

Nach dem Deployment müssen Service-URLs gesetzt werden:

```bash
# Automatisch (falls Script vorhanden)
./scripts/sync-service-urls.sh production

# Oder manuell
railway variables set LLM_GATEWAY_URL=https://llm-gateway-production.up.railway.app --shared
railway variables set RAG_SERVICE_URL=https://rag-service-production.up.railway.app --shared
railway variables set CHAT_SERVICE_URL=https://chat-service-production.up.railway.app --shared
railway variables set AGENT_SERVICE_URL=https://agent-service-production.up.railway.app --shared
```

### Schritt 3.4: Weitere Services deployen

**Priorität 3** (optional, aber empfohlen):
- `customer-intelligence-service`
- `crawler-service`
- `voice-service`
- `avatar-service`

**Priorität 4** (optional):
- `admin-service`
- `character-service`
- `tool-service`
- `summary-service`
- `feedback-service`

**Workers**:
- `agent-worker`
- `document-worker`

---

## Phase 4: Datenbank-Migrationen auf Railway

### Schritt 4.1: Prisma Client generieren

```bash
cd packages/db
npx prisma generate
```

### Schritt 4.2: Migrationen deployen

**Option A: Via Railway CLI**

```bash
# In einem temporären Service oder via Railway Shell
railway run npx prisma migrate deploy
```

**Option B: Via GitHub Actions**

Die Migrationen werden automatisch beim Deployment ausgeführt, wenn das Workflow konfiguriert ist.

**Prüfung**: 
```bash
railway run npx prisma studio
# Sollte Datenbank-Schema anzeigen
```

---

## Phase 5: Validierung & Testing

### Schritt 5.1: Health Checks

```bash
# API Gateway
curl https://api-gateway-production.up.railway.app/health

# LLM Gateway
curl https://llm-gateway-production.up.railway.app/health

# Weitere Services...
```

### Schritt 5.2: Smoke Tests

```bash
# Falls Script vorhanden
./scripts/smoke-tests.sh production
```

### Schritt 5.3: Logs prüfen

```bash
# Service-Logs anzeigen
railway logs --service llm-gateway --tail 100
railway logs --service api-gateway --tail 100
```

---

## Phase 6: Frontend Deployment (Vercel)

### Schritt 6.1: Vercel Projekt erstellen

```bash
cd apps/web
vercel
```

### Schritt 6.2: Environment Variables setzen

```bash
vercel env add API_GATEWAY_URL
# Wert: https://api-gateway-production.up.railway.app
```

---

## 📋 Checkliste

### Vorbereitung
- [ ] Dependencies installiert (`pnpm install`)
- [ ] Railway CLI installiert
- [ ] Railway Login erfolgreich
- [ ] Railway Projekt gelinkt

### Infrastructure
- [ ] PostgreSQL Service erstellt
- [ ] Redis Service erstellt
- [ ] `DATABASE_URL` verfügbar
- [ ] `REDIS_URL` verfügbar

### Services (Priorität 1)
- [ ] LLM Gateway deployed
- [ ] API Gateway deployed
- [ ] Health Checks funktionieren

### Services (Priorität 2)
- [ ] RAG Service deployed
- [ ] Chat Service deployed
- [ ] Agent Service deployed

### Konfiguration
- [ ] Shared Environment Variables gesetzt
- [ ] Service URLs synchronisiert
- [ ] JWT_SECRET gesetzt
- [ ] CORS_ORIGIN konfiguriert

### Datenbank
- [ ] Prisma Client generiert
- [ ] Migrationen ausgeführt
- [ ] Schema validiert

### Testing
- [ ] Health Checks erfolgreich
- [ ] Logs ohne kritische Fehler
- [ ] Service-zu-Service Kommunikation funktioniert

---

## 🚨 Wichtige Hinweise

1. **Reihenfolge beachten**: Services müssen in der richtigen Reihenfolge deployed werden (LLM Gateway → API Gateway → andere Services)

2. **Service URLs**: Nach jedem Deployment müssen die Service-URLs aktualisiert werden

3. **Secrets**: Niemals API Keys oder Secrets committen. Nur über Railway Variables setzen.

4. **Monitoring**: Logs regelmäßig prüfen, besonders nach dem ersten Deployment

5. **Rollback**: Bei Problemen kann ein Service über Railway Dashboard zurückgerollt werden

---

## 📚 Weitere Ressourcen

- **Deployment Guide**: `docs/DEPLOYMENT_RAILWAY.md`
- **Environment Variables**: `docs/ENVIRONMENT_VARIABLES.md`
- **First Deployment**: `docs/FIRST_DEPLOYMENT.md`
- **Secrets Setup**: `docs/SECRETS_SETUP.md`
- **Troubleshooting**: `docs/RAILWAY_TROUBLESHOOTING.md`

---

## 🆘 Support

Bei Problemen:
1. Logs prüfen: `railway logs --service <service-name>`
2. Health Checks durchführen
3. Dokumentation konsultieren
4. GitHub Issues erstellen

---

**Nächster Schritt**: Beginnen Sie mit **Phase 1** oder direkt mit **Phase 2**, falls lokale Entwicklung nicht benötigt wird.

