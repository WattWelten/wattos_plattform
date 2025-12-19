# Runbook: High Error Rate

## Symptome

- Error Rate >5% über 5 Minuten
- Viele 5xx Errors in Logs
- User Reports von Fehlern
- Service Degradation

## Diagnose

### 1. Prüfe Error Rate

```bash
# Log Analysis
./scripts/log-analyzer.sh analyze logs/
./scripts/log-analyzer.sh detect-errors logs/
```

### 2. Prüfe Error Patterns

```bash
# Finde häufigste Errors
grep -i "error\|exception\|failed" logs/*.log | sort | uniq -c | sort -rn | head -20
```

### 3. Prüfe Service Health

```bash
./scripts/health-check.sh production
```

### 4. Prüfe Dependencies

```bash
# Database
curl https://api.production.railway.app/api/health/db

# Redis
curl https://api.production.railway.app/api/health/redis
```

## Mögliche Ursachen

1. **Service Bug** - Neuer Code-Fehler
2. **Dependency Failure** - Database/Redis Down
3. **Rate Limiting** - Zu viele Requests
4. **Resource Exhaustion** - CPU/Memory
5. **External API Failure** - LLM API Down
6. **Configuration Error** - Falsche ENV Vars

## Lösung

### Schritt 1: Identifiziere Root Cause

```bash
# Prüfe Logs der letzten 10 Minuten
railway logs --service <service-name> --tail 500 | grep -i error

# Prüfe Error Patterns
./scripts/log-analyzer.sh analyze logs/
```

### Schritt 2: Prüfe Dependencies

```bash
# Database
./scripts/health-check.sh production | grep database

# Redis
./scripts/health-check.sh production | grep redis

# External APIs
curl https://api.openai.com/v1/models
```

### Schritt 3: Rollback (falls Deployment-Problem)

```bash
# Via Railway Dashboard
# Service → Deployments → Rollback

# Oder via GitHub Actions
# Deploy Production Workflow → Rollback
```

### Schritt 4: Scale Up (falls Resource-Problem)

```bash
# Railway Dashboard
# Service → Settings → Resources → Increase
```

### Schritt 5: Feature Flag (falls Feature-Problem)

```bash
# Deaktiviere Feature Flag
# Admin Dashboard → Feature Flags → Disable
```

## Prävention

1. **Error Tracking** - Sentry Integration
2. **Automated Alerts** - Error Rate Thresholds
3. **Load Testing** - Regelmäßige Tests
4. **Canary Deployments** - Gradual Rollout
5. **Feature Flags** - Emergency Kill Switch

## Post-Mortem

1. Dokumentiere Root Cause
2. Erstelle GitHub Issue
3. Update Runbook
4. Implementiere Fix












