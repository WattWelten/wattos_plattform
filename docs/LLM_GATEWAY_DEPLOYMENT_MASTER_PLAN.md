# LLM Gateway Deployment - Master Plan

## 🎯 Ziel
**LLM Gateway als ersten Service fehlerfrei deployen und als Muster für alle anderen Services nutzen.**

## 📊 Kritische Probleme-Analyse

### Problem 1: ❌ `pnpm-lock.yaml` fehlt
**Fehler:**
```
ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent
```

**Ursache:**
- Nixpacks verwendet automatisch `pnpm i --frozen-lockfile`
- `pnpm-lock.yaml` existiert nicht im Repository
- CI/CD erfordert Lockfile für reproduzierbare Builds

**Lösung:**
1. `pnpm install` lokal ausführen
2. `pnpm-lock.yaml` committen und pushen
3. Sicherstellen, dass `.gitignore` es nicht ignoriert

### Problem 2: ❌ Falscher Start-Command
**Fehler in Logs:**
```
║ start      │ cd apps/gateway && node dist/main                 ║
```

**Sollte sein:**
```
║ start      │ cd apps/services/llm-gateway && node dist/main    ║
```

**Ursache:**
- Railway verwendet root `railway.json` statt service-spezifischer
- Nixpacks erkennt falsches Verzeichnis

**Lösung:**
- Root `railway.json` für llm-gateway konfigurieren
- Oder: Service-spezifische `railway.json` verwenden (Root-Dir setzen)

### Problem 3: ⚠️ Railway ignoriert service-spezifische `railway.json`
**Logs zeigen:**
```
[dbg]  skipping 'railway.json' at 'apps/services/llm-gateway/railway.json' as it is not rooted at a valid path
[dbg]  found 'railway.json' at 'railway.json'
```

**Ursache:**
- Railway sucht nur nach root `railway.json`
- Service-spezifische Dateien werden ignoriert

**Lösung:**
- Root `railway.json` für Monorepo konfigurieren
- Oder: Service-spezifische Root-Dir in Railway Dashboard setzen

### Problem 4: ⚠️ Nixpacks verwendet `--frozen-lockfile` ohne Fallback
**Ursache:**
- Nixpacks erkennt `pnpm` und verwendet automatisch `--frozen-lockfile`
- Kein Fallback wenn Lockfile fehlt

**Lösung:**
- `pnpm-lock.yaml` muss vorhanden sein
- Oder: Nixpacks-Konfiguration anpassen (nixpacks.toml)

## 🛠️ Lösungsplan (Schritt für Schritt)

### Phase 1: Lockfile generieren ✅

**Schritt 1.1:** Prüfe aktuelle Situation
```bash
# Prüfe ob pnpm-lock.yaml existiert
ls -la pnpm-lock.yaml

# Prüfe .gitignore
grep -i "pnpm-lock" .gitignore
```

**Schritt 1.2:** Generiere Lockfile
```bash
# Installiere Dependencies (ohne frozen-lockfile)
pnpm install --no-frozen-lockfile

# Prüfe ob erstellt wurde
ls -la pnpm-lock.yaml
```

**Schritt 1.3:** Committe und pushe
```bash
git add pnpm-lock.yaml
git commit -m "chore: Add pnpm-lock.yaml for reproducible builds"
git push origin main
```

### Phase 2: Railway-Konfiguration korrigieren ✅

**Schritt 2.1:** Root `railway.json` für llm-gateway konfigurieren

**Option A: Service-spezifische Root-Dir (Empfohlen)**
- Railway Dashboard → Service → Settings → Root Directory: `apps/services/llm-gateway`
- Dann wird `apps/services/llm-gateway/railway.json` verwendet

**Option B: Root `railway.json` für Monorepo**
- Root `railway.json` mit service-spezifischer Konfiguration
- Build/Start-Commands für llm-gateway

**Schritt 2.2:** Start-Command korrigieren
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm --filter @wattweiser/llm-gateway build"
  },
  "deploy": {
    "startCommand": "cd apps/services/llm-gateway && node dist/main",
    "healthcheckPath": "/health"
  }
}
```

### Phase 3: Nixpacks-Konfiguration (Optional) ✅

**Schritt 3.1:** Erstelle `nixpacks.toml` (falls nötig)
```toml
[phases.setup]
nixPkgs = ["nodejs_24", "pnpm-8_x"]

[phases.install]
cmds = ["pnpm install --no-frozen-lockfile"]

[phases.build]
cmds = ["pnpm --filter @wattweiser/llm-gateway build"]

[start]
cmd = "cd apps/services/llm-gateway && node dist/main"
```

### Phase 4: Environment Variables prüfen ✅

**Erforderliche Variablen:**
- `OPENAI_API_KEY` (kritisch!)
- `PORT` (Railway setzt automatisch)
- `NODE_ENV=production`
- `DEPLOYMENT_PLATFORM=railway`

**Prüfung:**
```bash
railway variables --service llm-gateway
```

### Phase 5: Test & Validierung ✅

**Schritt 5.1:** Lokaler Build-Test
```bash
cd apps/services/llm-gateway
pnpm install
pnpm build
pnpm start:prod
```

**Schritt 5.2:** Railway Deployment
- Push zu main → Automatisches Deployment
- Oder: Manuelles Redeploy im Dashboard

**Schritt 5.3:** Health Check
```bash
curl https://llm-gateway-<id>.railway.app/health
```

## 📋 Checkliste für erfolgreiches Deployment

- [ ] `pnpm-lock.yaml` existiert und ist committed
- [ ] Root Directory in Railway Dashboard gesetzt: `apps/services/llm-gateway`
- [ ] Oder: Root `railway.json` korrekt konfiguriert
- [ ] Start-Command zeigt auf `apps/services/llm-gateway`
- [ ] `OPENAI_API_KEY` in Railway Variables gesetzt
- [ ] Lokaler Build erfolgreich
- [ ] Deployment erfolgreich
- [ ] Health Check funktioniert

## 🎯 Muster für andere Services

Nach erfolgreichem Deployment von llm-gateway:

1. **Template erstellen:**
   - Dokumentiere erfolgreiche Konfiguration
   - Erstelle Service-Template

2. **Wiederholbare Schritte:**
   - Root Directory setzen
   - Environment Variables konfigurieren
   - Build/Start-Commands anpassen

3. **Automatisierung:**
   - Script für Service-Setup
   - Validierung vor Deployment

## 📚 Referenzen

- [Railway Monorepo Guide](https://docs.railway.app/guides/monorepos)
- [Nixpacks Documentation](https://nixpacks.com/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)






