# Railway Deployment Troubleshooting Guide

## Schnellstart

Führe das Analyse-Script aus:

```bash
./scripts/analyze-railway-deployment.sh production
```

Das Script prüft automatisch:
- ✅ Railway CLI Installation und Authentifizierung
- ✅ Konfigurationsdateien (railway.json, railway.toml)
- ✅ Alle Services in Railway
- ✅ Environment Variables
- ✅ Service Logs
- ✅ Health Checks
- ✅ Port-Konflikte
- ✅ Service Discovery Konfiguration

## Häufige Probleme und Lösungen

### 1. Service startet nicht

**Symptome:**
- Service zeigt "Crashed" Status in Railway
- Logs zeigen Start-Fehler
- Health Check schlägt fehl

**Diagnose:**
```bash
# Prüfe Logs
railway logs --service <service-name> --tail 100

# Prüfe Environment Variables
railway variables --service <service-name>

# Prüfe Start-Command
railway service <service-name> --json | jq '.startCommand'
```

**Lösungen:**

1. **Start-Command korrigieren:**
   ```bash
   # Für NestJS Services
   railway variables set START_COMMAND="cd apps/gateway && node dist/main" --service api-gateway
   
   # Für Python Services
   railway variables set START_COMMAND="uvicorn main:app --host 0.0.0.0 --port \$PORT" --service ingestion-service
   ```

2. **Build-Probleme:**
   ```bash
   # Prüfe ob dist/ Verzeichnis existiert
   railway logs --service <service-name> | grep -i "build\|compile"
   
   # Füge Build-Command hinzu
   railway variables set BUILD_COMMAND="cd apps/gateway && npm run build" --service api-gateway
   ```

3. **Dependencies fehlen:**
   ```bash
   # Prüfe package.json
   railway logs --service <service-name> | grep -i "module.*not.*found\|cannot.*find"
   
   # Stelle sicher, dass node_modules installiert werden
   railway variables set INSTALL_COMMAND="npm install" --service <service-name>
   ```

### 2. Datenbank-Verbindungsfehler

**Symptome:**
- "Cannot connect to database" Fehler
- "Connection timeout" Fehler
- Prisma Fehler

**Diagnose:**
```bash
# Prüfe DATABASE_URL
railway variables --service <service-name> | grep DATABASE_URL

# Teste Datenbank-Verbindung
railway run --service <service-name> -- npx prisma db pull
```

**Lösungen:**

1. **DATABASE_URL setzen:**
   ```bash
   # Hole DATABASE_URL vom PostgreSQL Service
   DATABASE_URL=$(railway variables --service postgresql | grep DATABASE_URL | awk '{print $2}')
   
   # Setze für alle Services
   for service in api-gateway chat-service rag-service; do
     railway variables set DATABASE_URL="$DATABASE_URL" --service $service
   done
   ```

2. **Migrationen ausführen:**
   ```bash
   # Migration Service erstellen
   railway service create migration-service
   railway variables set START_COMMAND="cd packages/db && npx prisma migrate deploy" --service migration-service
   railway up --service migration-service
   ```

### 3. Service Discovery Probleme

**Symptome:**
- "Service not found" Fehler
- Service-zu-Service Kommunikation schlägt fehl
- 404 Errors bei Service-Calls

**Diagnose:**
```bash
# Prüfe Service-URLs
railway variables --service <service-name> | grep -i "url\|service"

# Prüfe Service Discovery Konfiguration
railway variables --service <service-name> | grep DEPLOYMENT_PLATFORM
```

**Lösungen:**

1. **Service-URLs synchronisieren:**
   ```bash
   ./scripts/sync-service-urls.sh production
   ```

2. **DEPLOYMENT_PLATFORM setzen:**
   ```bash
   railway variables set DEPLOYMENT_PLATFORM=railway --service <service-name>
   ```

3. **Service-URLs manuell setzen:**
   ```bash
   # Hole Service-URL
   SERVICE_URL=$(railway domain --service chat-service)
   
   # Setze für abhängige Services
   railway variables set CHAT_SERVICE_URL="$SERVICE_URL" --service api-gateway
   ```

### 4. Port-Konflikte

**Symptome:**
- "Port already in use" Fehler
- Service kann nicht starten
- Mehrere Services versuchen denselben Port zu nutzen

**Lösungen:**

1. **Services sollten process.env.PORT verwenden:**
   ```typescript
   // ✅ Richtig
   const port = process.env.PORT || 3001;
   
   // ❌ Falsch
   const port = 3001;
   ```

2. **Railway setzt automatisch PORT:**
   - Railway setzt `PORT` Environment Variable automatisch
   - Services müssen diese Variable verwenden
   - Hardcoded Ports führen zu Konflikten

### 5. Health Check schlägt fehl

**Symptome:**
- Health Check Endpoint gibt 404 oder 500
- Railway markiert Service als unhealthy
- Auto-Scaling funktioniert nicht

**Diagnose:**
```bash
# Teste Health Check lokal
curl https://<service-url>/health

# Prüfe Health Check Konfiguration
railway service <service-name> --json | jq '.healthcheck'
```

