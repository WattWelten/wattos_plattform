# Deployment Clean Strategy - Schritt-für-Schritt Anleitung

**Datum:** 2025-12-04  
**Status:** In Implementierung  
**Ziel:** Fehlerfreies, reproduzierbares Deployment für alle Services

## Übersicht

Diese Strategie implementiert einen "Clean Slate" Ansatz für Railway Deployments:
1. **Phase 1:** Lokale Validierung (Git)
2. **Phase 2:** Vereinfachter GitHub Actions Workflow
3. **Phase 3:** Railway Service für Service reparieren

## Phase 1: Lokale Validierung

### Schritt 1.1: Lokaler Build-Test

**Ziel:** Stelle sicher, dass alles lokal funktioniert, bevor wir auf Railway deployen.

```bash
# 1. Dependencies installieren
pnpm install --frozen-lockfile

# 2. Workspace Dependencies bauen
pnpm --filter '@wattweiser/shared...' build
pnpm --filter '@wattweiser/db...' build

# 3. Service bauen
pnpm --filter @wattweiser/llm-gateway build

# 4. Prüfe Build-Output
ls -lh apps/services/llm-gateway/dist/main.js
```

**Erfolgskriterien:**
- ✅ Alle Builds erfolgreich
- ✅ `dist/main.js` existiert
- ✅ Keine TypeScript-Fehler
- ✅ Keine fehlenden Dependencies

### Schritt 1.2: Git-Status bereinigen

```bash
# Prüfe Status
git status

# Committe alle Änderungen
git add -A
git commit -m "chore: Finalize deployment fixes before clean deployment"
git push origin main
```

## Phase 2: GitHub Actions vereinfachen

### Neuer Workflow: `deploy-railway-clean.yml`

**Prinzipien:**
- ✅ Keine `continue-on-error` bei kritischen Schritten
- ✅ Lokaler Build-Test VOR Railway Deployment
- ✅ Ein Service nach dem anderen (nicht parallel)
- ✅ Klare Fehlerbehandlung
- ✅ Health Check nach Deployment

**Verwendung:**
1. Gehe zu GitHub Actions
2. Wähle "Deploy to Railway (Clean - Single Service)"
3. Klicke "Run workflow"
4. Wähle Service (starte mit `llm-gateway`)
5. Wähle Environment (`production`)

**Workflow-Jobs:**
1. **validate-build:** Lokaler Build-Test (KRITISCH)
2. **deploy-service:** Railway Deployment (KRITISCH)
3. **verify-deployment:** Health Check & Logs (KRITISCH)

## Phase 3: Railway Service für Service reparieren

### Schritt 3.1: Service analysieren

**Für jeden Service:**

```bash
# Verwende Analyse-Script
./scripts/analyze-railway-service.sh llm-gateway
```

**Oder manuell:**
```bash
# Service-Status
railway service llm-gateway

# Service-Konfiguration
railway service llm-gateway --json | jq '{
  name: .name,
  status: .status,
  rootDirectory: .rootDirectory,
  buildCommand: .buildCommand,
  startCommand: .startCommand
}'

# Environment Variables
railway variables --service llm-gateway

# Logs
railway logs --service llm-gateway --tail 100
```

### Schritt 3.2: Probleme identifizieren

**Häufige Probleme:**

1. **Root Directory nicht gesetzt**
   - Problem: Railway verwendet root `railway.json` statt service-spezifischer
   - Lösung: Setze Root Directory im Railway Dashboard
   - Oder: Verwende root `railway.json` (wie bei `llm-gateway`)

2. **Build-Command falsch**
   - Problem: Dependencies werden nicht gebaut
   - Lösung: Korrigiere `buildCommand` in `railway.json`
   - Beispiel: `pnpm install --frozen-lockfile && pnpm --filter '@wattweiser/shared...' build && pnpm --filter '@wattweiser/db...' build && pnpm --filter @wattweiser/llm-gateway build`

3. **Start-Command falsch**
   - Problem: `dist/main.js` nicht gefunden
   - Lösung: Korrigiere `startCommand` in `railway.json`
   - Beispiel: `node apps/services/llm-gateway/dist/main`

4. **Environment Variables fehlen**
   - Problem: Service crasht beim Start
   - Lösung: Setze fehlende Variables im Railway Dashboard

### Schritt 3.3: Service reparieren

