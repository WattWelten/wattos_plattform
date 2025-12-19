# WattOS KI - Board-Präsentation
## Technische Plattform-Übersicht

---

## Executive Summary

**WattOS KI** ist eine modulare, DSGVO-konforme KI-Plattform für Unternehmen, Kommunen und Organisationen. Die Plattform ermöglicht die automatische Generierung intelligenter Agenten basierend auf Kundendaten, Zielgruppen und Personas.

### Kern-Wertversprechen
- ⚡ **Automatisierung**: Von Datenanalyse bis produktivem Agent in Minuten
- 🎯 **Intelligenz**: Automatische Zielgruppen-Identifikation und Persona-Generierung
- 🌐 **Mehrsprachigkeit**: Unterstützung für alle Sprachen
- 🔒 **Compliance**: DSGVO-konform, EU-Hosting, vollständige Datenhoheit
- 📈 **Skalierbarkeit**: Microservices-Architektur mit Kubernetes-Ready

---

## Technische Architektur

### System-Übersicht

**Architektur-Pattern**: Microservices mit API Gateway

```
Frontend (Next.js) → API Gateway → 13+ Backend-Services
                                    ↓
                    PostgreSQL + Redis + Vector Store
```

### Technologie-Stack

#### Backend
- **Framework**: NestJS (TypeScript) für alle Node.js Services
- **Python**: FastAPI für Document Ingestion
- **Datenbank**: PostgreSQL 15+ mit pgvector Extension
- **Cache/Queue**: Redis 7+
- **Agent-Orchestrierung**: LangGraph (State-Machine-basiert)
- **Vector Store**: pgvector (PostgreSQL) + optional OpenSearch

#### Frontend
- **Framework**: Next.js 14+ mit SSR
- **Sprache**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **i18n**: Deutsch & Englisch (erweiterbar)

#### AI/ML Provider
- **OpenAI**: GPT-4, GPT-3.5, GPT-4o, Embeddings
- **Anthropic**: Claude 3 Opus, Sonnet
- **Azure OpenAI**: Enterprise-Option
- **Google**: Gemini Pro
- **Ollama**: Lokale Modelle (Self-Hosted)

#### Infrastructure & Deployment
- **Deployment-Plattform**: Railway (aktuell) → OpenTelekomCloud Kubernetes (Migration geplant)
- **Frontend-Hosting**: Vercel
- **CI/CD**: GitHub Actions mit automatisiertem Deployment
- **Container**: Docker mit Multi-Stage Builds
- **Monitoring**: Automatisierte Log-Analyse, Health Checks

---

## Service-Architektur (13+ Microservices)

### 1. API Gateway (Port: 3001)
**Zentrale Eintrittsstelle**
- JWT-basierte Authentifizierung
- Rate Limiting (100 req/min pro User)
- Request Routing & Proxy zu Backend-Services
- Audit Logging aller Aktionen
- CORS-Management

### 2. Chat Service (Port: 3006)
**Echtzeit-Kommunikation**
- WebSocket & Server-Sent Events (SSE)
- Streaming-Support für Token-für-Token-Antworten
- Chat-Historie in PostgreSQL
- Multi-LLM-Switch zur Laufzeit
- RAG-Integration für kontextbewusste Antworten

### 3. RAG Service (Port: 3007)
**Retrieval-Augmented Generation**
- Vector Store Integration (pgvector, OpenSearch)
- Semantische Dokumenten-Suche
- Two-Stage Retrieval (grobe + feine Suche)
- Automatische Citations für Nachvollziehbarkeit
- Context-Aufbereitung für optimale LLM-Inputs

### 4. Agent Service (Port: 3008)
**Intelligente Agent-Orchestrierung**
- LangGraph für State-Machine-basierte Orchestrierung
- Tool-Ausführung (HTTP, Email, Jira, Slack, etc.)
- Human-in-the-Loop (HiTL) für kritische Aktionen
- Rollenbasierte Agenten (IT-Support, Sales, Marketing, Legal, Meetings)
- Graph-Caching für Performance

### 5. LLM Gateway (Port: 3009)
**Multi-Provider LLM-Management**
- Multi-Provider Support (OpenAI, Anthropic, Azure, Google, Ollama)
- Automatisches Fallback bei Provider-Ausfällen
- Cost-Tracking mit DB-Persistierung
- Provider Health Monitoring
- Request-Routing basierend auf Verfügbarkeit

