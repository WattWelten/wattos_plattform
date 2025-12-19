# Automatisierter Deployment-Workflow - Erklärung

## Übersicht

Der automatische Deployment-Workflow für Railway läuft über GitHub Actions und wird automatisch bei jedem Push zu `main` oder `production` getriggert.

## Workflow-Trigger

Der Workflow wird automatisch ausgelöst bei:
- **Push zu `main` oder `production` Branch**
- Nur wenn Änderungen in folgenden Pfaden:
  - `apps/**` (Service-Code)
  - `packages/**` (Shared Packages)
  - `scripts/**` (Deployment-Scripts)
  - `.github/workflows/deploy-railway.yml` (Workflow selbst)

- **Manueller Trigger** (`workflow_dispatch`)
  - Kann über GitHub Actions UI manuell gestartet werden
  - Optionen: Service-Filter, Environment, Skip-Validation, Skip-Health-Check

## Workflow-Phasen

### Phase 1: Pre-Deployment Validierung

**Job:** `validate`

- Prüft Railway CLI Installation
- Prüft Authentifizierung
- Validiert Environment Variables
- Prüft Service-Konfigurationen
- Prüft Dependencies

**Bei Fehler:** Workflow stoppt (außer `skip_validation=true`)

### Phase 2: Config-Generierung

**Job:** `generate-configs`

- Generiert `railway.json` Dateien für alle Services
- Basierend auf `scripts/services-config.json`
- Upload als Artifact für nachfolgende Jobs

**Output:** `railway-configs` Artifact

### Phase 3: Pre-Deployment URL-Sync

**Job:** `sync-urls-pre`

- Synchronisiert Service-URLs vor Deployment
- Setzt Service Discovery URLs
- Optional (continue-on-error: true)

### Phase 4: Service-Deployment

**Job:** `deploy-services` (Matrix-Strategy)

**Parallele Deployments** für alle Services:

**Priority 1 (Kritisch):**
- `api-gateway`
- `llm-gateway`

**Priority 2 (Wichtig):**
- `tool-service`
- `rag-service`
- `chat-service`
- `agent-service`

**Priority 3 (Optional):**
- `customer-intelligence-service`
- `crawler-service`
- `voice-service`

**Priority 4 (Optional):**
- `admin-service`
- `character-service`
- `summary-service`
- `feedback-service`
- `avatar-service`
- `ingestion-service`

**Priority 5 (Optional):**
- `metaverse-service`

**Deployment-Schritte pro Service:**
1. Railway CLI installieren
2. Railway authentifizieren (`railway login`)
3. Project verlinken (`railway link`)
4. Service verlinken (`railway link --service`)
5. Deploy (`railway up --service` oder `railway deploy --service`)

**Strategie:**
- `fail-fast: false` - Ein fehlgeschlagener Service stoppt nicht die anderen
- Parallele Ausführung für schnellere Deployments

### Phase 5: Post-Deployment URL-Sync

**Job:** `sync-urls-post`

- Wartet 60s auf Service-Start
- Synchronisiert Service-URLs nach Deployment
- Setzt Service Discovery URLs
- Optional (continue-on-error: true)

### Phase 6: Health Checks

**Job:** `health-check`

- Wartet 90s auf vollständigen Service-Start
- Führt Health-Checks für alle Services durch
- Prüft `/health`, `/health/liveness`, `/health/readiness`
- Optional (continue-on-error: true)

### Phase 7: Deployment Summary

**Job:** `deployment-summary`

- Generiert Zusammenfassung
- Zeigt Status aller Phasen
- Gibt nächste Schritte aus

## Authentifizierung

**Railway Token:**
- Gespeichert in GitHub Secrets als `RAILWAY_TOKEN`
- Wird in jedem Job als Environment Variable gesetzt
- Authentifizierung via `echo "$RAILWAY_TOKEN" | railway login`

