# Railway Deployment Failure Analysis

**Datum:** 2025-12-02  
**Projekt:** WattOS-KI  
**Projekt-ID:** a97f01bc-dc80-4941-b911-ed7ebb3efa7a  
**Status:** Alle 17 Services im "Failed" Status (vor 6 Tagen)

## Übersicht

Alle Services im Railway Dashboard zeigen den Status "Failed (6 days ago)". Dies deutet auf ein systematisches Problem hin, das alle Services betrifft.

## Betroffene Services

1. `@wattweiser/avatar-service`
2. `@wattweiser/character-service`
3. `@wattweiser/llm-gateway`
4. `@wattweiser/agent-service`
5. `@wattweiser/metaverse-service`
6. `@wattweiser/voice-service`
7. `@wattweiser/chat-service`
8. `@wattweiser/admin-service`
9. `@wattweiser/customer-intelligence-service`
10. `@wattweiser/tool-service`
11. `@wattweiser/rag-service`
12. `@wattweiser/ingestion-service`
13. `@wattweiser/feedback-service`
14. `@wattweiser/gateway`
15. `@wattweiser/summary-service`
16. `@wattweiser/crawler-service`
17. `@wattweiser/web`

## Mögliche Ursachen

### 1. Build-Fehler
**Symptom:** Alle Services schlagen beim Build fehl

**Häufige Ursachen:**
- Falscher Build-Command
- Fehlende Dependencies
- TypeScript Compilation Errors
- Monorepo-Build-Probleme

**Diagnose:**
```bash
# Für jeden Service die Build-Logs prüfen
railway logs --service <service-name> | grep -i "build\|compile\|error"
```

**Lösung:**
- Prüfe `railway.json` Build-Command
- Stelle sicher, dass `npm install` oder `pnpm install` ausgeführt wird
- Prüfe ob `dist/` Verzeichnis nach Build existiert

### 2. Start-Command Fehler
**Symptom:** Build erfolgreich, aber Service startet nicht

**Häufige Ursachen:**
- Falscher Start-Command in `railway.json`
- `dist/main.js` existiert nicht
- Port-Konflikte
- Fehlende Environment Variables

**Diagnose:**
```bash
# Prüfe Start-Command
railway service <service-name> --json | jq '.startCommand'

# Prüfe Logs auf Start-Fehler
railway logs --service <service-name> | grep -i "cannot.*start\|failed.*start\|error"
```

**Lösung:**
- Korrigiere `startCommand` in `railway.json`:
  ```json
  {
    "deploy": {
      "startCommand": "cd apps/gateway && node dist/main"
    }
  }
  ```

### 3. Environment Variables fehlen
**Symptom:** Service startet, aber crasht sofort

**Häufige Ursachen:**
- `DATABASE_URL` fehlt
- `REDIS_URL` fehlt
- `DEPLOYMENT_PLATFORM` nicht gesetzt
- Service Discovery URLs fehlen

**Diagnose:**
```bash
# Prüfe Environment Variables
railway variables --service <service-name>

# Prüfe Logs auf Missing Variables
railway logs --service <service-name> | grep -i "undefined\|missing\|required"
```

**Lösung:**
```bash
# Setze kritische Variablen
railway variables set DATABASE_URL=$DATABASE_URL --service <service-name>
railway variables set REDIS_URL=$REDIS_URL --service <service-name>
railway variables set DEPLOYMENT_PLATFORM=railway --service <service-name>
```

### 4. Monorepo-Build-Probleme
**Symptom:** Build schlägt fehl wegen Workspace-Dependencies

**Häufige Ursachen:**
- `pnpm install` wird nicht ausgeführt
- Workspace-Dependencies werden nicht aufgelöst
- Build-Order-Probleme

**Lösung:**
- Stelle sicher, dass Build-Command im Root-Verzeichnis startet
- Verwende `pnpm install` vor Build
- Prüfe `turbo.json` für Build-Konfiguration

### 5. Resource Limits
**Symptom:** Service startet, aber wird sofort beendet

**Häufige Ursachen:**
- Memory Limit überschritten
- CPU Limit überschritten
- Timeout beim Start

**Lösung:**
- Erhöhe Resource Limits in Railway Dashboard
- Prüfe Service-Logs auf OOM (Out of Memory) Fehler

## Schritt-für-Schritt Diagnose