**Lösungen:**

1. **Health Check Endpoint prüfen:**
   ```bash
   # Stelle sicher, dass /health Endpoint existiert
   curl https://<service-url>/health
   curl https://<service-url>/health/liveness
   curl https://<service-url>/health/readiness
   ```

2. **Health Check in railway.json konfigurieren:**
   ```json
   {
     "deploy": {
       "healthcheckPath": "/health",
       "healthcheckTimeout": 100,
       "healthcheckInterval": 10
     }
   }
   ```

### 6. Build schlägt fehl

**Symptome:**
- Build-Logs zeigen Fehler
- Service wird nicht deployed
- TypeScript Compilation Errors

**Diagnose:**
```bash
# Prüfe Build-Logs
railway logs --service <service-name> | grep -i "build\|compile\|error"

# Prüfe TypeScript Errors
railway logs --service <service-name> | grep -i "typescript\|tsc"
```

**Lösungen:**

1. **Build-Command hinzufügen:**
   ```bash
   railway variables set BUILD_COMMAND="cd apps/gateway && npm run build" --service api-gateway
   ```

2. **Dependencies installieren:**
   ```bash
   railway variables set INSTALL_COMMAND="npm install" --service <service-name>
   ```

3. **TypeScript Errors beheben:**
   ```bash
   # Lokal prüfen
   cd apps/gateway && npm run type-check
   
   # Fix Errors
   npm run lint -- --fix
   ```

### 7. Memory/CPU Limits überschritten

**Symptome:**
- Service wird beendet (OOM Kill)
- Langsame Response Times
- Railway zeigt hohe Resource Usage

**Lösungen:**

1. **Resource Limits erhöhen:**
   ```bash
   # Via Railway Dashboard
   # Service → Settings → Resources → Increase
   
   # Oder via CLI (wenn verfügbar)
   railway variables set RAILWAY_MEMORY_LIMIT=2GB --service <service-name>
   railway variables set RAILWAY_CPU_LIMIT=2000m --service <service-name>
   ```

2. **Auto-Scaling konfigurieren:**
   ```json
   {
     "deploy": {
       "scaling": {
         "minReplicas": 2,
         "maxReplicas": 5,
         "targetCPU": 70,
         "targetMemory": 80
       }
     }
   }
   ```

### 8. CORS Probleme

**Symptome:**
- Frontend kann nicht auf API zugreifen
- CORS Errors im Browser
- 403 Forbidden Errors

**Lösungen:**

1. **CORS_ORIGIN setzen:**
   ```bash
   railway variables set CORS_ORIGIN="https://your-frontend-domain.com" --service api-gateway
   ```

2. **CORS in Code prüfen:**
   ```typescript
   app.enableCors({
     origin: configService.get<string>('CORS_ORIGIN')?.split(',') || '*',
     credentials: true,
   });
   ```

## Debugging Workflow

### Schritt 1: Analyse-Script ausführen
```bash
./scripts/analyze-railway-deployment.sh production
```

### Schritt 2: Report prüfen
```bash
# Öffne Report
cat railway-analysis-*/analysis-report.md

# Prüfe Lösungen
cat railway-analysis-*/solutions.md
```

### Schritt 3: Logs analysieren
```bash
# Für spezifischen Service
railway logs --service <service-name> --tail 500

# Nach Fehlern suchen
railway logs --service <service-name> | grep -i "error\|failed\|exception"
```

### Schritt 4: Environment Variables prüfen
```bash
# Alle Variablen anzeigen
railway variables --service <service-name>

# Spezifische Variable prüfen
railway variables --service <service-name> | grep DATABASE_URL
```

### Schritt 5: Health Checks testen
```bash
# Service-URL abrufen
SERVICE_URL=$(railway domain --service <service-name>)

# Health Check testen
curl https://$SERVICE_URL/health
```

### Schritt 6: Service neu starten
```bash
# Via Railway Dashboard
# Service → Deployments → Restart

# Oder via CLI (wenn verfügbar)
railway service <service-name> --restart
```

## Präventive Maßnahmen

1. **Vor jedem Deployment:**
   - ✅ Analyse-Script ausführen
   - ✅ Environment Variables validieren
   - ✅ Service Discovery URLs synchronisieren
   - ✅ Health Checks testen

2. **Monitoring einrichten:**
   - ✅ Railway Monitoring aktivieren
   - ✅ Alerts für Fehlerraten konfigurieren
   - ✅ Logs regelmäßig prüfen

3. **Best Practices:**
   - ✅ Services sollten `process.env.PORT` verwenden
   - ✅ Health Checks implementieren
   - ✅ Strukturiertes Logging verwenden
   - ✅ Service Discovery für Service-zu-Service Kommunikation

## Weitere Ressourcen

- [Railway Dokumentation](https://docs.railway.app)
- [Service Discovery Guide](SERVICE_DISCOVERY.md)
- [Deployment Guide](DEPLOYMENT_RAILWAY.md)
- [Observability Guide](OBSERVABILITY.md)









