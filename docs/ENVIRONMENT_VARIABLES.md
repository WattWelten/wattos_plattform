# Environment Variables Dokumentation

Diese Dokumentation beschreibt alle verfÃ¼gbaren Environment Variables fÃ¼r die WattOS Plattform.

## Ãœbersicht

Die WattOS Plattform verwendet eine zentrale Environment-Variable-Validierung Ã¼ber Zod-Schemas in `packages/config/src/env-validator.ts`. Alle Variablen werden beim Start validiert.

## Allgemeine Konfiguration

### NODE_ENV
- **Typ:** `enum: 'development' | 'production' | 'staging' | 'test'`
- **Default:** `development`
- **Beschreibung:** Node.js Environment
- **Beispiel:** `NODE_ENV=production`

### PORT
- **Typ:** `number` (1-65535)
- **Default:** Service-spezifisch
- **Beschreibung:** Port auf dem der Service lÃ¤uft
- **Beispiel:** `PORT=3001`

## Database

### DATABASE_URL
- **Typ:** `string` (PostgreSQL Connection String)
- **Erforderlich:** âœ… Ja
- **Beschreibung:** PostgreSQL Datenbank-URL mit pgvector Extension
- **Format:** `postgresql://user:password@host:port/database`
- **Beispiel:** `DATABASE_URL=postgresql://user:pass@localhost:5432/wattos`

## Redis

### REDIS_URL
- **Typ:** `string` (Redis Connection String)
- **Default:** `redis://localhost:6379`
- **Beschreibung:** Redis Cache und Session Storage
- **Format:** `redis://host:port` oder `redis://:password@host:port`
- **Beispiel:** `REDIS_URL=redis://localhost:6379`

## API Gateway

### JWT_SECRET
- **Typ:** `string` (min. 32 Zeichen)
- **Erforderlich:** âœ… Ja
- **Beschreibung:** Secret fÃ¼r JWT Token-Signierung
- **Sicherheit:** Muss mindestens 32 Zeichen lang sein
- **Beispiel:** `JWT_SECRET=your-super-secret-key-min-32-chars-long`

### CORS_ORIGINS
- **Typ:** `string`
- **Default:** `http://localhost:3000`
- **Beschreibung:** Erlaubte CORS Origins (komma-separiert)
- **Beispiel:** `CORS_ORIGINS=http://localhost:3000,https://app.wattos.de`

### ENABLE_SWAGGER
- **Typ:** `boolean`
- **Default:** `false`
- **Beschreibung:** Aktiviert Swagger/OpenAPI Dokumentation
- **Beispiel:** `ENABLE_SWAGGER=true`

## OIDC/Keycloak

### OIDC_AUTHORIZATION_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beschreibung:** OIDC Authorization Endpoint
- **Beispiel:** `OIDC_AUTHORIZATION_URL=https://keycloak.example.com/auth/realms/myrealm/protocol/openid-connect/auth`

### OIDC_TOKEN_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beschreibung:** OIDC Token Endpoint
- **Beispiel:** `OIDC_TOKEN_URL=https://keycloak.example.com/auth/realms/myrealm/protocol/openid-connect/token`

### OIDC_CLIENT_ID
- **Typ:** `string`
- **Optional:** âœ…
- **Beschreibung:** OIDC Client ID

### OIDC_CLIENT_SECRET
- **Typ:** `string`
- **Optional:** âœ…
- **Beschreibung:** OIDC Client Secret

### OIDC_CALLBACK_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beschreibung:** OIDC Callback URL nach Authentication

## Cache

### CACHE_ENABLED
- **Typ:** `boolean`
- **Default:** `true`
- **Beschreibung:** Aktiviert/Deaktiviert Caching
- **Beispiel:** `CACHE_ENABLED=true`

### CACHE_DEFAULT_TTL
- **Typ:** `number` (Sekunden, min. 1)
- **Default:** `3600` (1 Stunde)
- **Beschreibung:** Standard Cache Time-To-Live
- **Beispiel:** `CACHE_DEFAULT_TTL=3600`

### CACHE_MAX_SIZE
- **Typ:** `number` (min. 1)
- **Default:** `1000`
- **Beschreibung:** Maximale Anzahl gecachter EintrÃ¤ge
- **Beispiel:** `CACHE_MAX_SIZE=1000`

## LLM Providers

### OPENAI_API_KEY
- **Typ:** `string` (muss mit `sk-` beginnen)
- **Optional:** âœ…
- **Beschreibung:** OpenAI API Key
- **Format:** Muss mit `sk-` beginnen
- **Beispiel:** `OPENAI_API_KEY=sk-...`

