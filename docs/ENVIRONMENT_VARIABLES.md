# Environment Variables Dokumentation

Vollständige Liste aller Environment-Variablen der WattOS KI Plattform.

## Kategorien

- [Allgemeine Konfiguration](#allgemeine-konfiguration)
- [Database](#database)
- [Redis](#redis)
- [API Gateway](#api-gateway)
- [Service URLs](#service-urls)
- [LLM Providers](#llm-providers)
- [Vector Store](#vector-store)
- [Voice Service](#voice-service)
- [Crawler Service](#crawler-service)
- [Avatar Service](#avatar-service)
- [Streaming & WebSocket](#streaming--websocket)
- [Tool Service](#tool-service)

## Allgemeine Konfiguration

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `NODE_ENV` | Node.js Environment (`development`, `production`) | `development` | Nein |
| `PORT` | Port für Service (Railway setzt automatisch) | Service-spezifisch | Ja (Railway) |

## Database

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `DATABASE_URL` | PostgreSQL Connection String | - | **Ja** |

**Format:** `postgresql://user:password@host:port/database`

## Redis

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `REDIS_URL` | Redis Connection String | `redis://localhost:6379` | Ja |
| `REDIS_HOST` | Redis Host | `localhost` | Nein |
| `REDIS_PORT` | Redis Port | `6379` | Nein |

## API Gateway

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `API_GATEWAY_PORT` | Port für API Gateway | `3001` | Nein |
| `JWT_SECRET` | Secret für JWT-Token | - | **Ja** |
| `CORS_ORIGIN` | CORS Origin (komma-separiert) | `*` (nur Development) | Nein |
| `CORS_ORIGINS` | Alternative zu CORS_ORIGIN | - | Nein |

## Service URLs

Diese URLs werden für Service-zu-Service Kommunikation verwendet. Auf Railway werden diese automatisch gesetzt.

| Variable | Beschreibung | Default (lokal) | Erforderlich |
|----------|--------------|-----------------|--------------|
| `LLM_GATEWAY_URL` | LLM Gateway Service URL | `http://localhost:3009` | Ja |
| `RAG_SERVICE_URL` | RAG Service URL | `http://localhost:3007` | Ja |
| `CHAT_SERVICE_URL` | Chat Service URL | `http://localhost:3006` | Ja |
| `AGENT_SERVICE_URL` | Agent Service URL | `http://localhost:3008` | Ja |
| `TOOL_SERVICE_URL` | Tool Service URL | `http://localhost:3005` | Ja |
| `ADMIN_SERVICE_URL` | Admin Service URL | `http://localhost:3008` | Ja |
| `CHARACTER_SERVICE_URL` | Character Service URL | `http://localhost:3013` | Ja |
| `INGESTION_SERVICE_URL` | Ingestion Service URL | `http://localhost:8001` | Nein |
| `CUSTOMER_INTELLIGENCE_SERVICE_URL` | Customer Intelligence Service URL | `http://localhost:3014` | Nein |
| `CRAWLER_SERVICE_URL` | Crawler Service URL | `http://localhost:3015` | Nein |
| `VOICE_SERVICE_URL` | Voice Service URL | `http://localhost:3016` | Nein |
| `AVATAR_SERVICE_URL` | Avatar Service URL | `http://localhost:3009` | Nein |

## LLM Providers

Mindestens ein LLM Provider muss konfiguriert sein.

### OpenAI

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `OPENAI_API_KEY` | OpenAI API Key | - | Ja (wenn OpenAI verwendet) |

### Anthropic

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `ANTHROPIC_API_KEY` | Anthropic API Key | - | Ja (wenn Anthropic verwendet) |

### Azure OpenAI

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API Key | - | Ja (wenn Azure verwendet) |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI Endpoint | - | Ja (wenn Azure verwendet) |

### Google

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `GOOGLE_API_KEY` | Google API Key | - | Ja (wenn Google verwendet) |

### Ollama (Lokal)

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `OLLAMA_BASE_URL` | Ollama Base URL | `http://localhost:11434` | Nein |

## Vector Store

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `VECTOR_STORE_TYPE` | Vector Store Typ (`pgvector`, `opensearch`) | `pgvector` | Nein |
| `OPENSEARCH_URL` | OpenSearch URL | `http://localhost:9200` | Nein (wenn OpenSearch) |
| `OPENSEARCH_USERNAME` | OpenSearch Username | - | Nein |
| `OPENSEARCH_PASSWORD` | OpenSearch Password | - | Nein |
| `OPENSEARCH_NODE` | OpenSearch Node URL | `http://localhost:9200` | Nein |
| `EMBEDDINGS_PROVIDER` | Embeddings Provider (`openai`, `ollama`, `local`) | `openai` | Nein |
| `EMBEDDINGS_MODEL` | Embeddings Model | `text-embedding-3-small` | Nein |
| `EMBEDDINGS_DIMENSIONS` | Embeddings Dimensions | `1536` | Nein |
| `DEFAULT_TOP_K` | Default Top K für Suche | `5` | Nein |
| `MAX_TOP_K` | Maximum Top K | `20` | Nein |
| `MIN_SCORE` | Minimum Score für Relevanz | `0.7` | Nein |

## Voice Service

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `TTS_PROVIDER` | TTS Provider (`openai`, `elevenlabs`, `azure`) | `openai` | Nein |
| `STT_PROVIDER` | STT Provider (`openai`, `whisper`, `azure`) | `openai` | Nein |
| `ELEVENLABS_API_KEY` | ElevenLabs API Key | - | Nein (wenn ElevenLabs) |
| `DEFAULT_VOICE` | Default Voice (OpenAI: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`) | `alloy` | Nein |
| `DEFAULT_LANGUAGE` | Default Language | `de` | Nein |
| `VOICE_STREAMING_ENABLED` | Voice Streaming aktivieren | `true` | Nein |
| `VOICE_LOW_LATENCY_MODE` | Low Latency Mode für schnelle Gespräche | `false` | Nein |

## Crawler Service

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `CRAWLER_MAX_DEPTH` | Maximale Crawl-Tiefe | `3` | Nein |
| `CRAWLER_MAX_PAGES` | Maximale Anzahl Seiten | `100` | Nein |
| `CRAWLER_TIMEOUT` | Timeout in ms | `30000` | Nein |
| `CRAWLER_USER_AGENT` | User Agent String | `WattOS-KI-Crawler/1.0` | Nein |
| `CRAWLER_USE_PUPPETEER` | Puppeteer verwenden (für JS-Rendering) | `false` | Nein |

## Avatar Service

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `AVATAR_RENDER_WIDTH` | Render Breite | `1920` | Nein |
| `AVATAR_RENDER_HEIGHT` | Render Höhe | `1080` | Nein |
| `AVATAR_DEFAULT_MODEL` | Default Avatar Model | `default` | Nein |

## Streaming & WebSocket

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `STREAMING_ENABLED` | Streaming aktivieren | `true` | Nein |
| `STREAMING_CHUNK_SIZE` | Chunk Size für Streaming | `50` | Nein |
| `WEBSOCKET_ENABLED` | WebSocket aktivieren | `true` | Nein |

## Tool Service

| Variable | Beschreibung | Default | Erforderlich |
|----------|--------------|---------|--------------|
| `SANDBOX_ENABLED` | Sandbox für Tool-Ausführung | `false` | Nein |
| `SANDBOX_TIMEOUT` | Sandbox Timeout in ms | `30000` | Nein |
| `EMAIL_HOST` | SMTP Host | - | Nein (wenn Email Tool) |
| `EMAIL_PORT` | SMTP Port | `587` | Nein |
| `EMAIL_USER` | SMTP User | - | Nein |
| `EMAIL_PASSWORD` | SMTP Password | - | Nein |
| `JIRA_HOST` | Jira Host URL | - | Nein (wenn Jira Tool) |
| `JIRA_EMAIL` | Jira Email | - | Nein |
| `JIRA_API_TOKEN` | Jira API Token | - | Nein |
| `SLACK_BOT_TOKEN` | Slack Bot Token | - | Nein (wenn Slack Tool) |

## Service-spezifische Ports (nur für lokale Entwicklung)

Auf Railway wird `PORT` automatisch gesetzt. Für lokale Entwicklung können diese verwendet werden:

- `CUSTOMER_INTELLIGENCE_PORT=3014`
- `CRAWLER_SERVICE_PORT=3015`
- `VOICE_SERVICE_PORT=3016`
- `AVATAR_SERVICE_PORT=3009`

## Production vs Development

### Production

- `NODE_ENV=production`
- `CORS_ORIGIN` muss explizit gesetzt werden (kein `*`)
- Alle Secrets müssen gesetzt sein
- `PORT` wird von Railway automatisch gesetzt

### Development

- `NODE_ENV=development`
- `CORS_ORIGIN=*` ist erlaubt
- Default-Werte können verwendet werden
- Lokale Ports können verwendet werden

## Railway-spezifische Variablen

Railway setzt automatisch:
- `PORT` - Port für den Service
- `RAILWAY_ENVIRONMENT` - Environment Name
- `RAILWAY_SERVICE_NAME` - Service Name

Diese sollten nicht manuell gesetzt werden.














