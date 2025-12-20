# WattOS Plattform - Service Matrix

**Generiert am**: 2025-12-20T12:25:38.928Z
**Anzahl Services**: 24

## Übersicht

Diese Matrix enthält alle Services, Packages und Workers der WattOS Plattform mit ihren Konfigurationen, Ports, Environment-Variablen und Abhängigkeiten.

## Services

| Name | Display Name | Typ | Port | Pfad | Build Script | Start Script | Health Check | Required | Priority |
|------|--------------|-----|------|------|--------------|--------------|--------------|----------|----------|
| api-gateway | API Gateway | gateway | 3001 | `apps/gateway` | `cd apps/gateway && npm install && npm run build...` | `cd apps/gateway && npm run start:prod...` | /health | ✅ | 1 |
| llm-gateway | LLM Gateway | nestjs | 3009 | `apps/services/llm-gateway` | `cd apps/services/llm-gateway && pnpm install && pn...` | `cd apps/services/llm-gateway && pnpm run start:pro...` | /health | ✅ | 1 |
| agent-service | Agent Service | nestjs | 3008 | `apps/services/agent-service` | `cd apps/services/agent-service && npm install && n...` | `cd apps/services/agent-service && npm run start:pr...` | /health | ✅ | 2 |
| chat-service | Chat Service | nestjs | 3006 | `apps/services/chat-service` | `cd apps/services/chat-service && npm install && np...` | `cd apps/services/chat-service && npm run start:pro...` | /health | ✅ | 2 |
| rag-service | RAG Service | nestjs | 3007 | `apps/services/rag-service` | `cd apps/services/rag-service && npm install && npm...` | `cd apps/services/rag-service && npm run start:prod...` | /health | ✅ | 2 |
| tool-service | Tool Service | nestjs | 3005 | `apps/services/tool-service` | `cd apps/services/tool-service && npm install && np...` | `cd apps/services/tool-service && npm run start:pro...` | /health | ✅ | 2 |
| crawler-service | Crawler Service | nestjs | 3015 | `apps/services/crawler-service` | `cd apps/services/crawler-service && npm install &&...` | `cd apps/services/crawler-service && npm run start:...` | /health | ❌ | 3 |
| customer-intelligence-service | Customer Intelligence Service | nestjs | 3014 | `apps/services/customer-intelligence-service` | `cd apps/services/customer-intelligence-service && ...` | `cd apps/services/customer-intelligence-service && ...` | /health | ❌ | 3 |
| voice-service | Voice Service | nestjs | 3016 | `apps/services/voice-service` | `cd apps/services/voice-service && npm install && n...` | `cd apps/services/voice-service && npm run start:pr...` | /health | ❌ | 3 |
| admin-service | Admin Service | nestjs | 3020 | `apps/services/admin-service` | `cd apps/services/admin-service && npm install && n...` | `cd apps/services/admin-service && npm run start:pr...` | /health | ❌ | 4 |
| avatar-service | Avatar Service | nestjs | 3017 | `apps/services/avatar-service` | `cd apps/services/avatar-service && npm install && ...` | `cd apps/services/avatar-service && npm run start:p...` | /health | ❌ | 4 |
| character-service | Character Service | nestjs | 3013 | `apps/services/character-service` | `cd apps/services/character-service && npm install ...` | `cd apps/services/character-service && npm run star...` | /health | ❌ | 4 |
| feedback-service | Feedback Service | nestjs | 3018 | `apps/services/feedback-service` | `cd apps/services/feedback-service && npm install &...` | `cd apps/services/feedback-service && npm run start...` | /health | ❌ | 4 |
| gateway | gateway | gateway | 3001 | `apps\gateway` | `nest build...` | `node dist/main...` | /health | ❌ | 4 |
| ingestion-service | Ingestion Service | python | 8001 | `apps/services/ingestion-service` | `cd apps/services/ingestion-service && pip install ...` | `cd apps/services/ingestion-service && python main....` | /health | ❌ | 4 |
| phone-bot-service | Phone-Bot Service für WattOS V2 | nestjs | 3018 | `apps\services\phone-bot-service` | `nest build...` | `nest start...` | /health | ❌ | 4 |
| summary-service | Summary Service | nestjs | 3019 | `apps/services/summary-service` | `cd apps/services/summary-service && npm install &&...` | `cd apps/services/summary-service && npm run start:...` | /health | ❌ | 4 |
| web | web | nextjs | 3000 | `apps\web` | `next build...` | `next start...` | /health | ❌ | 4 |
| web-chat-service | Web-Chatbot Service für WattOS V2 | nestjs | 3017 | `apps\services\web-chat-service` | `nest build...` | `nest start...` | /health | ❌ | 4 |
| whatsapp-bot-service | WhatsApp-Bot Service für WattOS V2 | nestjs | 3019 | `apps\services\whatsapp-bot-service` | `nest build...` | `nest start...` | /health | ❌ | 4 |
| widget-service | Widget Service - Embeddable Chat/Voice Bot Widget | nestjs | - | `apps\services\widget-service` | `nest build...` | `nest start...` | /health | ❌ | 4 |
| agent-worker | Agent Worker | worker | - | `apps/workers/agent-worker` | `cd apps/workers/agent-worker && npm install && npm...` | `cd apps/workers/agent-worker && npm run start:prod...` | /health | ❌ | 5 |
| document-worker | Document Worker | worker | - | `apps/workers/document-worker` | `cd apps/workers/document-worker && npm install && ...` | `cd apps/workers/document-worker && npm run start:p...` | /health | ❌ | 5 |
| metaverse-service | Metaverse Service | nestjs | 3010 | `apps/services/metaverse-service` | `cd apps/services/metaverse-service && npm install ...` | `cd apps/services/metaverse-service && npm run star...` | /health | ❌ | 5 |