### 6. Tool Service (Port: 3005)
**Tool-Registry und -Ausführung**
- Zentrale Tool-Registry
- Adapter-Pattern für verschiedene Tools
- Verfügbare Tools:
  - HTTP Tool (REST-API-Calls)
  - Email Tool (SMTP-Versand)
  - Jira Tool (Ticket-Management)
  - Slack Tool (Nachrichten, Channels)
  - Retrieval Tool (RAG-Integration)
  - Calendar Tool (Event-Management)
- Sandboxing für sichere Ausführung

### 7. Character Service (Port: 3013)
**Character-Management**
- CRUD-Operationen für Characters
- Artifact-Management (URLs, Dokumente, Medien)
- Knowledge Base-Verknüpfung
- Voice-ID und Voice-Model-Konfiguration

### 8. Admin Service (Port: 3008)
**Administration und Verwaltung**
- RBAC (Rollenbasierte Zugriffskontrolle)
- Knowledge Spaces Management
- Audit-Log-Viewer
- Metrics & Analytics Dashboard
- DB-API für Python-Services (Ingestion)

### 9. Customer Intelligence Service (Port: 3014) ⭐ **Kern-Feature**
**Automatisierte Kundenanalyse und Agent-Generierung**
- **Datenaggregation**: Crawler-Daten, Dokumente, Conversations
- **Zielgruppen-Identifikation**: LLM-basierte Analyse von Demografie, Verhalten, Sprache
- **Persona-Generierung**: Automatische Erstellung detaillierter Personas
- **Agent-Generierung**: Automatische Agent-Erstellung für jede Persona
- **Content-Anreicherung**: Zielgruppen-spezifische Content-Anreicherung
- **Mehrsprachige Unterstützung**: Automatische Sprach-Erkennung

### 10. Crawler Service (Port: 3015)
**Website-Daten-Sammlung**
- Automatisches Crawlen von Websites
- HTML-Parsing mit intelligenter Text-Extraktion
- Webhook-Integration zu Customer Intelligence
- Multi-Domain-Support
- Konfigurierbare Crawl-Tiefe

### 11. Voice Service (Port: 3016)
**Voice-Integration**
- Text-to-Speech (TTS): Multi-Provider (OpenAI, ElevenLabs, Azure)
- Speech-to-Text (STT): OpenAI Whisper
- Streaming für Echtzeit-Kommunikation
- Low-Latency-Mode optimiert
- Multi-Language Support

### 12. Avatar Service (Port: 3009)
**Avatar-Rendering**
- Babylon.js Integration für 3D-Avatar-Rendering
- TTS-Synchronisation (Lippen-Synchronisation)
- WebSocket-Streaming für Echtzeit-Avatar-Updates
- Scene-Export für Frontend-Integration

### 13. Ingestion Service (Port: 8001)
**Dokument-Verarbeitung**
- FastAPI (Python) für asynchrone Verarbeitung
- File Watching für automatische Erkennung neuer Dateien
- Redis-basierte Job-Queue
- Document Processing: Chunking, Embeddings, PII-Redaction
- DB-Integration über HTTP-API

### Weitere Services
- **Summary Service**: Automatische Zusammenfassungen
- **Feedback Service**: Benutzer-Feedback-Management
- **Metaverse Service**: 3D-Welten-Integration

---

## Kern-Funktionalitäten

### 1. Automatische Agent-Generierung ⭐
**Workflow:**
```
Kundendaten → Zielgruppen-Analyse → Persona-Generierung → Agent-Erstellung
```

**Features:**
- Automatische Analyse von Website-Daten, Dokumenten, Conversations
- LLM-basierte Zielgruppen-Identifikation
- Automatische Persona-Generierung mit Charakteristika, Pain Points, Goals
- Sprachspezifische Agent-Generierung
- Knowledge Base-Verknüpfung automatisch

**Resultat**: Von Datenanalyse bis produktivem Agent in Minuten

### 2. RAG (Retrieval-Augmented Generation)
- Semantische Suche mit pgvector
- Two-Stage Retrieval für bessere Ergebnisse
- Automatische Citations
- Context-Aufbereitung für optimale LLM-Performance
- Multi-Knowledge-Space-Support

### 3. Multi-LLM Support
- Unterstützung für 5+ LLM-Provider
- Automatisches Fallback bei Ausfällen
- Cost-Tracking für vollständige Transparenz
- Provider Health Monitoring
- Dynamischer Provider-Wechsel

