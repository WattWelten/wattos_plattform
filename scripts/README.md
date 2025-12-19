# Deployment Scripts

Dieses Verzeichnis enthält alle Scripts für die automatisierte Railway Deployment Pipeline.

## Scripts Übersicht

### Core Scripts

#### `generate-railway-configs.sh` / `generate-railway-configs.js`
Generiert service-spezifische `railway.json` Dateien aus `services-config.json`.

**Verwendung:**
```bash
# Bash-Version (benötigt jq)
./scripts/generate-railway-configs.sh

# Node.js-Version (keine Dependencies)
node scripts/generate-railway-configs.js
```

#### `validate-pre-deployment.sh`
Führt umfassende Pre-Deployment Validierung durch.

**Verwendung:**
```bash
./scripts/validate-pre-deployment.sh [environment]
```

**Prüfungen:**
- Railway CLI Installation & Authentication
- Config-Dateien Validität
- Port-Konflikte
- Service Dependencies
- Build-Commands
- Environment Variables

#### `deploy-railway.sh`
Master-Deployment-Script, orchestriert alle Deployment-Schritte.

**Verwendung:**
```bash
# Alle Services deployen
./scripts/deploy-railway.sh production

# Nur bestimmten Service
./scripts/deploy-railway.sh production chat-service

# Ohne Validierung
./scripts/deploy-railway.sh production "" true

# Ohne Health Checks
./scripts/deploy-railway.sh production "" false true
```

#### `post-deployment-health-check.sh`
Prüft alle Services nach dem Deployment.

**Verwendung:**
```bash
./scripts/post-deployment-health-check.sh [environment] [max-retries] [retry-delay]
```

#### `sync-service-urls.sh`
Synchronisiert Service URLs zwischen Railway Services.

**Verwendung:**
```bash
./scripts/sync-service-urls.sh [environment]
```

### Konfiguration

#### `services-config.json`
Zentrale Konfigurationsdatei für alle Services.

**Struktur:**
- Service-Metadaten (name, type, port, path)
- Build- und Start-Commands
- Dependencies
- Environment Variables
- Deployment Priority

### Weitere Scripts

- `analyze-railway-deployment.sh` - Deployment-Analyse
- `check-railway-failures.sh` - Schnelle Fehlerprüfung
- `health-check.sh` - Health Check für Services
- `validate-config.sh` - Config-Validierung
- `validate-dependencies.sh` - Dependency-Validierung
- `validate-env-vars.sh` - Environment Variable Validierung

## Voraussetzungen

### Für Bash-Scripts:
- Railway CLI: `npm install -g @railway/cli`
- jq: `brew install jq` (macOS) oder `apt-get install jq` (Linux)
- Git Bash oder WSL (Windows)

### Für Node.js-Scripts:
- Node.js 18+ (keine weiteren Dependencies)

## Workflow

1. **Config generieren:**
   ```bash
   node scripts/generate-railway-configs.js
   ```

2. **Validierung:**
   ```bash
   ./scripts/validate-pre-deployment.sh production
   ```

3. **Deployment:**
   ```bash
   ./scripts/deploy-railway.sh production
   ```

4. **Health Check:**
   ```bash
   ./scripts/post-deployment-health-check.sh production
   ```

## Troubleshooting

### Script schlägt fehl wegen jq
**Lösung:** Verwende die Node.js-Version:
```bash
node scripts/generate-railway-configs.js
```

### Railway CLI nicht gefunden
**Lösung:**
```bash
npm install -g @railway/cli
railway login
```

### Port-Konflikte
**Lösung:** Prüfe `services-config.json` und passe Ports an.

## Weitere Dokumentation

- [AUTOMATED_DEPLOYMENT.md](../docs/AUTOMATED_DEPLOYMENT.md) - Vollständige Pipeline-Dokumentation
- [DEPLOYMENT_QUICK_START.md](../docs/DEPLOYMENT_QUICK_START.md) - Schnellstart-Anleitung
- [DEPLOYMENT_TEST_RESULTS.md](../docs/DEPLOYMENT_TEST_RESULTS.md) - Test-Ergebnisse









