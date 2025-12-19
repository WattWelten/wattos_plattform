# Railway Automatisiertes Setup

**Datum:** 2025-01-02  
**Status:** ✅ Vollständig implementiert  
**Projekt ID:** `a97f01bc-dc80-4941-b911-ed7ebb3efa7a`

## Übersicht

Diese Anleitung beschreibt das vollständig automatisierte Setup für Railway Deployment. Alle Schritte werden durch Scripts automatisiert, sodass ein One-Click-Setup möglich ist.

## Voraussetzungen

### Erforderlich

- **Railway Account** (https://railway.app)
- **Railway CLI** installiert: `npm install -g @railway/cli`
- **Node.js** >= 18.0.0 (für JSON-Parsing und Config-Generierung)
- **Git Repository** mit der Plattform

### Optional

- **jq** (für erweiterte JSON-Parsing-Funktionen)
- **Bash** (Git Bash auf Windows, WSL auf Windows)

## Schnellstart

### 1. Secrets vorbereiten

```bash
# Kopiere Template
cp scripts/railway-secrets-template.env .railway-secrets.env

# Bearbeite .railway-secrets.env und fülle die Werte aus
# WICHTIG: Füge .railway-secrets.env zu .gitignore hinzu!
```

**Erforderliche Secrets:**

- `RAILWAY_TOKEN` - Railway API Token
- `JWT_SECRET` - JWT Secret (mindestens 32 Zeichen)
- `OPENAI_API_KEY` - OpenAI API Key (mindestens ein LLM Provider)

**Optionale Secrets:**

- `ANTHROPIC_API_KEY` - Anthropic API Key
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API Key
- `ELEVENLABS_API_KEY` - ElevenLabs API Key (für Voice Service)
- `CORS_ORIGIN` - Frontend URL für CORS

### 2. Vollständiges Setup ausführen

```bash
# Vollständiges Setup (alle Schritte)
./scripts/setup-railway-complete.sh production

# Oder Schritt-für-Schritt:
./scripts/setup-railway-infrastructure.sh production
./scripts/setup-railway-services.sh production
node scripts/generate-railway-configs.js
./scripts/setup-railway-env-vars.sh production
./scripts/sync-service-urls.sh production
```

### 3. Validierung

```bash
# Pre-Deployment Validierung
./scripts/validate-pre-deployment.sh production
```

### 4. Deployment

```bash
# Deploye alle Services
./scripts/deploy-railway.sh production

# Oder nur bestimmten Service
./scripts/deploy-railway.sh production chat-service
```

### 5. Health Checks

```bash
# Post-Deployment Health Checks
./scripts/post-deployment-health-check.sh production
```

## Detaillierte Beschreibung

### Schritt 1: Infrastructure Setup

**Script:** `scripts/setup-railway-infrastructure.sh`

**Funktionen:**

- Prüft ob PostgreSQL Service existiert
- Erstellt PostgreSQL Service falls nicht vorhanden
- Prüft ob Redis Service existiert
- Erstellt Redis Service falls nicht vorhanden
- Extrahiert Connection Strings (DATABASE_URL, REDIS_URL)
- Setzt als Shared Variables

**Verwendung:**

```bash
./scripts/setup-railway-infrastructure.sh production
```

**Idempotent:** Ja - kann mehrfach ausgeführt werden

### Schritt 2: Services Setup

**Script:** `scripts/setup-railway-services.sh`

**Funktionen:**

- Prüft ob alle Services in Railway existieren
- Verlinkt Services mit Railway Projekt
- Validiert Service-Konfiguration
- Sortiert Services nach Priority

**Hinweis:** Services sind bereits in Railway erstellt, müssen aber möglicherweise verlinkt werden.

**Verwendung:**

```bash
./scripts/setup-railway-services.sh production
```

**Idempotent:** Ja - kann mehrfach ausgeführt werden

### Schritt 3: Railway Configs generieren

**Script:** `scripts/generate-railway-configs.js`

**Funktionen:**

- Generiert service-spezifische `railway.json` Dateien
- Basierend auf `scripts/services-config.json`
- Service-typ-basierte Scaling-Konfiguration
- Priority-basierte Resource Limits

**Verwendung:**

```bash
node scripts/generate-railway-configs.js
```

**Output:**

- `apps/gateway/railway.json`
- `apps/services/*/railway.json`
- `apps/workers/*/railway.json`

### Schritt 4: Environment Variables Setup

**Script:** `scripts/setup-railway-env-vars.sh`

**Funktionen:**

- Liest Environment Variables aus `scripts/services-config.json`
- Setzt Shared Variables (NODE_ENV, DEPLOYMENT_PLATFORM)
- Setzt Service-spezifische Variables
- Lädt Secrets aus `.railway-secrets.env` (falls vorhanden)
- Unterstützt Default-Werte aus Config
- Interaktive Eingabe für erforderliche Secrets

**Verwendung:**

```bash
./scripts/setup-railway-env-vars.sh production
```

**Idempotent:** Ja - überschreibt nur wenn nötig

### Schritt 5: Service URLs Synchronisation

**Script:** `scripts/sync-service-urls.sh`

**Funktionen:**

- Synchronisiert Service URLs als Environment Variables
- Setzt Service Discovery URLs für alle Services
- Verwendet Shared Variables für bessere Wiederverwendbarkeit

**Verwendung:**

```bash
./scripts/sync-service-urls.sh production
```

**Hinweis:** Sollte nach jedem Deployment ausgeführt werden, wenn Service URLs sich ändern.

### Schritt 6: Vollständiges Setup (Master-Script)

**Script:** `scripts/setup-railway-complete.sh`

**Funktionen:**

- Orchestriert alle Setup-Schritte
- Führt Validierung durch
- Gibt Zusammenfassung aus

**Verwendung:**

```bash
# Vollständiges Setup
./scripts/setup-railway-complete.sh production

# Ohne Validierung
./scripts/setup-railway-complete.sh production true
```

## Troubleshooting

### Problem: Railway CLI nicht installiert

**Lösung:**

```bash
npm install -g @railway/cli
```

### Problem: Nicht bei Railway eingeloggt

**Lösung:**

```bash
railway login
# Oder mit Token:
echo "$RAILWAY_TOKEN" | railway login --token-stdin
```

### Problem: Services nicht gefunden

**Lösung:**

Services müssen im Railway Dashboard erstellt werden:
https://railway.app/project/a97f01bc-dc80-4941-b911-ed7ebb3efa7a

**Oder manuell:**

```bash
railway service create <service-name>
```

### Problem: Environment Variables werden nicht gesetzt

**Lösung:**

1. Prüfe ob Service existiert: `railway service list`
2. Prüfe ob Service verlinkt ist: `railway link`
3. Prüfe Railway CLI Version: `railway --version`
4. Aktualisiere Railway CLI: `npm install -g @railway/cli@latest`

### Problem: Secrets werden nicht geladen

**Lösung:**

1. Prüfe ob `.railway-secrets.env` existiert
2. Prüfe ob Datei lesbar ist: `cat .railway-secrets.env`
3. Prüfe ob Secrets korrekt formatiert sind (keine Leerzeichen um `=`)
4. Setze Secrets manuell als Environment Variables

### Problem: Service URLs können nicht synchronisiert werden

**Lösung:**

1. Prüfe ob Services deployed sind
2. Prüfe ob Services öffentliche URLs haben
3. Führe `sync-service-urls.sh` nach Deployment aus
4. Setze URLs manuell in Railway Dashboard

## Manuelle Schritte (falls nötig)

### Railway Token generieren

1. Gehe zu Railway Dashboard → Settings → Tokens
2. Klicke auf "New Token"
3. Kopiere Token und füge zu `.railway-secrets.env` hinzu

### JWT Secret generieren

```bash
# Generiere zufälliges Secret
openssl rand -base64 32

# Oder mit Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Services manuell erstellen

Falls Scripts Services nicht finden:

```bash
# Für jeden Service
railway service create <service-name>

# Services:
# - api-gateway
# - chat-service
# - rag-service
# - agent-service
# - llm-gateway
# - tool-service
# - customer-intelligence-service
# - crawler-service
# - voice-service
# - avatar-service
# - character-service
# - feedback-service
# - summary-service
# - admin-service
# - ingestion-service
# - metaverse-service
# - agent-worker
# - document-worker
```

## Nächste Schritte nach Setup

1. **Pre-Deployment Validierung:**
   ```bash
   ./scripts/validate-pre-deployment.sh production
   ```

2. **Erstes Deployment:**
   ```bash
   ./scripts/deploy-railway.sh production
   ```

3. **Health Checks:**
   ```bash
   ./scripts/post-deployment-health-check.sh production
   ```

4. **Frontend konfigurieren:**
   Siehe [FRONTEND_DEPLOYMENT.md](./FRONTEND_DEPLOYMENT.md)

## Weitere Dokumentation

- [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md) - Schnellstart-Anleitung
- [RAILWAY_SETUP_CHECKLIST.md](./RAILWAY_SETUP_CHECKLIST.md) - Setup-Checklist
- [DEPLOYMENT_RAILWAY.md](./DEPLOYMENT_RAILWAY.md) - Detaillierte Railway-Dokumentation
- [AUTOMATED_DEPLOYMENT.md](./AUTOMATED_DEPLOYMENT.md) - Deployment-Pipeline-Dokumentation

## Support

Bei Problemen:

1. Prüfe [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md)
2. Führe Analyse-Script aus: `./scripts/analyze-railway-deployment.sh production`
3. Prüfe Railway Logs: `railway logs --service <service-name>`

---

**Letzte Aktualisierung:** 2025-01-02  
**Version:** 1.0.0






