# Service-Matrix - WattOS Plattform

**Erstellt:** 2026-01-04  
**Zweck:** VollstÃ¤ndige Ãœbersicht aller Services, Apps, Packages und Workers

## Apps

### Frontend-Apps

| Name | Pfad | Start-Script | Build-Script | Port | ENV-Variablen | Dependencies |
|------|------|--------------|--------------|------|---------------|--------------|
| @wattweiser/web | pps/web | pnpm dev | pnpm build | 3000 (default) | NODE_ENV, NEXT_PUBLIC_* | Next.js, React, Three.js |
| @wattweiser/customer-portal | pps/customer-portal | pnpm dev | pnpm build | 3002 | NODE_ENV, NEXT_PUBLIC_* | Next.js, React, Playwright |
| @wattweiser/console | pps/console | pnpm dev | pnpm build | 3003 | NODE_ENV, NEXT_PUBLIC_* | Next.js, React |

### Backend-Services

| Name | Pfad | Start-Script | Build-Script | Port | ENV-Variablen | Dependencies |
|------|------|--------------|--------------|------|---------------|--------------|
| @wattweiser/gateway | pps/gateway | pnpm dev | pnpm build | 3001 | PORT, JWT_SECRET, CORS_ORIGINS, DATABASE_URL, REDIS_URL | NestJS, JWT, Swagger |
| @wattweiser/chat-service | pps/services/chat-service | pnpm dev | pnpm build | 3006 | PORT, DATABASE_URL, REDIS_URL, CORS_ORIGIN | NestJS, Socket.IO |
| @wattweiser/rag-service | pps/services/rag-service | pnpm dev | pnpm build | 3005 | PORT, DATABASE_URL, REDIS_URL, CORS_ORIGIN, VECTOR_STORE_TYPE | NestJS, Vector Store |
| @wattweiser/agent-service | pps/services/agent-service | pnpm dev | pnpm build | 3003 | PORT, DATABASE_URL, REDIS_URL, LLM_GATEWAY_URL, TOOL_SERVICE_URL | NestJS, LangGraph |
| @wattweiser/character-service | pps/services/character-service | pnpm dev | pnpm build | 3013 | PORT, DATABASE_URL, REDIS_URL, CORS_ORIGINS | NestJS |
| @wattweiser/crawler-service | pps/services/crawler-service | pnpm dev | pnpm build | 3015 | PORT, CRAWLER_SERVICE_PORT, DATABASE_URL, REDIS_URL, CORS_ORIGIN | NestJS, Puppeteer |
| @wattweiser/llm-gateway | pps/services/llm-gateway | pnpm dev | pnpm build | 3015 | PORT, DATABASE_URL, REDIS_URL, OPENAI_API_KEY, ANTHROPIC_API_KEY | NestJS, LLM Providers |
| @wattweiser/admin-service | pps/services/admin-service | pnpm dev | pnpm build | 3007 | PORT, DATABASE_URL, REDIS_URL, CORS_ORIGIN | NestJS |
| @wattweiser/avatar-service | pps/services/avatar-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/voice-service | pps/services/voice-service | pnpm dev | pnpm build | - | PORT, ELEVENLABS_API_KEY, TTS_PROVIDER, STT_PROVIDER | NestJS |
| @wattweiser/tool-service | pps/services/tool-service | pnpm dev | pnpm build | 3004 | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/feedback-service | pps/services/feedback-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/summary-service | pps/services/summary-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/customer-intelligence-service | pps/services/customer-intelligence-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/phone-bot-service | pps/services/phone-bot-service | pnpm dev | pnpm build | 3018 | PORT, TWILIO_* | NestJS, Twilio |
| @wattweiser/whatsapp-bot-service | pps/services/whatsapp-bot-service | pnpm dev | pnpm build | - | PORT, WHATSAPP_* | NestJS |
| @wattweiser/web-chat-service | pps/services/web-chat-service | pnpm dev | pnpm build | 3017 | PORT, DATABASE_URL, REDIS_URL | NestJS, WebSocket |
| @wattweiser/agent-generator-service | pps/services/agent-generator-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/dashboard-service | pps/services/dashboard-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/f13-service | pps/services/f13-service | pnpm dev | pnpm build | - | PORT, F13_* | NestJS |
| @wattweiser/knowledge-enhancement-service | pps/services/knowledge-enhancement-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/monitoring-dashboard-service | pps/services/monitoring-dashboard-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/observability-service | pps/services/observability-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/persona-generator-service | pps/services/persona-generator-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/widget-service | pps/services/widget-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/metaverse-service | pps/services/metaverse-service | pnpm dev | pnpm build | - | PORT, DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/ingestion-service | pps/services/ingestion-service | python main.py | - | - | PYTHON_*, DATABASE_URL | FastAPI, Python |

