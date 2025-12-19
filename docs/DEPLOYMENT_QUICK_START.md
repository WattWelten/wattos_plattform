# Railway Deployment - Quick Start Guide

**Schnellstart-Anleitung für automatisierte Railway Deployments**

## Voraussetzungen

1. **Railway CLI installieren:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Railway authentifizieren:**
   ```bash
   railway login
   ```

3. **jq installieren:**
   ```bash
   # macOS
   brew install jq
   
   # Linux
   sudo apt-get install jq
   
   # Windows (Git Bash/WSL)
   # Siehe: https://stedolan.github.io/jq/download/
   ```

4. **curl installieren** (meist bereits vorhanden):
   ```bash
   # macOS/Linux: Bereits installiert
   # Windows: Mit Git Bash oder WSL
   ```

## Schnellstart

### Option 0: Erstes Setup (Einmalig)

**WICHTIG:** Führe dies vor dem ersten Deployment aus!

```bash
# 1. Secrets vorbereiten
cp scripts/railway-secrets-template.env .railway-secrets.env
# Bearbeite .railway-secrets.env und fülle die Werte aus

# 2. Vollständiges Setup (Infrastructure, Services, ENV-Vars)
./scripts/setup-railway-complete.sh production
```

Das Setup-Script führt automatisch aus:
- ✅ Infrastructure Setup (PostgreSQL, Redis)
- ✅ Services Setup (Prüfung und Verlinkung)
- ✅ Railway Configs generieren
- ✅ Environment Variables Setup
- ✅ Service URLs Synchronisation
- ✅ Post-Setup Validierung

**Siehe auch:** [RAILWAY_AUTOMATED_SETUP.md](./RAILWAY_AUTOMATED_SETUP.md) für detaillierte Anleitung

### Option 1: Vollautomatisches Deployment (Empfohlen)

```bash
# 1. Alle Schritte automatisch
./scripts/deploy-railway.sh production
```

Das Script führt automatisch aus:
- ✅ Pre-Deployment Validierung
- ✅ Railway Configs generieren
- ✅ Services deployen (in korrekter Reihenfolge)
- ✅ Service URLs synchronisieren
- ✅ Post-Deployment Health Checks

### Option 2: Schritt-für-Schritt

```bash
# 1. Validierung
./scripts/validate-pre-deployment.sh production

# 2. Configs generieren
./scripts/generate-railway-configs.sh

# 3. Deployen
./scripts/deploy-railway.sh production

# 4. Health Check (optional)
./scripts/post-deployment-health-check.sh production
```

### Option 3: Nur bestimmten Service deployen

```bash
# Nur Chat Service
./scripts/deploy-railway.sh production chat-service
```

## GitHub Actions (CI/CD)

### Automatisches Deployment

Bei Push zu `main` oder `production` Branch wird automatisch deployed.

### Manuelles Deployment

1. Gehe zu GitHub → Actions
2. Wähle "Deploy to Railway"
3. Klicke "Run workflow"
4. Wähle Parameter:
   - **Environment**: `production` oder `staging`
   - **Service**: Leer für alle, oder spezifischer Service
   - **Skip Validation**: Optional (nicht empfohlen)
   - **Skip Health Check**: Optional

## Häufige Probleme

### Problem: "Railway CLI is not installed"

**Lösung:**
```bash
npm install -g @railway/cli
```

### Problem: "Railway CLI not authenticated"

**Lösung:**
```bash
railway login
```

### Problem: "jq is required but not installed"

**Lösung:**
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

### Problem: Service Deployment schlägt fehl

**Lösung:**
1. Prüfe Logs: `railway logs --service <service-name>`
2. Prüfe Status: `railway service <service-name>`
3. Prüfe ENV-Variablen: `railway variables --service <service-name>`

### Problem: Health Check schlägt fehl

**Lösung:**
1. Warte länger (Services brauchen Zeit zum Starten):
   ```bash
   ./scripts/post-deployment-health-check.sh production 10 20
   ```
2. Prüfe Service-URL: `railway variables --service <service-name> | grep URL`

## Nützliche Commands

### Service Logs anzeigen
```bash
railway logs --service <service-name>
```

### Service Status prüfen
```bash
railway service <service-name>
```

### Environment Variables anzeigen
```bash
railway variables --service <service-name>
```

### Service URLs synchronisieren
```bash
./scripts/sync-service-urls.sh production
```

### Health Check manuell
```bash
./scripts/post-deployment-health-check.sh production
```

## Deployment-Reihenfolge

Services werden automatisch in folgender Reihenfolge deployed:

1. **Priority 1** (Kritisch):
   - API Gateway
   - LLM Gateway

2. **Priority 2** (Wichtig):
   - Tool Service
   - RAG Service
   - Chat Service
   - Agent Service

3. **Priority 3** (Optional):
   - Customer Intelligence Service
   - Crawler Service
   - Voice Service

4. **Priority 4** (Zusätzlich):
   - Admin Service
   - Character Service
   - Summary Service
   - Feedback Service
   - Avatar Service
   - Ingestion Service

5. **Priority 5** (Workers):
   - Metaverse Service
   - Agent Worker
   - Document Worker

## Nächste Schritte

1. ✅ Pipeline testen mit Staging Environment
2. ✅ Monitoring einrichten
3. ✅ Alerts konfigurieren
4. ✅ Rollback-Mechanismus implementieren

## Weitere Dokumentation

- [AUTOMATED_DEPLOYMENT.md](./AUTOMATED_DEPLOYMENT.md) - Vollständige Dokumentation
- [DEPLOYMENT_RAILWAY.md](./DEPLOYMENT_RAILWAY.md) - Railway Deployment Details
- [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md) - Troubleshooting Guide




