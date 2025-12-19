# LLM Gateway Deployment Fix

## Problem-Analyse

**Service:** `@wattweiser/llm-gateway`  
**Commit:** `17b3a265`  
**Status:** ❌ Failed  
**Zeitpunkt:** Dec 3, 2025, 7:47 PM

## Identifizierte Probleme

### 1. ❌ Build-Command verwendet `npm` statt `pnpm`

**Problem:**
```json
"buildCommand": "cd apps/services/llm-gateway && npm install && npm run build"
```

**Lösung:**
```json
"buildCommand": "cd apps/services/llm-gateway && pnpm install && pnpm run build"
```

**Grund:** Das Projekt verwendet `pnpm` als Package Manager (siehe `packageManager: "pnpm@8.15.0"` in root `package.json`).

### 2. ❌ Port-Hardcoding in `main.ts`

**Problem:**
```typescript
const port = configService.get<number>('port', 3015);
```

**Lösung:**
```typescript
const port = configService.get<number>('port') || process.env.PORT || 3015;
```

**Grund:** Railway setzt automatisch `PORT` Environment Variable. Hardcoded Ports können zu Konflikten führen.

### 3. ⚠️ Fehlende Environment Variables

**Erforderliche Variablen:**
- `OPENAI_API_KEY` (kritisch!)
- `PORT` (Railway setzt automatisch)
- `NODE_ENV=production`
- `DEPLOYMENT_PLATFORM=railway`

**Prüfung:**
```bash
railway variables --service llm-gateway
```

### 4. ⚠️ Railway CLI nicht authentifiziert

**Problem:** Railway CLI kann Logs nicht abrufen.

**Lösung:**
```bash
railway login
railway link <PROJECT_ID>
```

## Implementierte Fixes

### ✅ Fix 1: Build-Command korrigiert

**Datei:** `scripts/services-config.json`

```json
"buildCommand": "cd apps/services/llm-gateway && pnpm install && pnpm run build",
"startCommand": "cd apps/services/llm-gateway && pnpm run start:prod",
```

### ✅ Fix 2: Port-Handling korrigiert

**Datei:** `apps/services/llm-gateway/src/main.ts`

```typescript
const port = configService.get<number>('port') || process.env.PORT || 3015;
```

## Nächste Schritte

### 1. Environment Variables prüfen

```bash
# Prüfe ob OPENAI_API_KEY gesetzt ist
railway variables --service llm-gateway | grep OPENAI_API_KEY

# Falls nicht gesetzt:
railway variables set OPENAI_API_KEY=<your-key> --service llm-gateway
```

### 2. Build lokal testen

```bash
cd apps/services/llm-gateway
pnpm install
pnpm build
pnpm start:prod
```

### 3. Railway-Konfiguration prüfen

**Prüfe `railway.json`:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/services/llm-gateway && pnpm install && pnpm run build"
  },
  "deploy": {
    "startCommand": "cd apps/services/llm-gateway && pnpm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 4. Redeploy Service

```bash
# Via Railway CLI
railway redeploy --service llm-gateway

# Oder via Railway Dashboard
# → Service → Deployments → Redeploy
```

## Erwartetes Verhalten nach Fix

1. ✅ Build erfolgreich (pnpm install + build)
2. ✅ Service startet auf Railway-PORT
3. ✅ Health Check erreichbar: `/health`
4. ✅ Service loggt erfolgreich: `🚀 LLM Gateway listening on http://localhost:${port}`

## Monitoring

**Nach erfolgreichem Deployment:**

1. **Health Check:**
   ```bash
   curl https://llm-gateway-<service-id>.railway.app/health
   ```

2. **Logs prüfen:**
   ```bash
   railway logs --service llm-gateway --tail 50
   ```

3. **Metrics prüfen:**
   - Railway Dashboard → Service → Metrics
   - CPU, Memory, Requests

## Referenzen

- [Railway Deployment Guide](../docs/DEPLOYMENT_RAILWAY.md)
- [Service Discovery](../docs/SERVICE_DISCOVERY.md)
- [LLM Gateway Documentation](../docs/LLM_GATEWAY.md)






