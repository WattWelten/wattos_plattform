# Plan Changelog

Alle Änderungen am Projektplan werden hier dokumentiert.

## [2024-12-03] - Initial Plan Setup & Core Platform Foundation

- Plan-Struktur erstellt
- Projektplan-Management-System implementiert
- GitHub Actions für automatische Plan-Sicherung
- Pre-Commit Hooks für Plan-Validierung
- Changelog-System eingerichtet
- **Event-Bus System implementiert** (packages/core/src/events/)
- **Multi-Agenten-Orchestrator implementiert** (packages/core/src/orchestrator/)
- **Multimodal Runtime implementiert** (packages/core/src/multimodal/)
- **Knowledge & Action Layer implementiert** (packages/core/src/knowledge/)
- **Observability & Analytics implementiert** (packages/core/src/observability/)
- **Dokumentation erstellt** (docs/WATTOS_V2_CORE_PLATFORM.md)

### Betroffene Dateien
- `.cursor/plans/README.md`
- `.cursor/plans/CHANGELOG.md`
- `.github/workflows/plan-backup.yml`
- `.husky/pre-commit` (erweitert)
- `packages/core/` (neu erstellt)
  - `src/events/` - Event-Bus System
  - `src/orchestrator/` - Multi-Agenten-Orchestrator
  - `src/multimodal/` - Multimodal Runtime (Text, Voice)
  - `src/knowledge/` - Knowledge & Action Layer (RAG, Tools, Workflows)
  - `src/observability/` - Observability & Analytics (Traces, Metrics)
- `docs/WATTOS_V2_CORE_PLATFORM.md` - Core Platform Dokumentation

### Breaking Changes
Keine

### Git Commit
- Commit: `feat(core): implement WattOS V2 Core Platform foundation`
- 29 Dateien geändert, 2417 Zeilen hinzugefügt
- Alle Komponenten folgen Code-Qualitäts-Standards

## [2024-12-03] - Channel-Services Implementation

- **Channel-Interface implementiert** (packages/core/src/channels/)
- **Channel-Router Service** für einheitliche Channel-API
- **Web-Chat Service** (Port 3017) - WebSocket/SSE, Multimodal
- **Phone-Bot Service** (Port 3018) - Twilio Integration, Voice-only
- **WhatsApp-Bot Service** (Port 3019) - Meta WhatsApp Business API, Text/Media
- **Dokumentation erstellt** (docs/CHANNEL_SERVICES.md)

### Betroffene Dateien
- `packages/core/src/channels/` - Channel-Abstraktion
- `apps/services/web-chat-service/` - Web-Chatbot Service
- `apps/services/phone-bot-service/` - Phone-Bot Service
- `apps/services/whatsapp-bot-service/` - WhatsApp-Bot Service
- `docs/CHANNEL_SERVICES.md` - Channel-Services Dokumentation

### Breaking Changes
Keine

## [2024-12-03] - Critical Fixes

- **Event-Bus Wildcard-Subscription fixiert** (Pattern-Subscription mit PSUBSCRIBE)
- **PII-Redaction Service implementiert** (echte PII-Erkennung und -Redaction)
- **Session-ID Fixes** (korrekte Session/Tenant-ID-Propagation)
- **Type-Safety verbessert** (26+ Stellen: any → unknown/konkrete Typen)
- **DB-Integration für Profile** (Prisma-Integration mit Fallback)
- **Event-History Persistierung** (Redis Streams für skalierbare Persistierung)
- **Dokumentation erstellt** (docs/FIXES_APPLIED.md)

### Betroffene Dateien
- `packages/core/src/events/bus.service.ts` - Pattern-Subscription
- `packages/core/src/compliance/pii-redaction.service.ts` - PII-Redaction (neu)
- `packages/core/src/compliance/audit-replay.service.ts` - Redis Streams
- `packages/core/src/profiles/profile.service.ts` - Prisma-Integration
- `packages/core/src/agents/` - Type-Safety Verbesserungen
- `docs/FIXES_APPLIED.md` - Fixes-Dokumentation

### Breaking Changes
Keine (alle Fixes sind backward-compatible)

## [2024-12-03] - Compliance Features

