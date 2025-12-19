# LLM Gateway Deployment Pattern

## Erfolgreiche Konfiguration als Muster für alle Services

### Übersicht

Dieses Dokument beschreibt die erfolgreiche Deployment-Konfiguration für `llm-gateway` als Muster für alle anderen Services.

## Konfigurationsdateien

### 1. Root `railway.json`

**Pfad:** [railway.json](railway.json)

**Konfiguration:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @wattweiser/llm-gateway build"
  },
  "deploy": {
    "startCommand": "cd apps/services/llm-gateway && node dist/main",
    "healthcheckPath": "/health"
  }
}
```

**Wichtig:**
- Railway verwendet root `railway.json` wenn kein Root Directory im Dashboard gesetzt ist
- Build-Command verwendet `pnpm --filter` für Monorepo-Workspaces
- `--frozen-lockfile` stellt sicher, dass exakte Dependencies verwendet werden

### 2. Service-spezifische `railway.json`

**Pfad:** [apps/services/llm-gateway/railway.json](apps/services/llm-gateway/railway.json)

**Konfiguration:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @wattweiser/llm-gateway build"
  },
  "deploy": {
    "startCommand": "node dist/main",
    "healthcheckPath": "/health"
  }
}
```

**Wichtig:**
- Wird verwendet wenn Root Directory im Railway Dashboard gesetzt ist: `apps/services/llm-gateway`
- Start-Command ohne `cd` da Root Directory bereits gesetzt ist
- Build-Command identisch mit root für Konsistenz

### 3. Optional: `nixpacks.toml`

**Pfad:** [nixpacks.toml](nixpacks.toml)

**Zweck:**
- Explizite Kontrolle über Build-Prozess
- Überschreibt Railway/Nixpacks Auto-Detection
- Fallback wenn `railway.json` nicht funktioniert

## GitHub Actions Workflow

**Pfad:** [.github/workflows/deploy-railway-simple.yml](.github/workflows/deploy-railway-simple.yml)

**LLM Gateway spezifischer Deployment-Step:**
```yaml
- name: Deploy llm-gateway
  run: |
    # Verwende root railway.json (Monorepo-kompatibel)
    railway redeploy --service llm-gateway || \
    railway up --service llm-gateway --detach
```

**Wichtig:**
- `railway redeploy` für bestehende Deployments
- `railway up` als Fallback für neue Deployments
- Verwendet automatisch root `railway.json`

## Railway Dashboard Konfiguration

### Option A: Root Directory setzen (Empfohlen)

1. Railway Dashboard → Service `llm-gateway` → Settings
2. Root Directory: `apps/services/llm-gateway`
3. Dann wird `apps/services/llm-gateway/railway.json` verwendet

**Vorteile:**
- Service-spezifische Konfiguration
- Start-Command ohne `cd`
- Klarere Trennung zwischen Services

### Option B: Root railway.json verwenden (Aktuell)

1. Kein Root Directory gesetzt
2. Railway verwendet automatisch root `railway.json`
3. Build/Start-Commands müssen vollständige Pfade enthalten

**Vorteile:**
- Funktioniert ohne Dashboard-Änderungen
- Einheitliche Konfiguration im Root

## Environment Variables

**Erforderlich:**
- `OPENAI_API_KEY` (kritisch!)
- `PORT` (automatisch von Railway gesetzt)
- `NODE_ENV=production` (optional, Standard)
- `DEPLOYMENT_PLATFORM=railway` (optional, Standard)

**Setzen:**
```bash
railway variables set OPENAI_API_KEY=<key> --service llm-gateway
```

## Build-Prozess

### Lokaler Test

```bash
# 1. Dependencies installieren
pnpm install --frozen-lockfile

# 2. Service bauen
pnpm --filter @wattweiser/llm-gateway build

# 3. Service starten
cd apps/services/llm-gateway
node dist/main
```

### Railway Build

1. Railway erkennt `pnpm` (via `packageManager` in root `package.json`)
2. Führt `pnpm install --frozen-lockfile` aus (aus `railway.json`)
3. Führt `pnpm --filter @wattweiser/llm-gateway build` aus
4. Startet Service mit `cd apps/services/llm-gateway && node dist/main`

## Deployment-Prozess

### Automatisch (GitHub Integration)

1. Push zu `main` Branch
2. Railway GitHub Integration erkennt Push
3. Railway deployt automatisch (wenn "Wait for CI" deaktiviert)
4. Oder: Wartet auf erfolgreiche GitHub Actions (wenn "Wait for CI" aktiviert)

### Manuell (GitHub Actions)

1. GitHub Actions Workflow läuft
2. `railway redeploy --service llm-gateway`
3. Railway verwendet root `railway.json`
4. Build & Deploy

### Manuell (Railway Dashboard)

1. Railway Dashboard → Service → Redeploy
2. Wählt neuesten Commit
3. Build & Deploy

## Erfolgskriterien

✅ Build erfolgreich:
- `pnpm install --frozen-lockfile` erfolgreich
- `pnpm --filter @wattweiser/llm-gateway build` erfolgreich
- `dist/` Verzeichnis erstellt

✅ Service startet:
- Logs zeigen: `🚀 LLM Gateway listening on http://localhost:${PORT}`
- Keine Fehler in Logs

✅ Health Check funktioniert:
- `curl https://llm-gateway-<id>.railway.app/health`
- Antwort: `{"status":"ok","timestamp":"..."}`

## Anwendung auf andere Services

### Schritt 1: Service-spezifische railway.json erstellen

**Template:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @wattweiser/<service-name> build"
  },
  "deploy": {
    "startCommand": "node dist/main",
    "healthcheckPath": "/health"
  }
}
```

### Schritt 2: GitHub Actions Workflow anpassen

Falls Service-spezifische Logik benötigt wird, analog zu llm-gateway.

### Schritt 3: Railway Dashboard konfigurieren

- Root Directory: `apps/services/<service-name>`
- Environment Variables setzen
- Health Check aktivieren

## Troubleshooting

### Problem: Build schlägt fehl

**Symptom:** `ERR_PNPM_NO_LOCKFILE`

**Lösung:**
- Prüfe ob `pnpm-lock.yaml` existiert und committed ist
- Prüfe Build-Command: Muss `--frozen-lockfile` enthalten

### Problem: Service startet nicht

**Symptom:** Service crasht sofort

**Lösung:**
- Prüfe Start-Command: Korrekte Pfade?
- Prüfe Port-Handling: `process.env.PORT` Support?
- Prüfe Logs: Welcher Fehler?

### Problem: Health Check schlägt fehl

**Symptom:** `/health` gibt 404 oder Timeout

**Lösung:**
- Prüfe ob `/health` Endpoint existiert
- Prüfe Healthcheck-Pfad in `railway.json`
- Prüfe ob Service läuft

## Referenzen

- [Master Plan](./LLM_GATEWAY_DEPLOYMENT_MASTER_PLAN.md)
- [Deployment Checklist](./LLM_GATEWAY_DEPLOYMENT_CHECKLIST.md)
- [Deployment Fix](./LLM_GATEWAY_DEPLOYMENT_FIX.md)