### Schritt 1: Railway CLI verlinken
```bash
# Interaktiv verlinken
railway link

# Oder mit Projekt-ID (falls unterstützt)
railway link --project a97f01bc-dc80-4941-b911-ed7ebb3efa7a
```

### Schritt 2: Einen Service detailliert prüfen
```bash
# Wähle einen kritischen Service (z.B. gateway)
railway service gateway

# Prüfe Logs
railway logs --service gateway --tail 200

# Prüfe Environment Variables
railway variables --service gateway

# Prüfe Deployment-Status
railway service gateway --json | jq '.status'
```

### Schritt 3: Build-Logs analysieren
```bash
# Suche nach Build-Fehlern
railway logs --service gateway | grep -i "build\|compile\|npm\|pnpm" | tail -50

# Prüfe auf TypeScript Errors
railway logs --service gateway | grep -i "typescript\|tsc\|error TS"
```

### Schritt 4: Start-Logs analysieren
```bash
# Suche nach Start-Fehlern
railway logs --service gateway | grep -i "start\|listen\|port\|error" | tail -50

# Prüfe auf Missing Dependencies
railway logs --service gateway | grep -i "cannot find\|module.*not found"
```

### Schritt 5: Environment Variables prüfen
```bash
# Liste alle Variablen
railway variables --service gateway

# Prüfe kritische Variablen
railway variables --service gateway | grep -E "DATABASE_URL|REDIS_URL|DEPLOYMENT_PLATFORM"
```

## Empfohlene Fix-Strategie

### Phase 1: Einzelnen Service reparieren (Gateway)
1. **Railway CLI verlinken:**
   ```bash
   railway link
   ```

2. **Gateway Service prüfen:**
   ```bash
   railway service gateway
   railway logs --service gateway --tail 200
   ```

3. **Probleme identifizieren und beheben:**
   - Build-Command korrigieren
   - Start-Command korrigieren
   - Environment Variables setzen

4. **Gateway neu deployen:**
   ```bash
   railway up --service gateway
   ```

### Phase 2: Template für andere Services
Sobald Gateway funktioniert:
1. Dokumentiere funktionierende Konfiguration
2. Wende gleiche Konfiguration auf andere Services an
3. Deploye Services nacheinander

### Phase 3: Service Discovery konfigurieren
Sobald Services laufen:
```bash
./scripts/sync-service-urls.sh production
```

## Häufige Fehler-Patterns

### Pattern 1: "Cannot find module"
**Ursache:** Dependencies nicht installiert oder Workspace-Problem

**Fix:**
```bash
# Stelle sicher, dass Build-Command installiert
railway variables set BUILD_COMMAND="pnpm install && pnpm run build" --service <service>
```

### Pattern 2: "Port already in use"
**Ursache:** Hardcoded Port statt `process.env.PORT`

**Fix:**
```typescript
// ✅ Richtig
const port = process.env.PORT || 3001;

// ❌ Falsch
const port = 3001;
```

### Pattern 3: "Database connection failed"
**Ursache:** `DATABASE_URL` fehlt oder falsch

**Fix:**
```bash
railway variables set DATABASE_URL=$DATABASE_URL --service <service>
```

### Pattern 4: "Service not found" (Service Discovery)
**Ursache:** Service Discovery URLs fehlen

**Fix:**
```bash
./scripts/sync-service-urls.sh production
```

## Nächste Schritte

1. **Railway CLI verlinken:**
   ```bash
   railway link
   ```

2. **Gateway Service analysieren:**
   ```bash
   railway logs --service gateway --tail 200 > gateway-logs.txt
   # Analysiere gateway-logs.txt
   ```

3. **Probleme beheben:**
   - Basierend auf Log-Analyse
   - Beginne mit Gateway (kritischster Service)

4. **Erfolgreiche Konfiguration dokumentieren:**
   - Erstelle Template für andere Services
   - Wende auf alle Services an

5. **Services nacheinander deployen:**
   - Gateway → LLM Gateway → Chat Service → etc.

## Tools & Scripts

- **Analyse-Script:** `./scripts/analyze-railway-deployment.sh production`
- **Service URL Sync:** `./scripts/sync-service-urls.sh production`
- **Troubleshooting Guide:** `docs/RAILWAY_TROUBLESHOOTING.md`

## Support

- Railway Dokumentation: https://docs.railway.app
- Railway Support: https://railway.app/help
- Deployment Guide: `docs/DEPLOYMENT_RAILWAY.md`









