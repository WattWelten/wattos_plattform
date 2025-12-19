# Railway Setup Checklist

**Datum:** 2025-01-02  
**Projekt ID:** `a97f01bc-dc80-4941-b911-ed7ebb3efa7a`

## Pre-Setup Checklist

### Voraussetzungen

- [ ] Railway Account erstellt (https://railway.app)
- [ ] Railway CLI installiert: `npm install -g @railway/cli`
- [ ] Node.js >= 18.0.0 installiert
- [ ] Git Repository geklont
- [ ] Dependencies installiert: `pnpm install`

### Secrets vorbereiten

- [ ] `.railway-secrets.env` erstellt (aus Template kopiert)
- [ ] `RAILWAY_TOKEN` gesetzt (Railway Dashboard → Settings → Tokens)
- [ ] `RAILWAY_PROJECT_ID` gesetzt (falls abweichend)
- [ ] `JWT_SECRET` generiert (mindestens 32 Zeichen)
- [ ] `OPENAI_API_KEY` gesetzt (mindestens ein LLM Provider)
- [ ] Optionale Secrets gesetzt (ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, etc.)
- [ ] `CORS_ORIGIN` gesetzt (Frontend URL)
- [ ] `.railway-secrets.env` zu `.gitignore` hinzugefügt

### Railway CLI Setup

- [ ] Bei Railway eingeloggt: `railway login`
- [ ] Mit Projekt verlinkt: `railway link <project-id>`
- [ ] Railway CLI Version geprüft: `railway --version`

## Setup-Schritte

### Schritt 1: Infrastructure Setup

- [ ] Infrastructure Setup ausgeführt: `./scripts/setup-railway-infrastructure.sh production`
- [ ] PostgreSQL Service erstellt/geprüft
- [ ] Redis Service erstellt/geprüft
- [ ] DATABASE_URL als Shared Variable gesetzt
- [ ] REDIS_URL als Shared Variable gesetzt
- [ ] NODE_ENV=production als Shared Variable gesetzt
- [ ] DEPLOYMENT_PLATFORM=railway als Shared Variable gesetzt

### Schritt 2: Services Setup

- [ ] Services Setup ausgeführt: `./scripts/setup-railway-services.sh production`
- [ ] Alle 18 Services in Railway geprüft
- [ ] Services mit Projekt verlinkt
- [ ] Fehlende Services identifiziert (falls vorhanden)

**Services-Liste:**

- [ ] api-gateway
- [ ] chat-service
- [ ] rag-service
- [ ] agent-service
- [ ] llm-gateway
- [ ] tool-service
- [ ] customer-intelligence-service
- [ ] crawler-service
- [ ] voice-service
- [ ] avatar-service
- [ ] character-service
- [ ] feedback-service
- [ ] summary-service
- [ ] admin-service
- [ ] ingestion-service
- [ ] metaverse-service
- [ ] agent-worker
- [ ] document-worker

### Schritt 3: Railway Configs generieren

- [ ] Config-Generierung ausgeführt: `node scripts/generate-railway-configs.js`
- [ ] Alle `railway.json` Dateien generiert
- [ ] Configs validiert (keine Syntax-Fehler)

### Schritt 4: Environment Variables Setup

- [ ] ENV-Vars Setup ausgeführt: `./scripts/setup-railway-env-vars.sh production`
- [ ] Shared Variables gesetzt (NODE_ENV, DEPLOYMENT_PLATFORM)
- [ ] Service-spezifische Variables gesetzt
- [ ] Erforderliche Secrets gesetzt (JWT_SECRET, OPENAI_API_KEY, etc.)
- [ ] Default-Werte verwendet (falls vorhanden)

**Kritische Variables pro Service:**

- [ ] api-gateway: JWT_SECRET, CORS_ORIGIN
- [ ] llm-gateway: OPENAI_API_KEY
- [ ] voice-service: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID (optional)
- [ ] Alle Services: DEPLOYMENT_PLATFORM, NODE_ENV

### Schritt 5: Service URLs Synchronisation

- [ ] Service URLs synchronisiert: `./scripts/sync-service-urls.sh production`
- [ ] Service Discovery URLs gesetzt
- [ ] Alle Service-zu-Service URLs konfiguriert

### Schritt 6: Vollständiges Setup (Optional)

- [ ] Vollständiges Setup ausgeführt: `./scripts/setup-railway-complete.sh production`
- [ ] Alle Schritte erfolgreich abgeschlossen
- [ ] Validierung durchgeführt

## Post-Setup Validierung

### Pre-Deployment Validierung

- [ ] Validierung ausgeführt: `./scripts/validate-pre-deployment.sh production`
- [ ] Railway CLI Installation geprüft
- [ ] Railway Authentication geprüft
- [ ] Config-Dateien validiert
- [ ] Railway Services geprüft
- [ ] Environment Variables geprüft
- [ ] Build-Commands validiert
- [ ] Port-Konflikte geprüft
- [ ] Service Dependencies geprüft

### Manuelle Prüfungen

- [ ] Railway Dashboard geöffnet: https://railway.app/project/a97f01bc-dc80-4941-b911-ed7ebb3efa7a
- [ ] Alle Services sichtbar
- [ ] Infrastructure Services (PostgreSQL, Redis) vorhanden
- [ ] Shared Variables gesetzt
- [ ] Service-spezifische Variables gesetzt

## Deployment-Vorbereitung

### Vor dem ersten Deployment

- [ ] Pre-Deployment Validierung erfolgreich
- [ ] Alle Environment Variables gesetzt
- [ ] Service URLs synchronisiert
- [ ] Railway Configs generiert
- [ ] Build-Commands getestet (lokal)

### Deployment

- [ ] Deployment ausgeführt: `./scripts/deploy-railway.sh production`
- [ ] Alle Services deployed
- [ ] Keine Build-Fehler
- [ ] Keine Start-Fehler

### Post-Deployment

- [ ] Health Checks ausgeführt: `./scripts/post-deployment-health-check.sh production`
- [ ] Alle Services erreichbar
- [ ] Health Endpoints antworten
- [ ] Service URLs korrekt

## Web-Nutzung Setup

### Frontend-Konfiguration

- [ ] Frontend-Deployment konfiguriert (Vercel oder andere Platform)
- [ ] API Gateway URL in Frontend-Konfiguration
- [ ] CORS-Einstellungen korrekt
- [ ] Environment Variables für Frontend gesetzt

### Testing

- [ ] Frontend kann API Gateway erreichen
- [ ] Authentifizierung funktioniert
- [ ] Services antworten korrekt
- [ ] Keine CORS-Fehler

## Troubleshooting

### Falls Setup fehlschlägt

- [ ] Railway CLI Version geprüft
- [ ] Railway CLI aktualisiert: `npm install -g @railway/cli@latest`
- [ ] Analyse-Script ausgeführt: `./scripts/analyze-railway-deployment.sh production`
- [ ] Railway Logs geprüft: `railway logs --service <service-name>`
- [ ] Troubleshooting-Guide gelesen: [RAILWAY_TROUBLESHOOTING.md](./RAILWAY_TROUBLESHOOTING.md)

## Nächste Schritte

Nach erfolgreichem Setup:

1. **Monitoring einrichten:**
   - Railway Observability aktivieren
   - Alerts konfigurieren

2. **Dokumentation aktualisieren:**
   - Deployment-Prozess dokumentieren
   - Bekannte Probleme dokumentieren

3. **CI/CD aktivieren:**
   - GitHub Actions Workflow testen
   - Automatisches Deployment aktivieren

## Notizen

---

**Letzte Aktualisierung:** 2025-01-02  
**Version:** 1.0.0