**Project ID:**
- Optional in GitHub Secrets als `RAILWAY_PROJECT_ID`
- Default-Wert: `a97f01bc-dc80-4941-b911-ed7ebb3efa7a` (falls nicht in Secrets gesetzt)
- Wird für Project-Link verwendet

## Fehlerbehandlung

### Continue-on-Error
- URL-Sync Jobs: `continue-on-error: true` (nicht kritisch)
- Health Checks: `continue-on-error: true` (nur Monitoring)

### Fail-Fast
- Pre-Deployment Validation: Stoppt bei Fehlern (außer skip_validation)
- Config-Generation: Stoppt bei Fehlern
- Service-Deployment: `fail-fast: false` (ein Service-Fehler stoppt nicht andere)

## Deployment-Status

### Erfolgreich
- Alle Services deployed
- Health Checks bestanden
- Service URLs synchronisiert

### Teilweise erfolgreich
- Einige Services deployed
- Einige Health Checks fehlgeschlagen
- Workflow läuft weiter

### Fehlgeschlagen
- Pre-Deployment Validation fehlgeschlagen
- Config-Generation fehlgeschlagen
- Kritische Services fehlgeschlagen

## Monitoring

### GitHub Actions
- Workflow-Status in GitHub Actions UI
- Logs für jeden Job verfügbar
- Deployment Summary als Step Summary

### Railway Dashboard
- Service-Status in Railway Dashboard
- Deployment-Logs pro Service
- Service-URLs und Health-Status

## Manueller Trigger

### Über GitHub Actions UI

1. Gehe zu: https://github.com/WattWelten/wattos-ki/actions/workflows/deploy-railway.yml
2. Klicke "Run workflow"
3. Wähle:
   - **Branch:** `main` oder `production`
   - **Service:** (leer für alle, oder spezifischer Service)
   - **Environment:** `production` oder `staging`
   - **Skip Validation:** `true`/`false`
   - **Skip Health Check:** `true`/`false`
4. Klicke "Run workflow"

### Über GitHub CLI

```bash
gh workflow run deploy-railway.yml \
  -f environment=production \
  -f service="" \
  -f skip_validation=false \
  -f skip_health_check=false
```

## Troubleshooting

### "Railway authentication failed"

**Problem:** Railway CLI ist nicht authentifiziert

**Lösung:**
- Prüfe ob `RAILWAY_TOKEN` in GitHub Secrets gesetzt ist
- Prüfe ob Token gültig ist
- Workflow wurde korrigiert: Authentifizierung in jedem Job

### "Service not found"

**Problem:** Service existiert nicht in Railway

**Lösung:**
- Service wird automatisch erstellt bei erstem Deployment
- Oder manuell erstellen: `railway service create <service-name>`

### "Deployment failed"

**Problem:** Service-Deployment fehlgeschlagen

**Lösung:**
- Prüfe Railway Logs: `railway logs --service <service-name>`
- Prüfe Build-Logs im Railway Dashboard
- Prüfe Environment Variables
- Prüfe `railway.json` Konfiguration

### "Health Check failed"

**Problem:** Service startet nicht oder Health-Endpoint nicht erreichbar

**Lösung:**
- Prüfe Service-Logs
- Prüfe ob Service läuft: `railway service <service-name>`
- Prüfe Health-Endpoint: `curl https://<service-url>/health`
- Warte länger (Service braucht Zeit zum Starten)

## Best Practices

1. **Regelmäßige Deployments:** Deploye nach jedem wichtigen Commit
2. **Monitoring:** Prüfe Deployment-Status nach jedem Deployment
3. **Health Checks:** Führe Health Checks nach jedem Deployment durch
4. **Log-Analyse:** Analysiere Logs bei Fehlern
5. **Staging First:** Teste in Staging vor Production

## Nächste Schritte

1. **Workflow läuft automatisch** bei Push zu `main`
2. **Prüfe Status** in GitHub Actions
3. **Prüfe Railway Dashboard** für Service-Status
4. **Führe Health Checks durch** nach Deployment
5. **Analysiere Logs** bei Problemen

