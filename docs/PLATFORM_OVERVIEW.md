# WattOS KI - Plattform-Übersicht

## Executive Summary

WattOS KI ist eine umfassende, modulare KI-Plattform für Unternehmen, Kommunen und Organisationen. Die Plattform ermöglicht es, intelligente Agenten zu erstellen, die automatisch auf Basis von Kundendaten, Zielgruppen und Personas generiert werden. Sie bietet vollständige RAG-Funktionalität, Multi-LLM-Support, Voice-Integration, Avatar-Funktionalität und vieles mehr.

## Architektur-Übersicht

### Microservices-Architektur

Die Plattform basiert auf einer modernen Microservices-Architektur mit klarer Separation of Concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Web)                        │
│              Port: 3000 | i18n: de/en | SSR                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ HTTP/WebSocket
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                          API Gateway                             │
│              Port: 3001 | Auth | Rate-Limiting | Proxy            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Chat Service │      │  RAG Service  │      │ Agent Service│
│  Port: 3006   │      │  Port: 3007   │      │  Port: 3008   │
│  WebSocket    │      │  Vector Store │      │  LangGraph    │
│  SSE          │      │  pgvector     │      │  Tools        │
└───────────────┘      └───────────────┘      └───────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ LLM Gateway   │      │  PostgreSQL   │      │  Tool Service │
│  Port: 3009   │      │  Port: 5432   │      │  Port: 3005   │
│  Multi-LLM    │      │  + pgvector   │      │  HTTP/Email   │
│  Cost-Track   │      │  + Chunks     │      │  Jira/Slack   │
└───────────────┘      └───────────────┘      └───────────────┘
                                │
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ Ingestion     │      │  Character   │      │  Admin        │
│  Port: 8001   │      │  Port: 3013   │      │  Port: 3008   │
│  FastAPI      │      │  Characters   │      │  RBAC/Metrics │
│  File Watch   │      │  Artifacts    │      │  Knowledge    │
└───────────────┘      └───────────────┘      └───────────────┘
        │
        │
        ▼
┌───────────────┐
│  Customer     │
│  Intelligence │
│  Port: 3014   │
│  Analytics    │
│  Personas     │
│  Agent Gen    │
└───────────────┘
        │
        │
        ▼