## Packages

| Name | Display Name | Pfad | Build Script |
|------|--------------|------|--------------|

## Environment Variables

### API Gateway (api-gateway)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `JWT_SECRET` | ✅ | Secret für JWT-Token-Generierung | - |
| `CORS_ORIGIN` | ❌ | CORS Origin (komma-separiert) | * |

### LLM Gateway (llm-gateway)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `OPENAI_API_KEY` | ✅ | OpenAI API Key | - |
| `ANTHROPIC_API_KEY` | ❌ | Anthropic API Key (optional) | - |

### Agent Service (agent-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `LLM_GATEWAY_URL` | ✅ | URL des LLM Gateway Services | - |
| `TOOL_SERVICE_URL` | ✅ | URL des Tool Services | - |

### Chat Service (chat-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `LLM_GATEWAY_URL` | ✅ | URL des LLM Gateway Services | - |
| `RAG_SERVICE_URL` | ✅ | URL des RAG Services | - |
| `VOICE_SERVICE_URL` | ❌ | URL des Voice Services | - |

### RAG Service (rag-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `LLM_GATEWAY_URL` | ✅ | URL des LLM Gateway Services (für Embeddings) | - |
| `VECTOR_STORE_TYPE` | ❌ | Vector Store Typ | pgvector |

### Tool Service (tool-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `SANDBOX_ENABLED` | ❌ | Sandbox für Tool-Ausführung aktivieren | false |

### Crawler Service (crawler-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `CRAWLER_MAX_DEPTH` | ❌ | Maximale Crawl-Tiefe | 3 |

### Customer Intelligence Service (customer-intelligence-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `LLM_GATEWAY_URL` | ✅ | URL des LLM Gateway Services | - |
| `AGENT_SERVICE_URL` | ✅ | URL des Agent Services | - |

### Voice Service (voice-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `ELEVENLABS_API_KEY` | ❌ | ElevenLabs API Key | - |
| `ELEVENLABS_VOICE_ID` | ❌ | ElevenLabs Voice ID | - |
| `OPENAI_API_KEY` | ❌ | OpenAI API Key (für STT/TTS) | - |

### Admin Service (admin-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |

### Avatar Service (avatar-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |

### Character Service (character-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |

### Feedback Service (feedback-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |

### gateway (gateway)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform | railway |

### Ingestion Service (ingestion-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `ADMIN_SERVICE_URL` | ✅ | URL des Admin Services (für DB-API) | - |

### Phone-Bot Service für WattOS V2 (phone-bot-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform | railway |

### Summary Service (summary-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `LLM_GATEWAY_URL` | ✅ | URL des LLM Gateway Services | - |

### web (web)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform | railway |

### Web-Chatbot Service für WattOS V2 (web-chat-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform | railway |

### WhatsApp-Bot Service für WattOS V2 (whatsapp-bot-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform | railway |

### Widget Service - Embeddable Chat/Voice Bot Widget (widget-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform | railway |

### Agent Worker (agent-worker)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `AGENT_SERVICE_URL` | ✅ | URL des Agent Services | - |

### Document Worker (document-worker)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |
| `INGESTION_SERVICE_URL` | ✅ | URL des Ingestion Services | - |

### Metaverse Service (metaverse-service)

| Variable | Required | Description | Default |
|----------|----------|-------------|----------|
| `DEPLOYMENT_PLATFORM` | ❌ | Deployment Platform (railway, kubernetes, local) | railway |
| `NODE_ENV` | ❌ | Node.js Environment | production |

## Dependencies

### API Gateway (api-gateway)

**Infrastructure Dependencies**: redis

### LLM Gateway (llm-gateway)

**Infrastructure Dependencies**: postgresql

### Agent Service (agent-service)

**Service Dependencies**: llm-gateway, tool-service

**Infrastructure Dependencies**: postgresql, redis

### Chat Service (chat-service)

**Service Dependencies**: llm-gateway, rag-service

**Infrastructure Dependencies**: postgresql, redis

### RAG Service (rag-service)

**Service Dependencies**: llm-gateway

**Infrastructure Dependencies**: postgresql

### Customer Intelligence Service (customer-intelligence-service)

**Service Dependencies**: llm-gateway, agent-service, rag-service, chat-service, admin-service, crawler-service

**Infrastructure Dependencies**: postgresql

### Voice Service (voice-service)

**Service Dependencies**: llm-gateway, chat-service

### Admin Service (admin-service)

**Infrastructure Dependencies**: postgresql, redis

### Avatar Service (avatar-service)

**Service Dependencies**: voice-service

### Character Service (character-service)

**Infrastructure Dependencies**: postgresql

### Feedback Service (feedback-service)

**Infrastructure Dependencies**: postgresql

### Ingestion Service (ingestion-service)

**Service Dependencies**: admin-service

**Infrastructure Dependencies**: postgresql, redis

### Summary Service (summary-service)

**Service Dependencies**: llm-gateway

**Infrastructure Dependencies**: postgresql

### Agent Worker (agent-worker)

**Service Dependencies**: agent-service

**Infrastructure Dependencies**: redis

### Document Worker (document-worker)

**Service Dependencies**: ingestion-service

**Infrastructure Dependencies**: redis

## Deployment Priority

- **Priority 1**: Kritische Services (API Gateway, LLM Gateway)
- **Priority 2**: Wichtige Services (Chat, RAG, Agent, Tool)
- **Priority 3**: Optionale Services (Customer Intelligence, Crawler, Voice)
- **Priority 4**: Zusätzliche Services (Admin, Character, Summary, Feedback, Avatar, Ingestion)
- **Priority 5**: Workers und Metaverse
- **Priority 0**: Packages (nur Build, kein Deployment)