**Für `llm-gateway` (erster Service):**

1. **Prüfe Railway Dashboard:**
   - Service → Settings → Root Directory
   - Sollte leer sein (verwendet root `railway.json`)

2. **Prüfe `railway.json` (root):**
   ```json
   {
     "build": {
       "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter '@wattweiser/shared...' build && pnpm --filter '@wattweiser/db...' build && pnpm --filter @wattweiser/llm-gateway build"
     },
     "deploy": {
       "startCommand": "node apps/services/llm-gateway/dist/main"
     }
   }
   ```

3. **Deploye mit neuem Workflow:**
   - GitHub Actions → "Deploy to Railway (Clean - Single Service)"
   - Service: `llm-gateway`
   - Environment: `production`

4. **Prüfe Logs:**
   ```bash
   railway logs --service llm-gateway --tail 100
   ```

5. **Prüfe Health:**
   ```bash
   SERVICE_URL=$(railway service llm-gateway --json | jq -r '.url')
   curl "$SERVICE_URL/health"
   ```

### Schritt 3.4: Erfolgreiche Konfiguration dokumentieren

**Erstelle Template für andere Services:**

```markdown
# Service: llm-gateway
- Root Directory: (leer - verwendet root railway.json)
- Build Command: pnpm install --frozen-lockfile && pnpm --filter '@wattweiser/shared...' build && pnpm --filter '@wattweiser/db...' build && pnpm --filter @wattweiser/llm-gateway build
- Start Command: node apps/services/llm-gateway/dist/main
- Health Check: /health
- Status: ✅ Erfolgreich
```

### Schritt 3.5: Nächsten Service deployen

**Reihenfolge (nach Priorität):**
1. ✅ `llm-gateway` (erster Test)
2. `api-gateway` (kritisch)
3. `tool-service` (wichtig)
4. `rag-service` (wichtig)
5. `chat-service` (wichtig)
6. `agent-service` (wichtig)
7. ... (restliche Services)

**Für jeden Service:**
1. Analysiere mit `./scripts/analyze-railway-service.sh <service>`
2. Identifiziere Probleme
3. Behebe Probleme
4. Deploye mit neuem Workflow
5. Dokumentiere erfolgreiche Konfiguration

## Troubleshooting

### Problem: Build schlägt fehl

**Diagnose:**
```bash
railway logs --service <service> | grep -i "build\|error"
```

**Lösungen:**
1. Prüfe `buildCommand` in `railway.json`
2. Stelle sicher, dass Dependencies gebaut werden
3. Prüfe `pnpm-lock.yaml` (sollte committed sein)

### Problem: Service startet nicht

**Diagnose:**
```bash
railway logs --service <service> | grep -i "start\|error\|cannot"
```

**Lösungen:**
1. Prüfe `startCommand` in `railway.json`
2. Stelle sicher, dass `dist/main.js` existiert
3. Prüfe Port-Konfiguration (`process.env.PORT`)

### Problem: Health Check schlägt fehl

**Diagnose:**
```bash
SERVICE_URL=$(railway service <service> --json | jq -r '.url')
curl -v "$SERVICE_URL/health"
```

**Lösungen:**
1. Prüfe ob Health-Endpoint existiert (`/health`)
2. Prüfe Service-Logs auf Fehler
3. Prüfe Environment Variables

## Erfolgskriterien

**Für jeden Service:**
- ✅ Lokaler Build erfolgreich
- ✅ Railway Build erfolgreich
- ✅ Service startet erfolgreich
- ✅ Health Check erfolgreich (HTTP 200)
- ✅ Logs zeigen keine Fehler
- ✅ Konfiguration dokumentiert

## Nächste Schritte

1. ✅ Phase 1 abgeschlossen (lokale Validierung)
2. ✅ Phase 2 abgeschlossen (neuer Workflow)
3. 🔄 Phase 3 in Arbeit (Service für Service)
4. ⏳ Alle Services erfolgreich deployed
5. ⏳ Dokumentation als Template für zukünftige Services

## Referenzen

- Railway Dokumentation: https://docs.railway.app
- GitHub Actions: `.github/workflows/deploy-railway-clean.yml`
- Analyse-Script: `scripts/analyze-railway-service.sh`
- Railway Troubleshooting: `docs/RAILWAY_TROUBLESHOOTING.md`





