# WattOS Plattform - Service Matrix

**Erstellt:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Zweck:** Übersicht aller Services, Ports, Abhängigkeiten und Start-Commands

## Service-Übersicht

| Service | Typ | Port | Pfad | Build-Command | Start-Command | Health-Check | Priorität | Erforderlich |
|---------|-----|------|------|---------------|---------------|--------------|-----------|--------------|
| **API Gateway** | gateway | 3001 | `apps/gateway` | `cd apps/gateway && npm install && npm run build` | `cd apps/gateway && npm run start:prod` | `/health` | 1 | ✅ Ja |
| **Chat Service** | nestjs | 3006 | `apps/services/chat-service` | `cd apps/services/chat-service && npm install && npm run build` | `cd apps/services/chat-service && npm run start:prod` | `/health` | 2 | ✅ Ja |
| **RAG Service** | nestjs | 3007 | `apps/services/rag-service` | `cd apps/services/rag-service && npm install && npm run build` | `cd apps/services/rag-service && npm run start:prod` | `/health` | 2 | ✅ Ja |
| **Agent Service** | nestjs | 3008 | `apps/services/agent-service` | `cd apps/services/agent-service && npm install && npm run build` | `cd apps/services/agent-service && npm run start:prod` | `/health` | 2 | ✅ Ja |
| **LLM Gateway** | nestjs | 3009 | `apps/services/llm-gateway` | `cd apps/services/llm-gateway && pnpm install && pnpm run build` | `cd apps/services/llm-gateway && pnpm run start:prod` | `/health` | 1 | ✅ Ja |
| **Tool Service** | nestjs | 3005 | `apps/services/tool-service` | `cd apps/services/tool-service && npm install && npm run build` | `cd apps/services/tool-service && npm run start:prod` | `/health` | 2 | ✅ Ja |
| **Customer Intelligence** | nestjs | 3014 | `apps/services/customer-intelligence-service` | `cd apps/services/customer-intelligence-service && npm install && npm run build` | `cd apps/services/customer-intelligence-service && npm run start:prod` | `/health` | 3 | ❌ Nein |
| **Crawler Service** | nestjs | 3015 | `apps/services/crawler-service` | `cd apps/services/crawler-service && npm install && npm run build` | `cd apps/services/crawler-service && npm run start:prod` | `/health` | 3 | ❌ Nein |
| **Voice Service** | nestjs | 3016 | `apps/services/voice-service` | `cd apps/services/voice-service && npm install && npm run build` | `cd apps/services/voice-service && npm run start:prod` | `/health` | 3 | ❌ Nein |
| **Avatar Service** | nestjs | 3017 | `apps/services/avatar-service` | `cd apps/services/avatar-service && npm install && npm run build` | `cd apps/services/avatar-service && npm run start:prod` | `/health` | 4 | ❌ Nein |
| **Character Service** | nestjs | 3013 | `apps/services/character-service` | `cd apps/services/character-service && npm install && npm run build` | `cd apps/services/character-service && npm run start:prod` | `/health` | 4 | ❌ Nein |
| **Feedback Service** | nestjs | 3018 | `apps/services/feedback-service` | `cd apps/services/feedback-service && npm install && npm run build` | `cd apps/services/feedback-service && npm run start:prod` | `/health` | 4 | ❌ Nein |
| **Summary Service** | nestjs | 3019 | `apps/services/summary-service` | `cd apps/services/summary-service && npm install && npm run build` | `cd apps/services/summary-service && npm run start:prod` | `/health` | 4 | ❌ Nein |
| **Admin Service** | nestjs | 3020 | `apps/services/admin-service` | `cd apps/services/admin-service && npm install && npm run build` | `cd apps/services/admin-service && npm run start:prod` | `/health` | 4 | ❌ Nein |
| **Ingestion Service** | python | 8001 | `apps/services/ingestion-service` | `cd apps/services/ingestion-service && pip install -r requirements.txt` | `cd apps/services/ingestion-service && python main.py` | `/health` | 4 | ❌ Nein |
| **Metaverse Service** | nestjs | 3010 | `apps/services/metaverse-service` | `cd apps/services/metaverse-service && npm install && npm run build` | `cd apps/services/metaverse-service && npm run start:prod` | `/health` | 5 | ❌ Nein |
| **Agent Worker** | worker | 0 | `apps/workers/agent-worker` | `cd apps/workers/agent-worker && npm install && npm run build` | `cd apps/workers/agent-worker && npm run start:prod` | `/health` | 5 | ❌ Nein |
| **Document Worker** | worker | 0 | `apps/workers/document-worker` | `cd apps/workers/document-worker && npm install && npm run build` | `cd apps/workers/document-worker && npm run start:prod` | `/health` | 5 | ❌ Nein |
| **Web (Frontend)** | nextjs | 3000 | `apps/web` | `cd apps/web && npm install && npm run build` | `cd apps/web && npm run start` | `/` | 1 | ✅ Ja |

