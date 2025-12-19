# WattOS KI - Architektur-Übersicht

## System-Architektur (High-Level)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend (Web)                          │
│                    Port: 3000 | i18n: de/en | SSR                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 │ HTTP/WebSocket
                                 │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                          API Gateway                                    │
│                    Port: 3001 | Auth | Rate-Limiting | Proxy            │
└───────────────────────────────┬─────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Chat Service │      │  RAG Service  │      │ Agent Service │
│  Port: 3006   │      │  Port: 3007   │      │  Port: 3008   │
│  WebSocket    │      │  Vector Store │      │  LangGraph    │
│  SSE          │      │  pgvector     │      │  Tools        │
└───────────────┘      └───────────────┘      └───────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ LLM Gateway   │      │  PostgreSQL   │      │  Tool Service │
│  Port: 3009   │      │  Port: 5432   │      │  Port: 3005   │
│  Multi-LLM    │      │  + pgvector   │      │  HTTP/Email   │
│  Cost-Track   │      │  + Chunks     │      │  Jira/Slack   │
└───────────────┘      └───────────────┘      └───────────────┘
                                 │
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ Ingestion     │      │  Character    │      │  Admin        │
│  Port: 8001   │      │  Port: 3013   │      │  Port: 3008   │
│  FastAPI      │      │  Characters   │      │  RBAC/Metrics │
│  File Watch   │      │  Artifacts    │      │  Knowledge    │
└───────────────┘      └───────────────┘      └───────────────┘
        │
        │
        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Customer     │      │    Crawler    │      │    Voice      │
│  Intelligence │      │  Port: 3015   │      │  Port: 3016   │
│  Port: 3014   │      │  Website      │      │  TTS/STT      │
│  Analytics    │      │  Crawling     │      │  Streaming    │
│  Personas     │      └───────────────┘      └───────────────┘
│  Agent Gen    │              │                       │
└───────────────┘              │                       │
        │                      │                       │
        │                      ▼                       ▼
        │              ┌───────────────┐      ┌───────────────┐
        │              │    Redis      │      │    Avatar     │
        │              │  Port: 6379   │      │  Port: 3009   │
        │              │  Queue/Cache  │      │  Babylon.js   │
        │              └───────────────┘      │  Rendering    │
        │                                     └───────────────┘
        └─────────────────────────────────────────────┘