┌───────────────┐
│    Redis      │
│  Port: 6379   │
│  Queue/Cache  │
└───────────────┘
```

## Kern-Services im Detail

### 1. API Gateway (Port: 3001)
**Zentrale Eintrittsstelle für alle Client-Anfragen**

- **Authentifizierung**: JWT-basierte Authentifizierung
- **Rate Limiting**: 100 Requests pro Minute pro User
- **Request Routing**: Intelligentes Routing zu Backend-Services
- **Audit Logging**: Vollständige Protokollierung aller Aktionen
- **CORS-Management**: Sichere Cross-Origin-Kommunikation

**Proxy-Routen:**
- `/api/auth/*` → Auth-Service
- `/api/v1/characters/*` → Character-Service
- `/api/v1/conversations/*` → Chat-Service
- `/api/v1/artifacts/*` → Character-Service
- `/api/admin/*` → Admin-Service
- `/api/analytics/*` → Customer Intelligence Service
- `/db/*` → Admin-Service (für Python-Services)

### 2. Chat Service (Port: 3006)
**Echtzeit-Chat-Funktionalität**

- **WebSocket/SSE**: Echtzeit-Kommunikation
- **Chat-Historie**: Vollständige Conversation-Historie in PostgreSQL
- **Multi-LLM-Switch**: Dynamischer Wechsel zwischen LLM-Providern
- **RAG-Integration**: Automatische Kontext-Anreicherung aus Knowledge Base
- **Streaming**: Server-Sent Events für Token-für-Token-Antworten

**Features:**
- Streaming-Support für flüssige Antworten
- Citation-Management für nachvollziehbare Quellen
- Multi-Tenant-Isolation
- Audio-Streaming (in Entwicklung)

### 3. RAG Service (Port: 3007)
**Retrieval-Augmented Generation**

- **Vector Store**: pgvector für semantische Suche
- **Document Retrieval**: Intelligente Dokumenten-Suche
- **Context-Aufbereitung**: Optimierte Kontext-Erstellung
- **Citations**: Automatische Quellenangaben
- **Two-Stage Retrieval**: Grobe + feine Suche für bessere Ergebnisse

**Technologie:**
- PostgreSQL mit pgvector Extension
- Embedding-Modelle: text-embedding-3-small (OpenAI)
- Optional: OpenSearch für größere Datenmengen

### 4. Agent Service (Port: 3008)
**Intelligente Agent-Orchestrierung**

- **LangGraph**: State-Machine-basierte Agent-Orchestrierung
- **Tool-Ausführung**: Integration mit Tool-Service
- **Human-in-the-Loop**: Approval-Workflows für kritische Aktionen
- **Rollenbasierte Agenten**: Vordefinierte Agent-Typen (IT-Support, Sales, etc.)

**Agent-Typen:**
- IT-Support Agent
- Sales Agent
- Marketing Agent
- Meeting Agent
- Legal Agent

### 5. LLM Gateway (Port: 3009)
**Multi-Provider LLM-Management**

- **Multi-Provider**: OpenAI, Anthropic, Azure, Google, Ollama
- **Automatisches Fallback**: Bei Ausfällen automatischer Wechsel
- **Cost-Tracking**: Vollständige Kostenverfolgung in DB
- **Provider Health Monitoring**: Kontinuierliche Überwachung

**Unterstützte Provider:**
- OpenAI (GPT-4, GPT-3.5, GPT-4o)
- Anthropic (Claude 3 Opus, Sonnet)
- Azure OpenAI
- Google (Gemini Pro)
- Ollama (lokale Modelle)

### 6. Tool Service (Port: 3005)
**Tool-Registry und -Ausführung**

- **Tool-Registry**: Zentrale Registrierung aller verfügbaren Tools
- **Adapter-Pattern**: Einheitliche Schnittstelle für verschiedene Tools
- **Sandboxing**: Sichere Tool-Ausführung
- **Health Checks**: Kontinuierliche Überwachung der Tool-Verfügbarkeit

**Verfügbare Tools:**
- HTTP Tool (REST-API-Calls)
- Email Tool (SMTP-Versand)
- Jira Tool (Ticket-Management)
- Slack Tool (Nachrichten, Channels)
- Retrieval Tool (RAG-Integration)
- Calendar Tool (Event-Management)

### 7. Character Service (Port: 3013)
**Character-Management**

- **Character-Management**: CRUD-Operationen für Characters
- **Artifact-Management**: URLs, Dokumente, Medien
- **Knowledge Base-Verknüpfung**: Verknüpfung mit Knowledge Spaces
- **Voice-Integration**: Voice-ID und Voice-Model-Konfiguration

### 8. Admin Service (Port: 3008)
**Administration und Verwaltung**

- **RBAC**: Rollenbasierte Zugriffskontrolle
- **Knowledge Spaces Management**: Verwaltung von Wissensräumen
- **Audit-Log-Viewer**: Vollständige Audit-Trails
- **Metrics & Analytics**: Nutzungsmetriken und KPIs
- **DB-API**: HTTP-API für Python-Services (Ingestion)

### 9. Ingestion Service (Port: 8001)
**Dokument-Verarbeitung**

- **File Watching**: Automatische Erkennung neuer Dateien
- **Queue Management**: Redis-basierte Job-Queue
- **Document Processing**: Chunking, Embeddings, PII-Redaction
- **DB-Integration**: HTTP-API für Datenbank-Operationen

**Technologie:**
- FastAPI (Python)
- Redis Queue
- Asynchrone Verarbeitung

### 10. Customer Intelligence Service (Port: 3014)
**Automatisierte Kundenanalyse und Agent-Generierung**

- **Kundenanalyse**: Automatische Analyse von Kundendaten
- **Zielgruppen-Identifikation**: LLM-basierte Zielgruppen-Erkennung
- **Persona-Generierung**: Automatische Persona-Erstellung
- **Agent-Generierung**: Automatische Agent-Erstellung für Personas
- **Content-Anreicherung**: Zielgruppen-spezifische Content-Anreicherung
- **Mehrsprachige Unterstützung**: Automatische Sprach-Erkennung

### 11. Crawler Service (Port: 3015)
**Website-Daten-Sammlung**

- **Website-Crawling**: Automatisches Crawlen von Websites
- **HTML-Parsing**: Intelligente Extraktion von Text, Metadaten, Links
- **Webhook-Integration**: Automatische Weiterleitung an Customer Intelligence
- **Multi-Domain-Support**: Unterstützung für mehrere Domains
- **Configurable Depth**: Einstellbare Crawl-Tiefe

### 12. Voice Service (Port: 3016)
**Voice-Integration für schnelle Gespräche**

- **Text-to-Speech**: Multi-Provider TTS (OpenAI, ElevenLabs, Azure)
- **Speech-to-Text**: OpenAI Whisper für präzise Transkription
- **Streaming**: Echtzeit-Streaming für schnelle Gespräche
- **Low-Latency-Mode**: Optimiert für Echtzeit-Kommunikation
- **Multi-Language**: Unterstützung für alle Sprachen

### 13. Avatar Service (Port: 3009)
**Avatar-Rendering mit Babylon.js**

- **Babylon.js Integration**: 3D-Avatar-Rendering
- **TTS-Synchronisation**: Lippen-Synchronisation mit Audio
- **WebSocket-Streaming**: Echtzeit-Avatar-Streaming
- **Scene-Export**: Frontend-Integration für Babylon.js
**Automatisierte Kundenanalyse und Agent-Generierung**

- **Kundenanalyse**: Automatische Analyse von Kundendaten
- **Zielgruppen-Identifikation**: LLM-basierte Zielgruppen-Erkennung
- **Persona-Generierung**: Automatische Persona-Erstellung
- **Agent-Generierung**: Automatische Agent-Erstellung für Personas
- **Content-Anreicherung**: Zielgruppen-spezifische Content-Anreicherung
- **Mehrsprachige Unterstützung**: Automatische Sprach-Erkennung

**Workflow:**
1. Datenaggregation (Crawler, Documents, Conversations)
2. Zielgruppen-Identifikation (LLM-basiert)
3. Persona-Generierung (automatisch für jede Zielgruppe)
4. Agent-Generierung (automatisch für jede Persona)
5. Content-Anreicherung (zielgruppen-spezifisch)

## Datenbank-Schema

### Kern-Tabellen

**Multi-Tenant:**
- `Tenant` - Mandanten
- `Area` - Bereiche
- `Team` - Teams

**RBAC:**
- `User` - Benutzer
- `Role` - Rollen
- `UserRole` - Benutzer-Rollen-Zuordnung
- `Permission` - Berechtigungen

**Knowledge Spaces & RAG:**
- `KnowledgeSpace` - Wissensräume
- `Document` - Dokumente
- `Chunk` - Text-Chunks mit Embeddings

**Agents:**
- `Agent` - Agent-Definitionen
- `AgentRun` - Agent-Ausführungen
- `ToolCall` - Tool-Aufrufe

**Characters:**
- `Character` - Character-Definitionen
- `Artifact` - Character-Artefakte
- `Conversation` - Conversations
- `ConversationMessage` - Nachrichten

**Customer Intelligence:**
- `CustomerAnalysis` - Analysen
- `TargetGroup` - Zielgruppen
- `Persona` - Personas
- `ContentEnrichment` - Angereicherter Content
- `AgentGeneration` - Agent-Generierungen

**Weitere:**
- `LLMUsage` - LLM-Nutzung und Kosten
- `AuditLog` - Audit-Logs
- `Feedback` - Benutzer-Feedback

## Kommunikations-Patterns

### Synchron (HTTP)
- Frontend ↔ API Gateway
- Services ↔ Services (REST)
- Python ↔ Node (HTTP-API)

### Asynchron (Queue)
- Ingestion → Document Processing (Redis Queue)
- Agent Runs → Background Processing (BullMQ)

### Streaming (SSE/WebSocket)
- Chat Messages → Real-time Updates
- Agent Runs → Progress Updates

## Sicherheit & Compliance

- **JWT-basierte Authentifizierung**: Sichere Token-basierte Auth
- **RBAC**: Rollenbasierte Zugriffskontrolle
- **Audit Logging**: Vollständige Protokollierung aller Aktionen
- **PII-Redaction**: Automatische Entfernung personenbezogener Daten
- **DSGVO-konform**: EU-Hosting, Datenhoheit
- **Multi-Tenant-Isolation**: Vollständige Datenisolation zwischen Mandanten

## Performance-Optimierungen

- **Graph-Caching**: Agent-Graphs werden gecacht
- **Vector Store Indexing**: Optimierte pgvector-Indizes
- **Redis Caching**: Häufig abgerufene Daten werden gecacht
- **Lazy Loading**: Frontend lädt Daten bedarfsgerecht
- **Streaming**: SSE/WebSocket für Echtzeit-Updates
- **Connection Pooling**: Optimierte Datenbank-Verbindungen

## Deployment

### Infrastruktur
- **Railway**: Haupt-Deployment-Plattform
- **Vercel**: Frontend-Deployment
- **Docker Compose**: Lokale Entwicklung

### Umgebungsvariablen
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

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AZURE_OPENAI_API_KEY=...
GOOGLE_API_KEY=...

# Vector Store
VECTOR_STORE_TYPE=pgvector
OPENSEARCH_URL=http://localhost:9200
```

## Use Cases

### 1. Kommune: Bürger-Service
- **Zielgruppen**: Junge Familien, Senioren, Migranten
- **Personas**: Automatisch generiert basierend auf Daten
- **Agents**: Sprachspezifische Agents (DE, TR, EN)
- **Content**: Verwaltungsdokumente, FAQs, Services

### 2. Unternehmen: IT-Support
- **Zielgruppen**: Entwickler, End-User, Administratoren
- **Personas**: Technisch versiert vs. Laien
- **Agents**: IT-Support Agent mit Tool-Integration
- **Content**: Dokumentation, Tickets, Knowledge Base

### 3. E-Commerce: Kundenberatung
- **Zielgruppen**: Käufer, Interessenten, Bestandskunden
- **Personas**: Preisbewusst, Qualitätsorientiert, Schnellentscheider
- **Agents**: Sales Agent mit Produktwissen
- **Content**: Produktkataloge, Reviews, FAQs

## Roadmap

### Kurzfristig (Q1 2025)
- ✅ Customer Intelligence Service
- ✅ Automatische Agent-Generierung
- ✅ Crawler-Service
- ✅ Avatar-Integration (Babylon.js)
- ✅ Voice-Integration (schnelle Gespräche)

### Mittelfristig (Q2 2025)
- Phone Bot Integration
- WhatsApp Export
- Erweiterte ML-Modelle für Zielgruppen-Analyse
- Performance-Optimierungen

### Langfristig (Q3-Q4 2025)
- Multi-Modal AI (Bild, Video)
- Erweiterte Analytics
- Predictive Analytics
- Automatische A/B-Testing

## Technologie-Stack

### Backend
- **NestJS**: Haupt-Framework für Microservices
- **FastAPI**: Python-Services (Ingestion)
- **PostgreSQL**: Hauptdatenbank
- **pgvector**: Vector Store
- **Redis**: Queue & Caching
- **LangGraph**: Agent-Orchestrierung

### Frontend
- **Next.js**: React-Framework mit SSR
- **TypeScript**: Type-Safety
- **Tailwind CSS**: Styling
- **i18n**: Mehrsprachigkeit (de/en)

### AI/ML
- **OpenAI**: GPT-4, GPT-3.5, Embeddings
- **Anthropic**: Claude 3
- **Azure OpenAI**: Enterprise-Option
- **Google**: Gemini Pro
- **Ollama**: Lokale Modelle

## Kontakt & Support

Für Fragen und Support kontaktieren Sie uns unter:
- Email: support@wattweiser.de
- Dokumentation: https://docs.wattweiser.de
- GitHub: https://github.com/WattWelten/wattos_plattform

