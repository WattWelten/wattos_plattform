# Railway Deployment - Gefundene Probleme und Fixes

**Datum:** 2025-12-02  
**Status:** Alle 17 Services im "Failed" Status

## 🔴 Hauptproblem: Build-Fehler

### Problem 1: mypy Version nicht verfügbar

**Fehler:**
```
ERR_PNPM_NO_MATCHING_VERSION  No matching version found for mypy@^1.8.0
The latest release of mypy is "1.0.1"
```

**Betroffener Service:** `@wattweiser/ingestion-service`

**Fix:**
```json
// apps/services/ingestion-service/package.json
"devDependencies": {
  "ruff": "^0.1.9",
  "mypy": "^1.0.1"  // Geändert von ^1.8.0
}
```

**Status:** ✅ Behoben

---

## 📋 Weitere zu prüfende Probleme

### 1. Start-Command in railway.json

**Aktuell:**
```json
{
  "deploy": {
    "startCommand": "cd apps/gateway && node dist/main"
  }
}
```

**Problem:** Dieser Command ist nur für Gateway. Jeder Service braucht seinen eigenen Start-Command.

**Lösung:** Service-spezifische `railway.json` Dateien oder Build-Command, der automatisch den richtigen Service startet.

### 2. Build-Command fehlt

**Problem:** Kein Build-Command definiert - Railway weiß nicht, wie es die Services bauen soll.

**Lösung:** Build-Command in `railway.json` hinzufügen:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm run build"
  }
}
```

### 3. Monorepo-Build-Probleme

**Problem:** Railway baut das gesamte Monorepo, aber jeder Service braucht nur seinen eigenen Build.

**Lösung:** Service-spezifische Build-Commands:
- Gateway: `cd apps/gateway && npm run build`
- Chat Service: `cd apps/services/chat-service && npm run build`
- etc.

### 4. Environment Variables

**Fehlende Variablen (wahrscheinlich):**
- `DATABASE_URL`
- `REDIS_URL`
- `DEPLOYMENT_PLATFORM=railway`
- Service Discovery URLs

---

## 🛠️ Sofortige Fixes

### Fix 1: mypy Version korrigieren ✅

Bereits behoben in `apps/services/ingestion-service/package.json`

### Fix 2: Build-Command für Monorepo

**Option A: Service-spezifische railway.json**

Erstelle für jeden Service eine eigene `railway.json` im Service-Verzeichnis:

```json
// apps/gateway/railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/gateway && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/main",
    "healthcheckPath": "/health"
  }
}
```

**Option B: Root railway.json mit Service-Detection**

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm run build"
  },
  "deploy": {
    "startCommand": "node dist/main",
    "healthcheckPath": "/health"
  }
}
```

### Fix 3: Environment Variables setzen

```bash
# Für jeden Service
railway variables set DATABASE_URL=$DATABASE_URL --service @wattweiser/gateway
railway variables set REDIS_URL=$REDIS_URL --service @wattweiser/gateway
railway variables set DEPLOYMENT_PLATFORM=railway --service @wattweiser/gateway
```

---

## 📝 Nächste Schritte

1. **✅ mypy Fix anwenden** (bereits gemacht)
2. **Build-Command konfigurieren** - Service-spezifische railway.json oder Build-Command
3. **Environment Variables setzen** - Für alle Services
4. **Service Discovery URLs synchronisieren** - Nach erfolgreichem Deployment
5. **Einzelne Services testen** - Beginne mit Gateway

---

## 🔍 Detaillierte Analyse

Führe aus für vollständige Analyse:
```bash
./scripts/analyze-railway-deployment.sh production
```

Prüfe dann:
- `railway-analysis-*/analysis-report.md` - Übersicht
- `railway-analysis-*/{service-name}-logs.txt` - Service-Logs
- `railway-analysis-*/solutions.md` - Lösungsvorschläge









