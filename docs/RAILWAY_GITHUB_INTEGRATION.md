# Railway GitHub Integration Setup

## Status

✅ GitHub Account verbunden: Henning-Behrens  
⚠️ Railway App installiert - **muss konfiguriert werden**

## Problem

Die Railway GitHub App ist installiert, aber nicht für das Repository konfiguriert. Deshalb deployen Services nicht automatisch bei Git Pushes.

## Lösung: Railway GitHub Integration konfigurieren

### Schritt 1: Railway App konfigurieren

1. Gehe zu Railway Dashboard → Account → Integrations
2. Klicke auf **"Configure"** bei GitHub Integration
3. Wähle Repository: **WattWelten/wattos_plattform**
4. Aktiviere **"Auto-Deploy"** für `main` Branch
5. Optional: Aktiviere **"Wait for CI"** (wartet auf GitHub Actions)

### Schritt 2: Services mit GitHub verlinken

Für jeden Service im Railway Dashboard:

1. Gehe zu **Service → Settings → GitHub**
2. Wähle Repository: **WattWelten/wattos_plattform**
3. Wähle Branch: **main** (oder **production**)
4. Aktiviere **"Auto-Deploy"**
5. Optional: Aktiviere **"Wait for CI"**

### Schritt 3: Prüfe Service-Konfiguration

Jeder Service sollte haben:
- ✅ GitHub Repository verlinkt
- ✅ Branch ausgewählt
- ✅ Auto-Deploy aktiviert
- ✅ Build Command (falls nötig)
- ✅ Start Command

## Alternative: Railway CLI Deployment

Falls GitHub Integration nicht funktioniert, kann der Workflow auch direkt über Railway CLI deployen:

```bash
# Redeploy bestehender Service
railway redeploy --service <service-name>

# Oder: Neues Deployment
railway up --service <service-name>
```

Der vereinfachte Workflow (`.github/workflows/deploy-railway-simple.yml`) verwendet diese Methode.

## Troubleshooting

### Problem: Services deployen nicht automatisch

**Lösung:**
1. Prüfe Railway App Konfiguration (Account → Integrations → Configure)
2. Prüfe Service GitHub Settings (Service → Settings → GitHub)
3. Prüfe "Wait for CI" Einstellung (kann Deployments blockieren)

### Problem: "Railway App not installed"

**Lösung:**
1. Gehe zu GitHub → Settings → Applications → Installed GitHub Apps
2. Finde "Railway"
3. Prüfe Repository-Zugriff
4. Aktiviere Zugriff für WattWelten/wattos_plattform

### Problem: "Wait for CI" blockiert Deployments

**Lösung:**
1. Deaktiviere "Wait for CI" in Service Settings
2. Oder: Stelle sicher, dass GitHub Actions erfolgreich sind

## Empfohlene Konfiguration

### Für Production:
- ✅ Auto-Deploy aktiviert
- ✅ Branch: `main` oder `production`
- ⚠️ "Wait for CI" aktiviert (wartet auf GitHub Actions)
- ✅ Build Command gesetzt
- ✅ Start Command gesetzt

### Für Development:
- ✅ Auto-Deploy aktiviert
- ✅ Branch: `develop` oder `dev`
- ❌ "Wait for CI" deaktiviert (schnellere Deployments)
- ✅ Build Command gesetzt
- ✅ Start Command gesetzt

## Nächste Schritte

1. **Konfiguriere Railway GitHub Integration** (Account → Integrations → Configure)
2. **Verlinke Services mit GitHub** (Service → Settings → GitHub)
3. **Teste Auto-Deploy** (Push zu main Branch)
4. **Prüfe Deployments** (Railway Dashboard → Service → Deployments)

Nach der Konfiguration sollten Services automatisch deployen, wenn Code zu GitHub gepusht wird!






