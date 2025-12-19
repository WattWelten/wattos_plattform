# Secrets Setup Guide

## GitHub Secrets

Diese Secrets müssen in GitHub Repository Settings → Secrets → Actions gesetzt werden.

### Erforderliche Secrets

#### Railway
- **`RAILWAY_TOKEN`** - Railway API Token
  - Wert: `1257657a-5955-449f-a50e-cfbda728fa76`
  - Erstellen: Railway Dashboard → Settings → Tokens → New Token

- **`RAILWAY_PROJECT_ID`** - Railway Project ID
  - Wert: `a97f01bc-dc80-4941-b911-ed7ebb3efa7a`
  - Finden: Railway Dashboard → Project Settings → Project ID

#### LLM Providers
- **`OPENAI_API_KEY`** - OpenAI API Key
  - Wert: `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`
  - Erstellen: https://platform.openai.com/api-keys

- **`ELEVENLABS_API_KEY`** - ElevenLabs API Key
  - Wert: `sk_2c1bed318623f04cd188fdb6fede39cf6ac98fd72072d67a`
  - Erstellen: https://elevenlabs.io/app/settings/api-keys

- **`ELEVENLABS_VOICE_ID`** - ElevenLabs Voice ID (Elena)
  - Wert: `iFJwt4O7E3aafIpJFfcu`
  - Finden: ElevenLabs Dashboard → Voices

#### Database
- **`DATABASE_URL`** - PostgreSQL Connection String
  - Format: `postgresql://user:password@host:port/database`
  - Wird automatisch von Railway gesetzt, wenn PostgreSQL Service erstellt wird

#### JWT & Security
- **`JWT_SECRET`** - Secret für JWT-Tokens
  - Generieren: `openssl rand -base64 32`
  - Muss stark und zufällig sein

#### Frontend (Vercel)
- **`VERCEL_TOKEN`** - Vercel API Token (optional, für Frontend Deployment)
  - Erstellen: Vercel Dashboard → Settings → Tokens

- **`VERCEL_ORG_ID`** - Vercel Organization ID (optional)
  - Finden: Vercel Dashboard → Settings → General

- **`VERCEL_PROJECT_ID`** - Vercel Project ID (optional)
  - Finden: Vercel Dashboard → Project Settings → General

#### CORS
- **`CORS_ORIGIN`** - Frontend URL für CORS
  - Beispiel: `https://your-app.vercel.app`
  - Muss explizit gesetzt werden (kein `*` in Production)

### Optional Secrets

- **`ANTHROPIC_API_KEY`** - Anthropic API Key (falls verwendet)
- **`AZURE_OPENAI_API_KEY`** - Azure OpenAI API Key (falls verwendet)
- **`GOOGLE_API_KEY`** - Google API Key (falls verwendet)

## Railway Environment Variables

Diese Variablen müssen in Railway für jeden Service gesetzt werden.

### Shared Variables (für alle Services)

Diese können als "Shared Variables" in Railway gesetzt werden:

- `DATABASE_URL` - Automatisch von PostgreSQL Service
- `REDIS_URL` - Automatisch von Redis Service
- `NODE_ENV=production`

### Service-spezifische Variables

#### API Gateway
- `JWT_SECRET` - JWT Secret
- `CORS_ORIGIN` - Frontend URL
- `PORT` - Wird automatisch von Railway gesetzt

#### LLM Gateway
- `OPENAI_API_KEY` - OpenAI API Key
- `ANTHROPIC_API_KEY` - Anthropic API Key (optional)
- `AZURE_OPENAI_API_KEY` - Azure OpenAI API Key (optional)

#### Voice Service
- `ELEVENLABS_API_KEY` - ElevenLabs API Key
- `ELEVENLABS_VOICE_ID` - ElevenLabs Voice ID (Elena: `iFJwt4O7E3aafIpJFfcu`)

#### Alle Services
- Service URLs (werden automatisch nach Deployment gesetzt)
  - `CHAT_SERVICE_URL`
  - `RAG_SERVICE_URL`
  - `AGENT_SERVICE_URL`
  - `LLM_GATEWAY_URL`
  - etc.

## Setup-Anleitung

### 1. GitHub Secrets setzen

1. Gehe zu GitHub Repository → Settings → Secrets → Actions
2. Klicke auf "New repository secret"
3. Füge jedes Secret hinzu (Name und Wert)

### 2. Railway Environment Variables setzen

#### Via Railway CLI

```bash
# Login
railway login

# Projekt auswählen
railway link

# Shared Variables setzen
railway variables set DATABASE_URL=$DATABASE_URL --shared
railway variables set REDIS_URL=$REDIS_URL --shared
railway variables set NODE_ENV=production --shared

# Service-spezifische Variables
railway service api-gateway
railway variables set JWT_SECRET=your-jwt-secret
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app

railway service llm-gateway
railway variables set OPENAI_API_KEY=your-openai-key

railway service voice-service
railway variables set ELEVENLABS_API_KEY=your-elevenlabs-key
railway variables set ELEVENLABS_VOICE_ID=iFJwt4O7E3aafIpJFfcu
```

#### Via Railway Dashboard

1. Gehe zu Railway Dashboard → Project
2. Wähle Service aus
3. Gehe zu Variables Tab
4. Füge Variables hinzu

### 3. Automatisches Setup

Das Script `scripts/set-env-vars.sh` kann verwendet werden, um Environment Variables automatisch zu setzen:

```bash
./scripts/set-env-vars.sh production
```

## Sicherheit

⚠️ **WICHTIG:**
- **NIEMALS** Secrets in Git committen
- **NIEMALS** Secrets in Logs ausgeben
- Secrets regelmäßig rotieren
- Verwende unterschiedliche Secrets für Staging und Production

## Troubleshooting

### Secret nicht gefunden
- Prüfe, ob Secret in GitHub Secrets gesetzt ist
- Prüfe, ob Secret-Name korrekt ist (Groß-/Kleinschreibung beachten)
- Prüfe, ob Workflow Zugriff auf Secret hat

### Railway Deployment schlägt fehl
- Prüfe Railway Token
- Prüfe Railway Project ID
- Prüfe Service Name

### Environment Variable nicht gesetzt
- Prüfe Railway Dashboard → Variables
- Prüfe, ob Variable als "Shared" oder "Service-specific" gesetzt ist
- Prüfe, ob Service Zugriff auf Variable hat