### Workers

| Name | Pfad | Start-Script | Build-Script | Port | ENV-Variablen | Dependencies |
|------|------|--------------|--------------|------|---------------|--------------|
| @wattweiser/agent-worker | pps/workers/agent-worker | pnpm start | pnpm build | - | DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/document-worker | pps/workers/document-worker | pnpm start | pnpm build | - | DATABASE_URL, REDIS_URL | NestJS |
| @wattweiser/crawler-scheduler | pps/workers/crawler-scheduler | pnpm start | pnpm build | - | DATABASE_URL, REDIS_URL, CRAWLER_SERVICE_URL | NestJS, Cron |
| @wattweiser/kb-sync-worker | pps/workers/kb-sync-worker | pnpm start | pnpm build | - | DATABASE_URL, REDIS_URL | NestJS |

## Packages

| Name | Pfad | Build-Script | Type-Check | Dependencies |
|------|------|--------------|------------|---------------|
| @wattweiser/shared | packages/shared | pnpm build | pnpm type-check | NestJS, Redis, Pino |
| @wattweiser/core | packages/core | pnpm build | pnpm type-check | NestJS, Zod, RxJS |
| @wattweiser/db | packages/db | pnpm build | pnpm type-check | Prisma, PostgreSQL |
| @wattweiser/config | packages/config | pnpm build | pnpm type-check | Zod, Envalid |
| @wattweiser/ui | packages/ui | pnpm build | pnpm type-check | React, Tailwind |
| @wattweiser/agents | packages/agents | pnpm build | pnpm type-check | - |
| @wattweiser/characters | packages/characters | pnpm build | pnpm type-check | - |
| @wattweiser/vector-store | packages/vector-store | pnpm build | pnpm type-check | pgvector, OpenSearch |
| @wattweiser/evaluations | packages/evaluations | pnpm build | pnpm type-check | - |
| @wattweiser/document-processor | packages/document-processor | pnpm build | pnpm type-check | - |
| @wattweiser/metrics | packages/metrics | pnpm build | pnpm type-check | - |
| @wattweiser/addons/avatar | packages/addons/avatar | pnpm build | pnpm type-check | NestJS, GLTF-Transform |
| @wattweiser/addons/dms | packages/addons/dms | pnpm build | pnpm type-check | NestJS |
| @wattweiser/addons/f13 | packages/addons/f13 | pnpm build | pnpm type-check | NestJS |

## Port-Zuordnung (Lokal)

| Service | Port |
|---------|------|
| Gateway | 3001 |
| Customer Portal | 3002 |
| Console | 3003 |
| Agent Service | 3003 (âš ï¸ Konflikt mit Console!) |
| Tool Service | 3004 |
| RAG Service | 3005 |
| Chat Service | 3006 |
| Admin Service | 3007 |
| Character Service | 3013 |
| LLM Gateway | 3015 |
| Crawler Service | 3015 (âš ï¸ Konflikt mit LLM Gateway!) |
| Web Chat Service | 3017 |
| Phone Bot Service | 3018 |

## Globale ENV-Variablen

### Erforderlich
- DATABASE_URL - PostgreSQL Connection String
- REDIS_URL - Redis Connection String  
- JWT_SECRET - JWT Secret (min. 32 Zeichen)

### Optional (Service-spezifisch)
- NODE_ENV - Environment (development, production, staging, test)
- PORT - Service Port (wird von Railway automatisch gesetzt)
- CORS_ORIGIN / CORS_ORIGINS - CORS Origins (komma-separiert)
- OPENAI_API_KEY - OpenAI API Key
- ANTHROPIC_API_KEY - Anthropic API Key
- ELEVENLABS_API_KEY - ElevenLabs API Key
- VECTOR_STORE_TYPE - pgvector oder opensearch
- TTS_PROVIDER - openai, elevenlabs, azure
- STT_PROVIDER - openai, whisper, azure