### ANTHROPIC_API_KEY
- **Typ:** `string`
- **Optional:** âœ…
- **Beschreibung:** Anthropic (Claude) API Key
- **Beispiel:** `ANTHROPIC_API_KEY=sk-ant-...`

### AZURE_OPENAI_API_KEY
- **Typ:** `string`
- **Optional:** âœ…
- **Beschreibung:** Azure OpenAI API Key

### AZURE_OPENAI_ENDPOINT
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beschreibung:** Azure OpenAI Endpoint URL
- **Beispiel:** `AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com`

### GOOGLE_API_KEY
- **Typ:** `string`
- **Optional:** âœ…
- **Beschreibung:** Google AI API Key

## Service URLs

Alle Service URLs sind optional und werden fÃ¼r Service Discovery verwendet. Wenn nicht gesetzt, werden Default-URLs verwendet.

### LLM_GATEWAY_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Default:** Service-spezifisch
- **Beispiel:** `LLM_GATEWAY_URL=http://localhost:3004`

### RAG_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `RAG_SERVICE_URL=http://localhost:3007`

### CHAT_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `CHAT_SERVICE_URL=http://localhost:3006`

### AGENT_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `AGENT_SERVICE_URL=http://localhost:3008`

### TOOL_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `TOOL_SERVICE_URL=http://localhost:3009`

### ADMIN_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `ADMIN_SERVICE_URL=http://localhost:3010`

### CHARACTER_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `CHARACTER_SERVICE_URL=http://localhost:3011`

### CUSTOMER_INTELLIGENCE_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `CUSTOMER_INTELLIGENCE_SERVICE_URL=http://localhost:3012`

### CRAWLER_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `CRAWLER_SERVICE_URL=http://localhost:3015`

### VOICE_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `VOICE_SERVICE_URL=http://localhost:3016`

### AVATAR_SERVICE_URL
- **Typ:** `string` (URL)
- **Optional:** âœ…
- **Beispiel:** `AVATAR_SERVICE_URL=http://localhost:3017`

### INGESTION_SERVICE_URL
- **Typ:** `string` (URL)
- **Default:** `http://localhost:3008`
- **Beschreibung:** Ingestion Service URL fÃ¼r Dokument-Upload
- **Beispiel:** `INGESTION_SERVICE_URL=http://localhost:3008`

## Voice Service

### ELEVENLABS_API_KEY
- **Typ:** `string` (muss mit `sk_` beginnen)
- **Optional:** âœ…
- **Beschreibung:** ElevenLabs API Key fÃ¼r TTS
- **Format:** Muss mit `sk_` beginnen
- **Beispiel:** `ELEVENLABS_API_KEY=sk_...`

### ELEVENLABS_VOICE_ID
- **Typ:** `string`
- **Optional:** âœ…
- **Beschreibung:** ElevenLabs Voice ID

### TTS_PROVIDER
- **Typ:** `enum: 'openai' | 'elevenlabs' | 'azure'`
- **Default:** `openai`
- **Beschreibung:** Text-to-Speech Provider
- **Beispiel:** `TTS_PROVIDER=elevenlabs`

### STT_PROVIDER
- **Typ:** `enum: 'openai' | 'whisper' | 'azure'`
- **Default:** `openai`
- **Beschreibung:** Speech-to-Text Provider
- **Beispiel:** `STT_PROVIDER=whisper`

## Vector Store

### VECTOR_STORE_TYPE
- **Typ:** `enum: 'pgvector' | 'opensearch'`
- **Default:** `pgvector`
- **Beschreibung:** Vector Store Backend
- **Beispiel:** `VECTOR_STORE_TYPE=pgvector`

### OPENSEARCH_URL
- **Typ:** `string` (URL)
- **Optional:** âœ… (erforderlich wenn VECTOR_STORE_TYPE=opensearch)
- **Beschreibung:** OpenSearch Cluster URL
- **Beispiel:** `OPENSEARCH_URL=https://opensearch.example.com:9200`

## Feature Flags

### STREAMING_ENABLED
- **Typ:** `boolean`
- **Default:** `true`
- **Beschreibung:** Aktiviert Streaming fÃ¼r Chat/LLM Responses
- **Beispiel:** `STREAMING_ENABLED=true`

### WEBSOCKET_ENABLED
- **Typ:** `boolean`
- **Default:** `true`
- **Beschreibung:** Aktiviert WebSocket-Support
- **Beispiel:** `WEBSOCKET_ENABLED=true`

### SANDBOX_ENABLED
- **Typ:** `boolean`
- **Default:** `false`
- **Beschreibung:** Aktiviert Sandbox-Modus fÃ¼r Tool-Execution
- **Sicherheit:** Nur in Development/Staging aktivieren
- **Beispiel:** `SANDBOX_ENABLED=false`

