# Architektur-Dokumentation

## Übersicht

WattOS KI ist eine modulare, Microservices-basierte KI-Plattform, die auf folgenden Prinzipien basiert:

- **Modularität**: Jeder Service ist unabhängig deploybar
- **DSGVO-Konformität**: Alle Daten bleiben in der EU
- **Skalierbarkeit**: Horizontale Skalierung durch Microservices
- **Wartbarkeit**: Klare Trennung von Concerns

## System-Architektur

```
┌─────────────────┐
│   Next.js Web   │
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │
│  (Auth, Proxy)  │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌────────┐ ┌────────┐
│  Chat  │ │ RAG  │ │ Agent  │ │ Admin  │
│Service │ │Service│ │Service │ │Service │
└────────┘ └──────┘ └────────┘ └────────┘
```

## Services

### API Gateway
- **Port**: 3001
- **Technologie**: NestJS
- **Funktionen**:
  - Authentication & Authorization
  - Rate Limiting
  - Request Routing
  - Audit Logging

### Chat Service
- **Port**: 3006
- **Technologie**: NestJS
- **Funktionen**:
  - WebSocket/SSE für Echtzeit-Chat
  - Chat-Historie
  - Multi-LLM-Switch
  - RAG-Integration

### RAG Service
- **Port**: 3007
- **Technologie**: NestJS
- **Funktionen**:
  - Vector Store Integration (pgvector, OpenSearch)
  - Document Retrieval
  - Context-Aufbereitung
  - Citations

### Agent Service
- **Port**: 3008
- **Technologie**: NestJS + LangGraph
- **Funktionen**:
  - Agent-Orchestrierung
  - Tool-Ausführung
  - Human-in-the-Loop (HiTL)
  - Rollenbasierte Agenten

### Ingestion Service
- **Port**: 8001
- **Technologie**: FastAPI
- **Funktionen**:
  - Dokument-Watcher
  - Queue-Management (BullMQ)
  - Status-Tracking
  - Retry-Loops

## Datenbank-Schema

### PostgreSQL (Hauptdatenbank)
- Users & Roles
- Knowledge Spaces
- Documents & Chunks
- Chat History
- Audit Logs
- Feedback

### Redis
- Session Storage
- Job Queues (BullMQ)
- Caching

## Vector Stores

### pgvector
- Primärer Vector Store
- Integriert in PostgreSQL
- Für Produktionsumgebungen

### OpenSearch
- Optionaler Vector Store
- Für größere Skalierung
- Separate Infrastruktur

## Sicherheit

- JWT-basierte Authentication
- Role-Based Access Control (RBAC)
- PII-Redaction
- Audit Logging
- Rate Limiting

## Monitoring & Observability

- Metriken: Prometheus-kompatibel
- Logging: Strukturierte Logs
- Tracing: OpenTelemetry (geplant)
