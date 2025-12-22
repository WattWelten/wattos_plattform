# Railway Deployment Guide

## Übersicht

Dieser Guide beschreibt das Deployment der WattOS KI Plattform auf Railway mit einer Hybrid-Strategie: Wichtige Services werden separat deployed, kleinere Services können zusammen deployed werden.

## Voraussetzungen

- Railway Account (https://railway.app)
- Railway CLI installiert: `npm i -g @railway/cli`
- Git Repository mit der Plattform
- GitHub Secrets konfiguriert (siehe [Secrets Setup](SECRETS_SETUP.md))

## Deployment-Strategie

### Separate Services (Empfohlen für Produktion)

Diese Services sollten separat deployed werden für bessere Skalierung und Isolation:

1. **API Gateway** (Port: 3001)
2. **Chat Service** (Port: 3006)
3. **RAG Service** (Port: 3007)
4. **Agent Service** (Port: 3008)
5. **LLM Gateway** (Port: 3009)
6. **Customer Intelligence Service** (Port: 3014)
7. **Crawler Service** (Port: 3015)
8. **Voice Service** (Port: 3016)
9. **Avatar Service** (Port: 3009) - Kann mit LLM Gateway kombiniert werden, wenn Ports unterschiedlich sind
10. **Ingestion Service** (Port: 8001) - Python FastAPI Service

### Zusammen deploybare Services

Diese kleineren Services können zusammen deployed werden:

- **Admin Service** (Port: 3008) + **Character Service** (Port: 3013)
- **Tool Service** (Port: 3005) + **Summary Service** + **Feedback Service**
- **Metaverse Service** (optional, wenn verwendet)

### Workers (Background Services)

Diese Services laufen als Background-Worker:

- **Agent Worker** - Verarbeitet Agent-Run-Jobs aus Queue
- **Document Worker** - Verarbeitet Dokument-Verarbeitungs-Jobs aus Queue

## Schritt-für-Schritt Anleitung

### 1. Railway CLI Setup

```bash
# Login
railway login

# Projekt initialisieren (wenn noch nicht vorhanden)
railway init
```

### 2. Datenbank erstellen

```bash
# PostgreSQL Service in Railway erstellen
railway add postgresql

# Datenbank-URL abrufen
railway variables
```

### 3. Redis erstellen

```bash
# Redis Service in Railway erstellen
railway add redis

# Redis-URL abrufen
railway variables
```

### 4. Service Discovery konfigurieren

Die Plattform verwendet automatische Service Discovery. Für Railway müssen Service-URLs als ENV-Variablen gesetzt werden:

```bash
# Service-URLs automatisch synchronisieren
./scripts/sync-service-urls.sh production

# Oder manuell setzen
railway variables set CHAT_SERVICE_URL=https://chat-service-production.up.railway.app
railway variables set RAG_SERVICE_URL=https://rag-service-production.up.railway.app
railway variables set LLM_GATEWAY_URL=https://llm-gateway-production.up.railway.app
# ... etc.
```

**Wichtig**: Service Discovery erkennt automatisch Railway-Umgebung über `RAILWAY_ENVIRONMENT` Variable.

Siehe [Service Discovery Dokumentation](SERVICE_DISCOVERY.md) für Details.

### 5. Environment-Variablen setzen

Für jeden Service müssen die Environment-Variablen gesetzt werden:

```bash
# Beispiel für API Gateway
railway service api-gateway
railway variables set DATABASE_URL=$DATABASE_URL
railway variables set REDIS_URL=$REDIS_URL
railway variables set JWT_SECRET=your-secret-key
railway variables set CORS_ORIGIN=https://your-frontend-domain.com
railway variables set DEPLOYMENT_PLATFORM=railway
```

**Wichtige Variablen für alle Services:**
- `DATABASE_URL` - PostgreSQL Connection String
- `REDIS_URL` - Redis Connection String
- `NODE_ENV=production`
- `PORT` - Wird automatisch von Railway gesetzt
- `DEPLOYMENT_PLATFORM=railway` - Für Service Discovery

**Service-spezifische Variablen:**
- Siehe `.env.example` für vollständige Liste

### 6. Auto-Scaling konfigurieren

Railway unterstützt automatisches Scaling basierend auf CPU und Memory. Die Konfiguration erfolgt über `railway.json`:

```json
{
  "deploy": {
    "scaling": {
      "minReplicas": 1,
      "maxReplicas": 3,
      "targetCPU": 70,
      "targetMemory": 80
    }
  }
}
```

**Empfohlene Konfigurationen:**

- **API Gateway**: min: 2, max: 5, CPU: 70%, Memory: 80%
- **Chat Service**: min: 2, max: 10, CPU: 70%, Memory: 80%
- **RAG Service**: min: 2, max: 8, CPU: 70%, Memory: 80%
- **LLM Gateway**: min: 2, max: 5, CPU: 70%, Memory: 80%
- **Agent Service**: min: 2, max: 5, CPU: 70%, Memory: 80%

### 7. Resource Limits setzen

Für jeden Service sollten Resource Limits gesetzt werden:

```bash
# Beispiel für Chat Service
railway service chat-service
railway variables set RAILWAY_MEMORY_LIMIT=2GB
railway variables set RAILWAY_CPU_LIMIT=2000m
```

**Empfohlene Limits:**

- **API Gateway**: 1GB RAM, 1000m CPU
- **Chat Service**: 2GB RAM, 2000m CPU
- **RAG Service**: 2GB RAM, 2000m CPU
- **LLM Gateway**: 1GB RAM, 1000m CPU
- **Agent Service**: 2GB RAM, 2000m CPU

### 8. Migrationen ausführen

**Option A: Separater Migration-Service (Empfohlen)**

```bash
# Neuen Service für Migrationen erstellen
railway service create migration-service

# Migration-Script als Start-Command setzen
railway variables set START_COMMAND="cd packages/db && bash scripts/migrate.sh"
```

**Option B: Build Hook**

In Railway Dashboard → Service → Settings → Build Command:
```bash
cd packages/db && npx prisma generate && npx prisma migrate deploy
```

### 6. Services deployen

Für jeden Service:

```bash
# Service auswählen
railway service <service-name>

# Deploy
railway up
```

**Service-Namen:**
- `api-gateway` (Port: 3001)
- `chat-service` (Port: 3006)
- `rag-service` (Port: 3007)
- `agent-service` (Port: 3008)
- `llm-gateway` (Port: 3009)
- `customer-intelligence-service` (Port: 3014)
- `crawler-service` (Port: 3015)
- `voice-service` (Port: 3016)
- `avatar-service` (Port: 3017)
- `admin-service` (Port: 3020)
- `feedback-service` (Port: 3018)
- `summary-service` (Port: 3019)
- `character-service` (Port: 3013)
- `tool-service` (Port: 3005)
- `summary-service`
- `feedback-service`
- `metaverse-service`
- `ingestion-service` (Port: 8001) - Python FastAPI
- `agent-worker` - Background Worker
- `document-worker` - Background Worker

### 7. Service-URLs konfigurieren

Nach dem Deployment müssen die Service-URLs in Railway gesetzt werden:

```bash
# Für jeden Service die öffentliche URL abrufen
railway domain

# Diese URLs dann in anderen Services als Environment-Variablen setzen:
railway variables set LLM_GATEWAY_URL=https://llm-gateway-production.up.railway.app
railway variables set CHAT_SERVICE_URL=https://chat-service-production.up.railway.app
# etc.
```

## Health Checks

Alle Services haben Health Check Endpunkte:

- `GET /health` - Gibt `{ status: 'ok', service: 'service-name', timestamp: ISO }` zurück

Railway nutzt diese automatisch für Health Monitoring.

## Monitoring

### Logs ansehen

```bash
# Logs für einen Service
railway logs --service <service-name>

# Live Logs
railway logs --follow --service <service-name>
```

### Metrics

Railway Dashboard zeigt automatisch:
- CPU Usage
- Memory Usage
- Request Count
- Error Rate

## Troubleshooting

### Service startet nicht

1. **Prüfe Logs:**
   ```bash
   railway logs --service <service-name>
   ```

2. **Prüfe Environment-Variablen:**
   ```bash
   railway variables --service <service-name>
   ```

3. **Prüfe Health Check:**
   ```bash
   curl https://<service-url>/health
   ```

### Datenbank-Verbindungsfehler

1. Prüfe `DATABASE_URL` ist korrekt gesetzt
2. Prüfe PostgreSQL Service läuft
3. Prüfe Migrationen wurden ausgeführt

### Service-zu-Service Kommunikation fehlgeschlagen

1. Prüfe Service-URLs sind korrekt gesetzt
2. Prüfe Services sind erreichbar (Health Checks)
3. Prüfe CORS-Konfiguration

### Port-Konflikte

Railway setzt automatisch `PORT` Environment-Variable. Services sollten `process.env.PORT` verwenden.

## Docker Deployment

### Multi-Stage Builds

Alle Services verwenden optimierte Multi-Stage Docker Builds:

```bash
# Gateway bauen
docker build -f apps/gateway/Dockerfile -t wattos_plattform-gateway:latest .

# Chat Service bauen
docker build -f apps/services/chat-service/Dockerfile -t wattos_plattform-chat:latest .

# Ingestion Service (Python) bauen
docker build -f apps/services/ingestion-service/Dockerfile -t wattos_plattform-ingestion:latest .
```

### Docker Compose

Für lokale Entwicklung:

```bash
docker-compose -f infra/docker/compose.yml up -d
```

## Observability & Monitoring

### Health Checks

Alle Services haben Health Check Endpunkte:

- `GET /health/liveness` - Liveness Probe
- `GET /health/readiness` - Readiness Probe  
- `GET /health` - Vollständiger Health Check
- `GET /health/metrics` - Prometheus Metrics

Siehe [OBSERVABILITY.md](OBSERVABILITY.md) für Details.

### Logging

Strukturiertes JSON-Logging mit Pino:

```env
LOG_LEVEL=info  # debug, info, warn, error
SERVICE_NAME=api-gateway
```

### Metrics

Prometheus-kompatible Metriken werden automatisch gesammelt:

- HTTP Request Metrics
- LLM Call Metrics
- Database Query Metrics
- Cache Operation Metrics

## Resilience Features

### Circuit Breaker

Automatischer Circuit Breaker für externe Service-Calls:

```env
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT=60000
```

### Retry-Strategien

Exponential Backoff für transienten Fehler:

```env
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY=1000
RETRY_MAX_DELAY=30000
```

Siehe [RESILIENCE.md](RESILIENCE.md) für Details.

## Performance-Optimierungen

### Caching

Redis-basiertes Caching aktivieren:

```env
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=3600
REDIS_URL=redis://localhost:6379
```

Siehe [PERFORMANCE.md](PERFORMANCE.md) für Details.

## Best Practices

1. **Environment-Variablen:**
   - Verwende Railway's Shared Variables für gemeinsame Werte (DATABASE_URL, REDIS_URL)
   - Service-spezifische Variablen pro Service setzen

2. **Secrets:**
   - Verwende Railway's Secret Management für API Keys
   - Niemals Secrets in Code committen

3. **Monitoring:**
   - Aktiviere Railway's Monitoring für alle Services
   - Setze Alerts für Fehlerraten
   - Nutze Health Check Endpunkte für Monitoring

4. **Skalierung:**
   - Starte mit einem Service pro Railway Service
   - Skaliere bei Bedarf horizontal
   - Nutze Health Checks für Auto-Scaling

5. **Backups:**
   - Aktiviere automatische PostgreSQL Backups in Railway
   - Teste Backup-Wiederherstellung regelmäßig

6. **Observability:**
   - Strukturiertes Logging aktivieren
   - Metrics sammeln
   - Health Checks überwachen

7. **Resilience:**
   - Circuit Breaker für externe Services
   - Retry-Strategien konfigurieren
   - Graceful Degradation implementieren

## Deployment-Checkliste

- [ ] Railway Account erstellt
- [ ] PostgreSQL Service erstellt und `DATABASE_URL` gesetzt
- [ ] Redis Service erstellt und `REDIS_URL` gesetzt
- [ ] Migrationen ausgeführt
- [ ] Alle Services deployed
- [ ] Service-URLs konfiguriert
- [ ] Health Checks funktionieren
- [ ] Frontend zeigt auf korrekte API Gateway URL
- [ ] CORS korrekt konfiguriert
- [ ] Monitoring aktiviert
- [ ] Alerts konfiguriert

## Nächste Schritte

Nach erfolgreichem Deployment:

1. Teste alle Endpunkte
2. Prüfe Logs auf Fehler
3. Konfiguriere Monitoring und Alerts
4. Dokumentiere Service-URLs für Team
5. Setup CI/CD Pipeline (optional)

## Support

Bei Problemen:
- Prüfe Railway Logs
- Prüfe Service Health Checks
- Siehe Troubleshooting-Sektion oben
- Kontaktiere Railway Support