## Performance & Observability

### LOG_LEVEL
- **Typ:** `enum: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'`
- **Default:** `info`
- **Beschreibung:** Logging-Level
- **Beispiel:** `LOG_LEVEL=debug`

### SERVICE_NAME
- **Typ:** `string`
- **Default:** `wattos-service`
- **Beschreibung:** Service-Name fÃ¼r Logging und Tracing
- **Beispiel:** `SERVICE_NAME=chat-service`

### METRICS_ENABLED
- **Typ:** `boolean`
- **Default:** `true`
- **Beschreibung:** Aktiviert Metrics-Sammlung
- **Beispiel:** `METRICS_ENABLED=true`

### METRICS_MAX_HISTOGRAM_SIZE
- **Typ:** `number` (min. 100)
- **Default:** `1000`
- **Beschreibung:** Maximale Histogram-GrÃ¶ÃŸe fÃ¼r Metrics
- **Beispiel:** `METRICS_MAX_HISTOGRAM_SIZE=1000`

## OpenTelemetry (Optional)

### OTEL_ENABLED
- **Typ:** `boolean`
- **Default:** `false`
- **Beschreibung:** Aktiviert OpenTelemetry Distributed Tracing
- **Beispiel:** `OTEL_ENABLED=true`

### OTEL_EXPORTER_TYPE
- **Typ:** `enum: 'console' | 'jaeger' | 'zipkin' | 'otlp'`
- **Default:** `console`
- **Beschreibung:** OpenTelemetry Exporter Type
- **Beispiel:** `OTEL_EXPORTER_TYPE=jaeger`

### OTEL_EXPORTER_JAEGER_ENDPOINT
- **Typ:** `string` (URL)
- **Optional:** âœ… (erforderlich wenn OTEL_EXPORTER_TYPE=jaeger)
- **Beschreibung:** Jaeger Endpoint URL
- **Beispiel:** `OTEL_EXPORTER_JAEGER_ENDPOINT=http://jaeger:14268/api/traces`

### OTEL_EXPORTER_ZIPKIN_ENDPOINT
- **Typ:** `string` (URL)
- **Optional:** âœ… (erforderlich wenn OTEL_EXPORTER_TYPE=zipkin)
- **Beschreibung:** Zipkin Endpoint URL
- **Beispiel:** `OTEL_EXPORTER_ZIPKIN_ENDPOINT=http://zipkin:9411/api/v2/spans`

### OTEL_EXPORTER_OTLP_ENDPOINT
- **Typ:** `string` (URL)
- **Optional:** âœ… (erforderlich wenn OTEL_EXPORTER_TYPE=otlp)
- **Beschreibung:** OTLP Endpoint URL
- **Beispiel:** `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318`

## Production Settings

### EXPORT_OPENAPI_SPEC
- **Typ:** `boolean`
- **Default:** `false`
- **Beschreibung:** Exportiert OpenAPI Specification
- **Beispiel:** `EXPORT_OPENAPI_SPEC=true`

## .env Beispiel

```env
# Allgemeine Konfiguration
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wattos

# Redis
REDIS_URL=redis://localhost:6379

# API Gateway
JWT_SECRET=your-super-secret-key-min-32-chars-long-please-change-this
CORS_ORIGINS=https://app.wattos.de,https://admin.wattos.de
ENABLE_SWAGGER=false

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Service URLs
INGESTION_SERVICE_URL=http://localhost:3008
LLM_GATEWAY_URL=http://localhost:3004
RAG_SERVICE_URL=http://localhost:3007
CHAT_SERVICE_URL=http://localhost:3006

# Voice Service
TTS_PROVIDER=openai
STT_PROVIDER=openai

# Vector Store
VECTOR_STORE_TYPE=pgvector

# Observability
LOG_LEVEL=info
METRICS_ENABLED=true
OTEL_ENABLED=false
```

## Validierung

Alle Environment Variables werden beim Start automatisch validiert. Bei Fehlern wird eine detaillierte Fehlermeldung ausgegeben:

```
Environment variable validation failed:
JWT_SECRET: String must contain at least 32 character(s)
DATABASE_URL: Invalid
```

## Sicherheit

**WICHTIG:**
- Niemals Secrets in Code committen
- Verwende Secrets-Management-Tools (z.B. AWS Secrets Manager, HashiCorp Vault)
- Rotiere Secrets regelmÃ¤ÃŸig
- Verwende unterschiedliche Secrets fÃ¼r Development, Staging und Production
- Setze `NODE_ENV=production` in Production

## Weitere Informationen

- Validierung: `packages/config/src/env-validator.ts`
- Type-Safe Access: `import { getEnv, getEnvVar } from '@wattweiser/config'`