## Service-Abhängigkeiten

### Core Services (Erforderlich für Basis-Funktionalität)
1. **API Gateway** → keine Abhängigkeiten
2. **LLM Gateway** → keine Abhängigkeiten
3. **Chat Service** → LLM Gateway, RAG Service
4. **RAG Service** → LLM Gateway
5. **Agent Service** → LLM Gateway, Tool Service
6. **Tool Service** → keine Abhängigkeiten
7. **Web (Frontend)** → API Gateway

### Optional Services
- **Customer Intelligence** → LLM Gateway, Agent Service, RAG Service, Chat Service, Admin Service, Crawler Service
- **Crawler Service** → keine Abhängigkeiten
- **Voice Service** → LLM Gateway, Chat Service
- **Avatar Service** → Voice Service
- **Character Service** → keine Abhängigkeiten
- **Feedback Service** → keine Abhängigkeiten
- **Summary Service** → LLM Gateway
- **Admin Service** → keine Abhängigkeiten
- **Ingestion Service** → Admin Service
- **Metaverse Service** → keine Abhängigkeiten

### Workers
- **Agent Worker** → Agent Service
- **Document Worker** → Ingestion Service

## Infrastructure Dependencies

| Service | PostgreSQL | Redis | Sonstige |
|---------|------------|-------|----------|
| API Gateway | ❌ | ✅ | - |
| Chat Service | ✅ | ✅ | - |
| RAG Service | ✅ | ❌ | - |
| Agent Service | ✅ | ✅ | - |
| LLM Gateway | ✅ | ❌ | - |
| Tool Service | ❌ | ❌ | - |
| Customer Intelligence | ✅ | ❌ | - |
| Crawler Service | ❌ | ❌ | - |
| Voice Service | ❌ | ❌ | - |
| Avatar Service | ❌ | ❌ | - |
| Character Service | ✅ | ❌ | - |
| Feedback Service | ✅ | ❌ | - |
| Summary Service | ✅ | ❌ | - |
| Admin Service | ✅ | ✅ | - |
| Ingestion Service | ✅ | ✅ | - |
| Metaverse Service | ❌ | ❌ | - |
| Agent Worker | ❌ | ✅ | - |
| Document Worker | ❌ | ✅ | - |

## Environment Variables (Kritisch)

### API Gateway
- `JWT_SECRET` (required)
- `CORS_ORIGIN` (optional, default: "*")
- `DEPLOYMENT_PLATFORM` (optional, default: "railway")

### Chat Service
- `LLM_GATEWAY_URL` (required)
- `RAG_SERVICE_URL` (required)
- `VOICE_SERVICE_URL` (optional)

### RAG Service
- `LLM_GATEWAY_URL` (required)
- `VECTOR_STORE_TYPE` (optional, default: "pgvector")

### Agent Service
- `LLM_GATEWAY_URL` (required)
- `TOOL_SERVICE_URL` (required)

### LLM Gateway
- `OPENAI_API_KEY` (required)
- `ANTHROPIC_API_KEY` (optional)

### Ingestion Service
- `ADMIN_SERVICE_URL` (required)

## Start-Reihenfolge (Lokal)

1. **Infrastructure:**
   - PostgreSQL (Port 5432)
   - Redis (Port 6379)

2. **Core Services:**
   - LLM Gateway (3009)
   - Tool Service (3005)
   - RAG Service (3007)
   - Agent Service (3008)
   - Chat Service (3006)
   - API Gateway (3001)
   - Web Frontend (3000)

3. **Optional Services:**
   - Admin Service (3020)
   - Ingestion Service (8001)
   - Voice Service (3016)
   - Avatar Service (3017)
   - Character Service (3013)
   - Feedback Service (3018)
   - Summary Service (3019)
   - Customer Intelligence (3014)
   - Crawler Service (3015)
   - Metaverse Service (3010)

4. **Workers:**
   - Agent Worker
   - Document Worker

## Test-Strategie

### Unit Tests
- Alle Services haben `test` Script in `package.json`
- Jest für NestJS Services
- Vitest für Frontend

### Integration Tests
- Supertest für REST-APIs
- Mock Services für externe Dependencies

### E2E Tests
- Playwright für Frontend (9:16 Layout, Avatar, Chat)
- Smoke Tests für kritische Flows

### Performance Tests
- Autocannon für API-Load-Tests
- Web Vitals für Frontend-Performance

## Notes

- **Port-Konflikte:** Einige Services teilen sich Ports (z.B. Agent Service 3008, Ingestion Service 3008) → Prüfen!
- **Python Service:** Ingestion Service benötigt Python 3.10+ und `pip install -r requirements.txt`
- **Workspace Dependencies:** Viele Services nutzen `@wattweiser/*` Workspace-Packages → `pnpm install` im Root ausführen

