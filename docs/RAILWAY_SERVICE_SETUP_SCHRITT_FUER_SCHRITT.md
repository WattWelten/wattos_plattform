# Railway Service Setup - Schritt für Schritt

## Problem: "No deploys for this service"

**Ursache:** Service ist nicht mit GitHub verlinkt, deshalb weiß Railway nicht, wann es deployen soll.

## Lösung: Service mit GitHub verlinken

### Schritt 1: Gehe zu GitHub Settings

1. Öffne Railway Dashboard
2. Wähle einen Service (z.B. `avatar-service`)
3. Klicke auf **"Settings"** (oben rechts)
4. Klicke auf **"GitHub"** Tab (NICHT Build oder Deploy!)

### Schritt 2: GitHub Integration konfigurieren

Im **GitHub** Tab:

1. **Repository auswählen:**
   - Klicke auf "Connect Repository" oder "Select Repository"
   - Wähle: **WattWelten/wattos_plattform**

2. **Branch auswählen:**
   - Wähle: **main** (oder **production**)

3. **Auto-Deploy aktivieren:**
   - Aktiviere den Toggle **"Auto-Deploy"** ✅
   - Optional: Aktiviere **"Wait for CI"** (wartet auf GitHub Actions)

4. **Speichern:**
   - Änderungen werden automatisch gespeichert

### Schritt 3: Build/Deploy Settings prüfen

Gehe zu **Settings → Build** und **Settings → Deploy**:

#### Build Settings:
- ✅ **Custom Build Command:** `pnpm --filter @wattweiser/<service-name> build`
- ⚠️ **Metal Build Environment:** DEAKTIVIEREN (Beta, kann Probleme machen)
- ✅ **Watch Paths:** `/apps/services/<service-name>/**`

#### Deploy Settings:
- ✅ **Custom Start Command:** `pnpm --filter @wattweiser/<service-name> start`
- ✅ **Regions:** EU West (Amsterdam) - Standard
- ⚠️ **Teardown:** Optional aktivieren (beendet alte Deployments schneller)

### Schritt 4: Für alle Services wiederholen

Wiederhole Schritt 1-3 für **alle Services**:
- api-gateway
- llm-gateway
- chat-service
- rag-service
- agent-service
- customer-intelligence-service
- crawler-service
- voice-service
- avatar-service
- character-service
- admin-service
- summary-service
- feedback-service
- ingestion-service
- metaverse-service

## Service-spezifische Build/Start Commands

### API Gateway:
- Build: `pnpm --filter @wattweiser/api-gateway build`
- Start: `pnpm --filter @wattweiser/api-gateway start`

### Chat Service:
- Build: `pnpm --filter @wattweiser/chat-service build`
- Start: `pnpm --filter @wattweiser/chat-service start`

### LLM Gateway:
- Build: `pnpm --filter @wattweiser/llm-gateway build`
- Start: `pnpm --filter @wattweiser/llm-gateway start`

### Avatar Service (wie im Screenshot):
- Build: `pnpm --filter @wattweiser/avatar-service build`
- Start: `pnpm --filter @wattweiser/avatar-service start`

## Nach der Konfiguration

1. **Teste Auto-Deploy:**
   - Push Code zu `main` Branch
   - Railway sollte automatisch deployen

2. **Prüfe Deployments:**
   - Gehe zu Service → Deployments
   - Du solltest neue Deployments sehen

3. **Prüfe Logs:**
   - Service → Logs
   - Prüfe ob Service erfolgreich startet

## Troubleshooting

### Problem: "No deploys for this service"

**Lösung:**
- Prüfe ob GitHub Tab konfiguriert ist
- Prüfe ob Auto-Deploy aktiviert ist
- Prüfe ob Repository und Branch korrekt sind

### Problem: Build schlägt fehl

**Lösung:**
- Prüfe Build Command (sollte `pnpm --filter @wattweiser/<service> build` sein)
- Prüfe ob Service in `package.json` existiert
- Prüfe ob Dependencies installiert sind

### Problem: Service startet nicht

**Lösung:**
- Prüfe Start Command (sollte `pnpm --filter @wattweiser/<service> start` sein)
- Prüfe Environment Variables
- Prüfe Logs für Fehlermeldungen

## Wichtige Hinweise

1. **GitHub Tab ist KRITISCH** - ohne GitHub Integration deployt nichts!
2. **Auto-Deploy muss aktiviert sein** - sonst deployt Railway nicht automatisch
3. **Metal Build Environment** - Beta, kann Probleme machen, besser deaktivieren
4. **Watch Paths** - Railway deployt nur wenn diese Pfade sich ändern

## Nächste Schritte

1. ✅ Konfiguriere GitHub Tab für alle Services
2. ✅ Aktiviere Auto-Deploy
3. ✅ Prüfe Build/Start Commands
4. ✅ Teste mit einem Git Push

Nach der Konfiguration sollten alle Services automatisch deployen! 🚀






