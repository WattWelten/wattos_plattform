# LLM Gateway Deployment Checklist

## ✅ Vor Deployment

### 1. Code & Konfiguration
- [x] `pnpm-lock.yaml` existiert und ist committed
- [x] Root `railway.json` korrigiert (Start-Command: `apps/services/llm-gateway`)
- [x] Build-Command: `pnpm --filter @wattweiser/llm-gateway build`
- [x] Port-Handling: `process.env.PORT` Support in `main.ts` und `configuration.ts`

### 2. Railway Dashboard Konfiguration

**Option A: Root Directory setzen (Empfohlen)**
- [ ] Railway Dashboard → Service `llm-gateway` → Settings
- [ ] Root Directory: `apps/services/llm-gateway`
- [ ] Dann wird `apps/services/llm-gateway/railway.json` verwendet

**Option B: Root railway.json verwenden (Aktuell)**
- [x] Root `railway.json` ist korrekt konfiguriert
- [x] Build/Start-Commands zeigen auf `apps/services/llm-gateway`

### 3. Environment Variables
- [ ] `OPENAI_API_KEY` gesetzt (kritisch!)
- [ ] `NODE_ENV=production` (optional, Standard)
- [ ] `DEPLOYMENT_PLATFORM=railway` (optional, Standard)
- [ ] `PORT` wird automatisch von Railway gesetzt

**Prüfung:**
```bash
railway variables --service llm-gateway
```

### 4. Lokaler Test
- [ ] `cd apps/services/llm-gateway`
- [ ] `pnpm install`
- [ ] `pnpm build` (erfolgreich)
- [ ] `pnpm start:prod` (Service startet)

## 🚀 Deployment

### 1. Automatisches Deployment
- [x] Push zu `main` → GitHub Integration deployt automatisch
- [ ] Prüfe Railway Dashboard → Deployments

### 2. Manuelles Deployment
- [ ] Railway Dashboard → Service → Redeploy

## ✅ Nach Deployment

### 1. Health Check
```bash
curl https://llm-gateway-<id>.railway.app/health
```

**Erwartete Antwort:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T..."
}
```

### 2. Logs prüfen
```bash
railway logs --service llm-gateway --tail 50
```

**Erwartete Logs:**
```
🚀 LLM Gateway listening on http://localhost:${PORT}
```

### 3. Fehlerprüfung
- [ ] Keine Build-Fehler
- [ ] Service startet erfolgreich
- [ ] Health Check funktioniert
- [ ] Keine Port-Konflikte
- [ ] Keine fehlenden Environment Variables

## 📋 Muster für andere Services

Nach erfolgreichem Deployment von llm-gateway:

1. **Template verwenden:**
   - Root Directory: `apps/services/<service-name>`
   - Build-Command: `pnpm --filter @wattweiser/<service-name> build`
   - Start-Command: `cd apps/services/<service-name> && node dist/main`

2. **Environment Variables:**
   - Service-spezifische Variablen setzen
   - Shared Variables (NODE_ENV, DEPLOYMENT_PLATFORM) sind automatisch verfügbar

3. **Health Check:**
   - `/health` Endpoint muss vorhanden sein
   - Railway verwendet es für Health Checks

## 🔧 Troubleshooting

### Problem: Build fehlgeschlagen
- Prüfe: `pnpm-lock.yaml` existiert?
- Prüfe: Build-Command korrekt?
- Prüfe: Dependencies installiert?

### Problem: Service startet nicht
- Prüfe: Start-Command korrekt?
- Prüfe: Port-Handling (process.env.PORT)?
- Prüfe: Logs für Fehler

### Problem: Health Check fehlgeschlagen
- Prüfe: `/health` Endpoint existiert?
- Prüfe: Service läuft?
- Prüfe: Port-Konflikte?

## 📚 Referenzen

- [Master Plan](./LLM_GATEWAY_DEPLOYMENT_MASTER_PLAN.md)
- [Deployment Fix](./LLM_GATEWAY_DEPLOYMENT_FIX.md)
- [Deployment Analysis](./LLM_GATEWAY_DEPLOYMENT_ANALYSIS.md)