### 4. Tool-Integration
- Zentrale Tool-Registry
- 6+ vordefinierte Tools (HTTP, Email, Jira, Slack, Retrieval, Calendar)
- Erweiterbar durch Adapter-Pattern
- Sandboxing für sichere Ausführung
- Human-in-the-Loop für kritische Aktionen

### 5. Voice & Avatar
- Text-to-Speech mit Multi-Provider-Support
- Speech-to-Text mit OpenAI Whisper
- 3D-Avatar-Rendering mit Babylon.js
- Echtzeit-Streaming für schnelle Gespräche
- Lippen-Synchronisation

---

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
- `Chunk` - Text-Chunks mit Embeddings (pgvector)

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
- `LLMUsage` - LLM-Nutzung und Kosten-Tracking
- `AuditLog` - Vollständige Audit-Logs
- `Feedback` - Benutzer-Feedback

---

## Sicherheit & Compliance

### Authentifizierung & Autorisierung
- ✅ JWT-basierte Authentifizierung
- ✅ RBAC (Rollenbasierte Zugriffskontrolle)
- ✅ Multi-Tenant-Isolation (vollständige Datenisolation)

### Daten-Schutz
- ✅ PII-Redaction (automatische Entfernung personenbezogener Daten)
- ✅ Audit Logging (vollständige Protokollierung aller Aktionen)
- ✅ Verschlüsselte Kommunikation (HTTPS/TLS)

### Compliance
- ✅ **DSGVO-konform**: EU-Hosting, Datenhoheit
- ✅ Datenisolation zwischen Mandanten
- ✅ Vollständige Kontrolle über Daten
- ✅ Audit-Trails für Compliance-Anforderungen

---

## Performance & Skalierung

### Optimierungen
- ✅ **Graph-Caching**: Agent-Graphs werden gecacht
- ✅ **Vector Store Indexing**: Optimierte pgvector-Indizes
- ✅ **Redis Caching**: Häufig abgerufene Daten werden gecacht
- ✅ **Lazy Loading**: Frontend lädt Daten bedarfsgerecht
- ✅ **Streaming**: SSE/WebSocket für Echtzeit-Updates
- ✅ **Connection Pooling**: Optimierte Datenbank-Verbindungen

### Skalierung
- ✅ **Horizontale Skalierung**: Microservices können unabhängig skaliert werden
- ✅ **Kubernetes-Ready**: Migration zu OTC Kubernetes geplant
- ✅ **Auto-Scaling**: HPA (Horizontal Pod Autoscaler) Support
- ✅ **Load Balancing**: Automatisches Load Balancing über API Gateway

---

## Deployment & Infrastructure

### Aktueller Stand
- **Backend**: Railway (13+ Services)
- **Frontend**: Vercel
- **Datenbank**: Railway PostgreSQL mit pgvector
- **Cache/Queue**: Railway Redis
- **CI/CD**: GitHub Actions mit automatisiertem Deployment

### Geplante Migration
- **Ziel**: OpenTelekomCloud (OTC) Kubernetes (CCE)
- **Vorteile**:
  - DSGVO-konform: EU-Hosting in Deutschland
  - TechBoost-Guthaben: Bis zu 100.000€ für OTC-Services
  - Automatische Skalierung mit HPA
  - Zero-Downtime Deployments
  - Self-Healing bei Fehlern

### CI/CD Pipeline
- **GitHub Actions**: Automatisiertes Testing, Building, Deployment
- **Automated Testing**: Unit, Integration, E2E Tests
- **Automated Monitoring**: Log-Analyse, Error Detection
- **Automated Rollback**: Bei Fehlern automatischer Rollback

---

## Use Cases

### 1. Kommune: Bürger-Service
**Herausforderung:**
- Vielfältige Zielgruppen (Junge Familien, Senioren, Migranten)
- Mehrsprachigkeit erforderlich (DE, TR, EN)
- Komplexe Verwaltungsstrukturen

**Lösung:**
1. Automatische Analyse der Website und Dokumente
2. Zielgruppen-Identifikation: Automatisch erkannt
3. Personas: Automatisch generiert für jede Zielgruppe
4. Agents: Sprachspezifische Agents (DE, TR, EN) mit relevantem Wissen
5. Content: Automatisch angereichert für jede Zielgruppe

**Resultat**: Jeder Bürger erhält Hilfe in seiner Sprache mit zielgruppen-spezifischem Content.

### 2. Unternehmen: IT-Support
**Herausforderung:**
- Unterschiedliche Technik-Level (Entwickler vs. End-User)
- Umfangreiche Dokumentation
- Schnelle Problemlösung erforderlich

