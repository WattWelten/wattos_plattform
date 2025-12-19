# Erstes Deployment - Schritt für Schritt

## ✅ Vorbereitung abgeschlossen

- ✅ GitHub Secrets gesetzt
- ✅ Railway Project ID konfiguriert
- ✅ CI/CD Workflows erstellt
- ✅ Scripts vorbereitet

## Nächste Schritte

### 1. Railway Services erstellen

Erstelle in Railway die notwendigen Services:

```bash
# Railway CLI Login
railway login

# Projekt linken
railway link a97f01bc-dc80-4941-b911-ed7ebb3efa7a
```

**Services erstellen:**

1. **PostgreSQL Service**
   ```bash
   railway add postgresql
   ```

2. **Redis Service**
   ```bash
   railway add redis
   ```

3. **API Gateway Service**
   ```bash
   railway service create api-gateway
   ```

4. **Weitere Services** (wiederhole für jeden):
   - `chat-service`
   - `rag-service`
   - `agent-service`
   - `llm-gateway`
   - `customer-intelligence-service`
   - `crawler-service`
   - `voice-service`
   - `avatar-service`

### 2. Railway Environment Variables setzen

#### Shared Variables (für alle Services)

```bash
# NODE_ENV
railway variables set NODE_ENV=production --shared

# DATABASE_URL und REDIS_URL werden automatisch von Railway gesetzt
# wenn PostgreSQL/Redis Services erstellt werden
```

#### Service-spezifische Variables

**API Gateway:**
```bash
railway service api-gateway
railway variables set JWT_SECRET=<dein-jwt-secret>
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app
```

**LLM Gateway:**
```bash
railway service llm-gateway
railway variables set OPENAI_API_KEY=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
```

**Voice Service:**
```bash
railway service voice-service
railway variables set ELEVENLABS_API_KEY=sk_2c1bed318623f04cd188fdb6fede39cf6ac98fd72072d67a
railway variables set ELEVENLABS_VOICE_ID=iFJwt4O7E3aafIpJFfcu
```

### 3. Database Migration

Führe die erste Migration aus:

```bash
# Prisma Client generieren
cd packages/db
npx prisma generate

# Migrationen ausführen
npx prisma migrate deploy
```

Oder via Railway:

```bash
railway run --service <migration-service> npx prisma migrate deploy
```

### 4. Erste Deployment testen

#### Option A: Staging Deployment (empfohlen)

1. Erstelle einen `develop` Branch (falls nicht vorhanden):
   ```bash
   git checkout -b develop
   git push origin develop
   ```

2. Push zu `develop` → Automatisches Staging Deployment

#### Option B: Manuelles Deployment via GitHub Actions

1. Gehe zu GitHub → Actions
2. Wähle "Deploy to Staging" Workflow
3. Klicke "Run workflow"
4. Wähle Branch (`develop` oder `main`)
5. Klicke "Run workflow"

#### Option C: Direktes Railway Deployment

```bash
# Für einen Service
railway service api-gateway
railway up
```

### 5. Health Checks

Nach dem Deployment:

```bash
# Health Check Script (lokal)
chmod +x scripts/health-check.sh
./scripts/health-check.sh staging

# Oder direkt
curl https://your-api-gateway.railway.app/health
```

### 6. Service URLs synchronisieren

Nach dem ersten Deployment aller Services:

```bash
# Service URLs automatisch synchronisieren
chmod +x scripts/sync-service-urls.sh
./scripts/sync-service-urls.sh production
```

## Deployment-Strategie

### Phase 1: Core Services (Woche 1)

Starte mit den wichtigsten Services:

1. **API Gateway** - Basis-Routing
2. **LLM Gateway** - LLM-Funktionalität
3. **Database Migration Service** - DB-Setup

### Phase 2: Essential Services (Woche 2)

1. **Chat Service** - Chat-Funktionalität
2. **RAG Service** - Dokumenten-Suche
3. **Agent Service** - Agent-Funktionalität

### Phase 3: Advanced Services (Woche 3)

1. **Customer Intelligence Service**
2. **Crawler Service**
3. **Voice Service**
4. **Avatar Service**

### Phase 4: Supporting Services (Woche 4)

1. **Admin Service**
2. **Character Service**
3. **Tool Service**
4. **Summary Service**
5. **Feedback Service**

## Monitoring

Nach jedem Deployment:

1. **Health Checks** - Alle Services prüfen
2. **Logs** - Railway Logs überprüfen
3. **GitHub Actions** - Deployment Status prüfen
4. **Smoke Tests** - Basis-Funktionalität testen

## Troubleshooting

### Service startet nicht

1. Prüfe Railway Logs:
   ```bash
   railway logs --service <service-name>
   ```

2. Prüfe Environment Variables:
   ```bash
   railway variables --service <service-name>
   ```

3. Prüfe Build Logs in Railway Dashboard

### Database Connection Error

1. Prüfe `DATABASE_URL` Variable
2. Prüfe PostgreSQL Service Status
3. Prüfe Network Connectivity

### Service nicht erreichbar

1. Prüfe Health Check Endpoint
2. Prüfe Railway Service URL
3. Prüfe CORS Configuration

## Nächste Schritte nach erstem Deployment

1. ✅ Alle Services deployed
2. ✅ Health Checks erfolgreich
3. ✅ Frontend Deployment (Vercel)
4. ✅ Integration Tests
5. ✅ Production Deployment

## Support

Bei Problemen:
- Prüfe [Runbooks](./runbooks/) für Incident Response
- Prüfe [Deployment Automation](./DEPLOYMENT_AUTOMATION.md) für Details
- Prüfe Railway Logs und GitHub Actions Logs












