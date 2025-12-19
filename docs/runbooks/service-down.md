# Runbook: Service Down

## Symptome

- Service ist nicht erreichbar
- Health Check schlägt fehl
- 5xx Errors in Logs
- Keine Response vom Service

## Diagnose

### 1. Prüfe Service Status

```bash
# Railway CLI
railway service <service-name> --status

# Oder via API
curl https://api.railway.app/v1/services/<service-id>/status
```

### 2. Prüfe Logs

```bash
# Railway CLI
railway logs --service <service-name> --tail 100

# Oder via GitHub Actions
./scripts/log-analyzer.sh collect
./scripts/log-analyzer.sh analyze logs/
```

### 3. Prüfe Health Check

```bash
./scripts/health-check.sh production
```

## Mögliche Ursachen

1. **Service Crash** - Unhandled Exception
2. **Out of Memory** - Zu wenig RAM
3. **Database Connection** - Database nicht erreichbar
4. **Redis Connection** - Redis nicht erreichbar
5. **Port Conflict** - Port bereits belegt
6. **Deployment Fehler** - Fehlerhafter Deployment

## Lösung

### Schritt 1: Service Restart

```bash
# Railway CLI
railway service <service-name> --restart

# Oder via Dashboard
# Railway Dashboard → Service → Restart
```

### Schritt 2: Prüfe Environment Variables

```bash
railway variables --service <service-name>
```

### Schritt 3: Prüfe Dependencies

```bash
# Prüfe Database
./scripts/health-check.sh production | grep database

# Prüfe Redis
./scripts/health-check.sh production | grep redis
```

### Schritt 4: Rollback (falls Deployment-Problem)

```bash
# Via Railway Dashboard
# Service → Deployments → Rollback

# Oder via GitHub Actions
# Deploy Production Workflow → Rollback
```

### Schritt 5: Scale Up (falls Resource-Problem)

```bash
# Railway Dashboard
# Service → Settings → Resources → Increase
```

## Prävention

1. **Health Checks** - Kontinuierliche Überwachung
2. **Resource Monitoring** - CPU/Memory Alerts
3. **Error Tracking** - Sentry Integration
4. **Automated Rollback** - Bei Fehlern
5. **Load Testing** - Regelmäßige Tests

## Post-Mortem

Nach Lösung des Problems:

1. Dokumentiere Root Cause
2. Erstelle GitHub Issue mit Lessons Learned
3. Update Runbook falls nötig
4. Implementiere Präventionsmaßnahmen