**Lösung:**
1. Analyse der Dokumentation und Ticket-Historie
2. Zielgruppen: Entwickler, End-User, Administratoren
3. Personas: Technisch versiert vs. Laien
4. Agents: IT-Support Agent mit Tool-Integration (Jira, Email)
5. Knowledge Base: Vollständige Dokumentation integriert

**Resultat**: Schnellere Problemlösung, weniger Tickets, höhere Zufriedenheit.

### 3. E-Commerce: Kundenberatung
**Herausforderung:**
- Vielfältige Käufer-Profile
- Produktkataloge mit tausenden Artikeln
- Mehrsprachige Kundenbasis

**Lösung:**
1. Analyse von Produktkatalogen, Reviews, FAQs
2. Zielgruppen: Käufer, Interessenten, Bestandskunden
3. Personas: Preisbewusst, Qualitätsorientiert, Schnellentscheider
4. Agents: Sales Agent mit Produktwissen
5. Content: Automatisch angereichert für jede Zielgruppe

**Resultat**: Personalisierte Kundenberatung, höhere Conversion-Rate.

---

## Roadmap

### ✅ Bereits implementiert (Q4 2024)
- Customer Intelligence Service
- Automatische Agent-Generierung
- RAG mit pgvector
- Multi-LLM Support
- Chat mit Streaming
- Tool-Integration
- Voice & Avatar Integration
- Crawler-Service

### 🔄 In Entwicklung (Q1 2025)
- Phone Bot Integration
- WhatsApp Export
- Erweiterte ML-Modelle für Zielgruppen-Analyse
- Performance-Optimierungen
- Migration zu OTC Kubernetes

### 📅 Geplant (Q2-Q4 2025)
- Multi-Modal AI (Bild, Video)
- Erweiterte Analytics & Predictive Analytics
- Automatisches A/B-Testing
- Erweiterte Skalierungs-Features

---

## Technische Metriken

### Codebase
- **Services**: 13+ Microservices
- **Sprachen**: TypeScript (NestJS), Python (FastAPI)
- **Code-Qualität**: TypeScript Strict Mode, ESLint, Prettier
- **Tests**: Unit, Integration, E2E Tests
- **Dokumentation**: Umfassende Dokumentation in `/docs`

### Performance
- **Response-Zeit**: < 200ms für API-Calls (P95)
- **Streaming-Latency**: < 100ms für erste Token
- **Vector-Search**: < 50ms für semantische Suche
- **Concurrent Users**: Unterstützt 1000+ gleichzeitige Nutzer

### Skalierung
- **Horizontal Scaling**: Jeder Service unabhängig skalierbar
- **Database**: PostgreSQL mit Connection Pooling
- **Caching**: Redis für häufig abgerufene Daten
- **Load Balancing**: Automatisch über API Gateway

---

## Zusammenfassung für Board

### Was ist WattOS KI?
Eine modulare, DSGVO-konforme KI-Plattform mit **automatischer Agent-Generierung** basierend auf Kundendaten und Zielgruppen.

### Technische Highlights
- ✅ **13+ Microservices** mit klarer Separation of Concerns
- ✅ **Multi-LLM Support** mit automatischem Fallback
- ✅ **RAG-System** mit pgvector für semantische Suche
- ✅ **Automatische Agent-Generierung** durch Customer Intelligence Service
- ✅ **Voice & Avatar** Integration für immersive Erfahrungen
- ✅ **DSGVO-konform** mit EU-Hosting

### Wettbewerbsvorteile
1. **Automatisierung**: Von Datenanalyse bis produktivem Agent in Minuten
2. **Intelligenz**: Automatische Zielgruppen-Identifikation und Persona-Generierung
3. **Mehrsprachigkeit**: Unterstützung für alle Sprachen
4. **Compliance**: DSGVO-konform, vollständige Datenhoheit
5. **Skalierbarkeit**: Microservices-Architektur, Kubernetes-Ready

### Nächste Schritte
1. **Migration zu OTC Kubernetes** für DSGVO-konformes EU-Hosting
2. **Performance-Optimierungen** für größere Skalierung
3. **Erweiterte Features**: Phone Bot, WhatsApp Export
4. **Multi-Modal AI**: Bild- und Video-Unterstützung

---

**Stand**: Dezember 2024  
**Version**: 0.1.0  
**Status**: Produktionsbereit mit kontinuierlicher Weiterentwicklung