```

## Service-Details

### 1. API Gateway (Port: 3001)
**Technologie:** NestJS
**Funktionen:**
- ✅ JWT-basierte Authentifizierung
- ✅ Rate Limiting (100 req/min)
- ✅ Request Routing & Proxy
- ✅ Audit Logging
- ✅ CORS-Management

**Endpunkte:**
- `/api/auth/*` → Auth-Service
- `/api/v1/characters/*` → Character-Service
- `/api/v1/conversations/*` → Chat-Service
- `/api/v1/artifacts/*` → Character-Service
- `/api/admin/*` → Admin-Service
- `/api/analytics/*` → Customer Intelligence Service
- `/api/crawler/*` → Crawler Service
- `/api/voice/*` → Voice Service
- `/db/*` → Admin-Service (für Python-Services)

### 2. Chat Service (Port: 3006)
**Technologie:** NestJS
**Funktionen:**
- ✅ WebSocket/SSE für Echtzeit-Chat
- ✅ Chat-Historie (PostgreSQL)
- ✅ Multi-LLM-Switch
- ✅ RAG-Integration
- ✅ Streaming-Support

**Endpunkte:**
- `POST /v1/conversations` - Conversation erstellen
- `POST /v1/conversations/message` - Nachricht senden
- `SSE /v1/conversations/message/stream` - Streaming
- `GET /v1/conversations/:threadId` - Conversation abrufen

**Tools:**
- `streaming.service.ts` - SSE-Streaming
- `conversations.service.ts` - Conversation-Management
- `websocket.gateway.ts` - WebSocket-Handling

### 3. RAG Service (Port: 3007)
**Technologie:** NestJS
**Funktionen:**
- ✅ Vector Store Integration (pgvector, OpenSearch)
- ✅ Document Retrieval
- ✅ Context-Aufbereitung
- ✅ Citations
- ✅ Two-Stage Retrieval

**Endpunkte:**
- `POST /search` - Vector-Suche
- `POST /context/build` - Context erstellen
- `POST /citations/generate` - Citations generieren

**Tools:**
- `search.service.ts` - Vector-Suche
- `context.service.ts` - Context-Aufbereitung
- `vector-store.service.ts` - Vector Store Wrapper

### 4. Agent Service (Port: 3008)
**Technologie:** NestJS + LangGraph
**Funktionen:**
- ✅ Agent-Orchestrierung (LangGraph)
- ✅ Tool-Ausführung
- ✅ Human-in-the-Loop (HiTL)
- ✅ Rollenbasierte Agenten

**Endpunkte:**
- `POST /agents/:id/run` - Agent-Run starten
- `GET /agents/:id/runs/:runId` - Run-Status abrufen
- `POST /hitl/approve` - Approval erteilen

**Tools:**
- `graph.service.ts` - LangGraph-Orchestrierung
- `graph-state.service.ts` - State-Management
- `hitl.service.ts` - Human-in-the-Loop
- `agent.service.ts` - Agent-Management

### 5. LLM Gateway (Port: 3009)
**Technologie:** NestJS
**Funktionen:**
- ✅ Multi-Provider Support (OpenAI, Anthropic, Azure, Google, Ollama)
- ✅ Automatisches Fallback
- ✅ Cost-Tracking & DB-Persistierung
- ✅ Provider Health Monitoring

**Hinweis:** Port 3009 wird auch von Avatar Service verwendet. In Produktion sollten unterschiedliche Ports oder separate Deployments verwendet werden.

**Endpunkte:**
- `POST /v1/chat/completions` - Chat Completion
- `POST /v1/completions` - Legacy Completion
- `POST /v1/embeddings` - Embeddings generieren

**Tools:**
- `llm.service.ts` - LLM-Orchestrierung
- `cost-tracking.service.ts` - Kostenverfolgung
- `provider-factory.ts` - Provider-Management

### 6. Tool Service (Port: 3005)
**Technologie:** NestJS
**Funktionen:**
- ✅ Tool-Registry
- ✅ HTTP/Email/Jira/Slack Adapter
- ✅ Tool-Ausführung mit Sandboxing
- ✅ Health Checks

**Endpunkte:**
- `POST /tools/execute` - Tool ausführen
- `GET /tools/:toolId/health` - Health Check
- `GET /tools` - Verfügbare Tools auflisten

**Tools:**
- `tool.service.ts` - Tool-Orchestrierung
- `registry.service.ts` - Tool-Registry
- `adapter.factory.ts` - Adapter-Management
- `execution.service.ts` - Tool-Ausführung

### 7. Character Service (Port: 3013)
**Technologie:** NestJS
**Funktionen:**
- ✅ Character-Management (CRUD)
- ✅ Artifact-Management (URLs, Dokumente)
- ✅ Knowledge Base-Verknüpfung

**Endpunkte:**
- `POST /api/v1/characters` - Character erstellen
- `GET /api/v1/characters` - Alle Characters
- `GET /api/v1/characters/:role` - Character nach role
- `POST /api/v1/artifacts/add_url` - Artefakt hinzufügen
- `GET /api/v1/artifacts` - Artefakte auflisten

**Tools:**
- `character.service.ts` - Character-Management
- `artifacts.service.ts` - Artifact-Management

### 8. Admin Service (Port: 3008)
**Technologie:** NestJS
**Funktionen:**
- ✅ RBAC-Verwaltung
- ✅ Knowledge Spaces Management
- ✅ Audit-Log-Viewer
- ✅ Metrics & Analytics
- ✅ DB-API für Python-Services

**Hinweis:** Port 3008 wird auch von Agent Service verwendet. In Produktion sollten unterschiedliche Ports oder separate Deployments verwendet werden.

**Endpunkte:**
- `POST /admin/knowledge-spaces` - Knowledge Space erstellen
- `GET /admin/knowledge-spaces` - Auflisten
- `POST /db/documents` - Document erstellen (für Ingestion)
- `POST /db/chunks` - Chunks speichern (für Ingestion)

**Tools:**
- `rbac.service.ts` - Rollen & Berechtigungen
- `knowledge-spaces.service.ts` - Knowledge Space-Management
- `db.service.ts` - DB-API für Python-Services
- `metrics.service.ts` - Metriken & Analytics

### 9. Ingestion Service (Port: 8001)
**Technologie:** FastAPI (Python)
**Funktionen:**
- ✅ File Watching
- ✅ Queue Management (Redis)
- ✅ Document Processing
- ✅ DB-Integration über HTTP-API

**Endpunkte:**
- `POST /upload` - Dokument hochladen
- `GET /status/:document_id` - Status abrufen
- `GET /queue/stats` - Queue-Statistiken
- `POST /watch/start` - File-Watcher starten

**Tools:**
- `processor.py` - Document Processing
- `queue_manager.py` - Queue Management
- `file_watcher.py` - File Watching

### 10. Customer Intelligence Service (Port: 3014)
**Technologie:** NestJS
**Funktionen:**
- ✅ Kundenanalyse (Zielgruppen, Demografie, Verhalten)
- ✅ Automatische Persona-Generierung (LLM-basiert)
- ✅ Automatische Agent-Generierung für Personas
- ✅ Content-Anreicherung für Zielgruppen
- ✅ Mehrsprachige Unterstützung
- ✅ Knowledge Base-Verknüpfung
- ✅ Robuste Fehlerbehandlung mit Fallbacks

**Endpunkte:**
- `POST /api/v1/analytics/analyze` - Analyse starten
- `GET /api/v1/analytics/:id` - Analyse-Status abrufen
- `GET /api/v1/analytics/:id/report` - Vollständiger Report
- `GET /api/v1/analytics/:analysisId/personas` - Personas abrufen
- `GET /api/v1/analytics/personas/:id` - Einzelne Persona abrufen
- `POST /api/v1/analytics/personas/:id/refine` - Persona verfeinern
- `POST /api/v1/analytics/generate-agents` - Agents generieren
- `GET /api/v1/analytics/generations/:id` - Generation-Status abrufen
- `POST /api/v1/analytics/enrich-content` - Content anreichern
- `GET /api/v1/analytics/target-groups/:id/enriched-content` - Angereicherten Content abrufen
- `POST /webhooks/crawler/data` - Crawler-Daten Webhook (Stub)
- `POST /webhooks/ingestion/document-processed` - Dokument verarbeitet Webhook (Stub)

**Tools:**
- `analysis.service.ts` - Analyse-Orchestrierung (inkl. automatischer Persona-Generierung)
- `data-aggregation.service.ts` - Datenaggregation (Crawler, Documents, Conversations)
- `target-group.service.ts` - Zielgruppen-Identifikation (LLM-basiert mit Fallbacks)
- `personas.service.ts` - Persona-Generierung (LLM-basiert, robuste JSON-Parsing)
- `agent-generation.service.ts` - Agent-Generierung (mit Knowledge Base-Verknüpfung)
- `content-enrichment.service.ts` - Content-Anreicherung (Relevanz-Scoring, Sprach-Erkennung)

**Datenmodell:**
- `CustomerAnalysis` - Haupt-Analyse-Entität
- `TargetGroup` - Identifizierte Zielgruppen
- `Persona` - Generierte Personas
- `ContentEnrichment` - Angereicherte Content-Daten
- `AgentGeneration` - Tracking der Agent-Generierung

## Datenfluss-Diagramme

### Chat-Flow mit RAG

```
User → Frontend → API Gateway → Chat Service
                                      │
                                      ├─→ RAG Service → Vector Store (pgvector)
                                      │       │
                                      │       └─→ Context + Citations
                                      │
                                      └─→ LLM Gateway → OpenAI/Anthropic/etc.
                                              │
                                              └─→ Cost Tracking → DB
```

### Agent-Run Flow

```
User → Frontend → API Gateway → Agent Service
                                      │
                                      ├─→ Graph Service (LangGraph)
                                      │       │
                                      │       ├─→ LLM Node → LLM Gateway
                                      │       │
                                      │       ├─→ Router Node (Tool Calls?)
                                      │       │
                                      │       └─→ Tools Node → Tool Service
                                      │               │
                                      │               └─→ HTTP/Email/Jira/etc.
                                      │
                                      └─→ HiTL Service (bei Approval)
                                              │
                                              └─→ Notification → Approver
```

### Document Ingestion Flow

```
File Upload → Ingestion Service → Queue (Redis)
                                      │
                                      ├─→ Document Processor
                                      │       │
                                      │       ├─→ Chunking
                                      │       │
                                      │       ├─→ Embeddings (LLM Gateway)
                                      │       │
                                      │       ├─→ PII-Redaction
                                      │       │
                                      │       └─→ Vector Store (RAG Service)
                                      │
                                      └─→ DB-API (Admin Service)
                                              │
                                              └─→ PostgreSQL (Documents + Chunks)
```

## Tool-Übersicht

### Verfügbare Tools im Tool Service

1. **HTTP Tool**
   - GET/POST/PUT/DELETE Requests
   - Headers & Body-Konfiguration
   - Timeout-Management

2. **Email Tool**
   - SMTP-Versand
   - HTML/Text-Support
   - Anhänge

3. **Jira Tool**
   - Ticket erstellen/aktualisieren
   - Kommentare hinzufügen
   - Status-Änderungen

4. **Slack Tool**
   - Nachrichten senden
   - Channels & DMs
   - File-Uploads

5. **Retrieval Tool**
   - RAG-Suche über RAG-Service
   - Knowledge Space-Integration
   - Context-Aufbereitung

6. **Calendar Tool**
   - Events erstellen
   - Verfügbarkeit prüfen
   - Einladungen senden

### Tool-Ausführung

```
Agent → Tool Call Request
         │
         └─→ Tool Service
                 │
                 ├─→ Registry (Tool finden)
                 │
                 ├─→ Adapter Factory (Adapter wählen)
                 │
                 ├─→ Execution Service
                 │       │
                 │       ├─→ Input Validation
                 │       │
                 │       ├─→ Sandboxing (optional)
                 │       │
                 │       └─→ Tool Execution
                 │
                 └─→ Result → Agent
```

## Datenbank-Schema (Kern-Tabellen)

```
Users
  ├─→ Roles (RBAC)
  └─→ Tenants

KnowledgeSpaces
  └─→ Documents
        └─→ Chunks (mit Embeddings)

Agents
  └─→ AgentRuns
        └─→ ToolCalls

Characters
  ├─→ Conversations
  │     └─→ ConversationMessages
  └─→ Artifacts

LLMUsage (Cost-Tracking)
Feedback
AuditLogs
```

## Kommunikations-Patterns

### Synchron (HTTP)
- Frontend ↔ API Gateway
- Services ↔ Services (REST)
- Python ↔ Node (HTTP-API)

### Asynchron (Queue)
- Ingestion → Document Processing
- Agent Runs → Background Processing

### Streaming (SSE/WebSocket)
- Chat Messages → Real-time Updates
- Agent Runs → Progress Updates

## Konfiguration & Umgebungsvariablen

### Wichtigste ENV-Variablen

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/wattos_ki

# Redis
REDIS_URL=redis://localhost:6379

# Services
LLM_GATEWAY_URL=http://localhost:3009
RAG_SERVICE_URL=http://localhost:3007
CHAT_SERVICE_URL=http://localhost:3006
AGENT_SERVICE_URL=http://localhost:3008
TOOL_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3008
CHARACTER_SERVICE_URL=http://localhost:3013
INGESTION_SERVICE_URL=http://localhost:8001
CUSTOMER_INTELLIGENCE_SERVICE_URL=http://localhost:3014
CRAWLER_SERVICE_URL=http://localhost:3015
VOICE_SERVICE_URL=http://localhost:3016

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AZURE_OPENAI_API_KEY=...
GOOGLE_API_KEY=...

# Vector Store
VECTOR_STORE_TYPE=pgvector  # oder opensearch
OPENSEARCH_URL=http://localhost:9200
```

## Deployment-Architektur

### Railway Deployment (Hybrid-Strategie)

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Platform                      │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │ API Gateway  │  │   Services   │ │
│  │  (Vercel)    │  │  (Railway)   │  │  (Railway)   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │         │
│         └──────────────────┴──────────────────┘         │
│                          │                               │
│         ┌────────────────┴────────────────┐             │
│         │                                  │             │
│  ┌──────▼──────┐                  ┌───────▼──────┐      │
│  │ PostgreSQL  │                  │    Redis    │      │
│  │  (Railway)  │                  │  (Railway)   │      │
│  └─────────────┘                  └─────────────┘      │
│                                                          │
│  Separate Services:                                      │
│  - API Gateway (Port 3001)                               │
│  - Chat Service (Port 3006)                              │
│  - RAG Service (Port 3007)                               │
│  - Agent Service (Port 3008)                             │
│  - LLM Gateway (Port 3009)                               │
│  - Customer Intelligence (Port 3014)                     │
│  - Crawler Service (Port 3015)                           │
│  - Voice Service (Port 3016)                             │
│                                                          │
│  Zusammen:                                                │
│  - Admin + Character Service                             │
│  - Tool + Summary + Feedback Service                     │
└──────────────────────────────────────────────────────────┘
```

### Lokale Entwicklung

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │ API Gateway  │  │   Services   │ │
│  │  (Next.js)   │  │  (NestJS)    │  │  (NestJS)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  PostgreSQL  │  │    Redis    │                    │
│  │  (pgvector)  │  │   (Queue)   │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                          │
│  ┌──────────────┐                                       │
│  │  Ingestion   │                                       │
│  │  (FastAPI)   │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

## Sicherheit & Compliance

- ✅ JWT-basierte Authentifizierung
- ✅ RBAC (Rollen & Berechtigungen)
- ✅ Audit Logging (alle Aktionen)
- ✅ PII-Redaction (automatisch)
- ✅ DSGVO-konform (EU-Hosting)
- ✅ Multi-Tenant-Isolation

## Performance-Optimierungen

- ✅ Graph-Caching (Agent-Service)
- ✅ Vector Store Indexing (pgvector)
- ✅ Redis Caching
- ✅ Lazy Loading (Frontend)
- ✅ Streaming (SSE/WebSocket)
- ✅ Connection Pooling (PostgreSQL)