- **Disclosure-System implementiert** (packages/core/src/compliance/disclosure.service.ts)
- **Source Cards Service** für erzwungene Citations (Gov-Mode)
- **Audit & Replay Service** für vollständige Nachvollziehbarkeit
- **Compliance-Modul** für alle Compliance-Features
- **Integration mit Conversation-Agent** für automatische Source Cards
- **Event-basierte Kommunikation** für Compliance-Events
- **Dokumentation erstellt** (docs/COMPLIANCE_FEATURES.md)

### Betroffene Dateien
- `packages/core/src/compliance/` - Alle Compliance-Services
- `packages/core/src/agents/conversation-agent.ts` - Source Cards Integration
- `docs/COMPLIANCE_FEATURES.md` - Compliance Features Dokumentation

### Breaking Changes
Keine

## [2024-12-03] - Avatar V2 (Three.js/R3F)

- **Avatar V2 Service implementiert** (packages/core/src/multimodal/avatar/)
- **Three.js/R3F-basierte Avatar-Generierung**
- **TTS-Integration** für Audio-Generierung
- **Viseme-Generierung** für Lip-Sync
- **Scene-Config-System** für Three.js/R3F
- **Event-basierte Kommunikation** für Avatar-Events
- **Media-Agent Integration** für Avatar-Generierung
- **Dokumentation erstellt** (docs/AVATAR_V2.md)

### Betroffene Dateien
- `packages/core/src/multimodal/avatar/` - Avatar V2 Service
- `packages/core/src/agents/media-agent.ts` - Media-Agent Integration
- `docs/AVATAR_V2.md` - Avatar V2 Dokumentation

### Breaking Changes
Keine (Backward-compatible mit bestehendem Avatar-Service)

## [2024-12-03] - DMS Integration

- **DMS-Client implementiert** (packages/addons/dms/src/client.ts)
- **DMS-Service** für Dokument-Synchronisation und Import
- **DMS-Integration-Service** für Knowledge Layer Integration
- **Event-basierte Kommunikation** für DMS-Sync-Events
- **Incremental Sync** für effiziente Synchronisation
- **Batch-Processing** für große Dokument-Mengen
- **Dokumentation erstellt** (docs/DMS_INTEGRATION.md)

### Betroffene Dateien
- `packages/addons/dms/` - DMS Add-on Package
- `packages/core/src/knowledge/dms/` - DMS-Integration mit Knowledge Layer
- `docs/DMS_INTEGRATION.md` - DMS Integration Dokumentation

### Breaking Changes
Keine

## [2024-12-03] - Agents Implementation

- **Conversation-Agent implementiert** (Intent-Verarbeitung, RAG-Koordination, LLM-Generierung)
- **Retrieval-Agent implementiert** (RAG-Suchen, Context-Aufbau, Citations)
- **Compliance-Agent implementiert** (Policy-Prüfung, PII-Redaction, Audit-Logging)
- **Media-Agent implementiert** (ASR/TTS, Avatar-Animationen, Multimodal-Processing)
- **Agents-Modul** für Agent-Registrierung und Lifecycle
- **Event-basierte Kommunikation** zwischen Agents
- **Dokumentation erstellt** (docs/AGENTS_IMPLEMENTATION.md)

### Betroffene Dateien
- `packages/core/src/agents/` - Alle Agent-Implementierungen
- `packages/core/src/agents/agents.module.ts` - Agents-Modul
- `docs/AGENTS_IMPLEMENTATION.md` - Agents-Dokumentation

### Breaking Changes
Keine

## [2024-12-03] - F13 Integration

- **F13-Client implementiert** (packages/addons/f13/src/client.ts)
- **F13-Provider-Adapter** (LLM, RAG, Parser, Summary)
- **Provider-Factory Service** für Tenant-basiertes Routing
- **F13 nur bei gov-f13 Mode** aktiviert
- **Robustes Error-Handling** mit Retry-Logik
- **Fallback zu WattWeiser** bei F13-Fehlern
- **Dokumentation erstellt** (docs/F13_INTEGRATION.md)

### Betroffene Dateien
- `packages/addons/f13/` - F13 Add-on Package
- `packages/core/src/providers/` - Provider-Factory
- `packages/core/src/knowledge/rag/providers/` - F13 RAG Provider Wrapper
- `docs/F13_INTEGRATION.md` - F13 Integration Dokumentation

### Breaking Changes
Keine

### Nächste Schritte
- Datenbank-Migrationen (Tenant-Profile Schema)
- Feature-Guards/Middleware
- Avatar V2 (Three.js/R3F)
- DMS-Integration

