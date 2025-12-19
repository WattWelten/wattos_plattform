# WattOS V2 Core Platform

## Übersicht

Die WattOS V2 Core Platform ist die marktagnostische Basis der Plattform. Sie enthält alle Kern-Komponenten, die unabhängig von Markt, Land oder Regulierung funktionieren.

## Architektur

### Core Packages

```
packages/core/
  ├── events/          # Event-Bus System
  ├── orchestrator/    # Multi-Agenten-Orchestrator
  ├── multimodal/      # Multimodal Runtime
  ├── knowledge/       # Knowledge & Action Layer
  └── observability/   # Observability & Analytics
```

## Komponenten

### 1. Event-Bus System

**Location**: `packages/core/src/events/`

**Komponenten**:
- `bus.service.ts` - Redis-basierter Event-Bus
- `types.ts` - Type-safe Event-Typen mit Zod-Validierung
- `decorators.ts` - Event-Handler Decorators
- `middleware.ts` - Event Middleware für HTTP-Requests
- `events.module.ts` - NestJS Module

**Features**:
- Redis Pub/Sub für Event-Kommunikation
- Type-safe Events mit Zod-Validierung
- Event-Handler Decorators
- HTTP-Request-Event-Capture (optional)

**Event-Domains**:
- `perception.*` - Audio/Video Input Events
- `intent.*` - Intent-Erkennung Events
- `tool.*` - Tool-Ausführung Events
- `knowledge.*` - RAG/Knowledge Events
- `avatar.*` - Avatar-Rendering Events
- `compliance.*` - Compliance/Audit Events
- `channel.*` - Channel-Kommunikation Events

### 2. Multi-Agenten-Orchestrator

**Location**: `packages/core/src/orchestrator/`

**Komponenten**:
- `runtime.service.ts` - Agent Runtime & Lifecycle
- `router.service.ts` - Event-Routing zu Agenten
- `state.service.ts` - Session-State-Management
- `orchestrator.module.ts` - NestJS Module

**Features**:
- Agent-Registrierung & Lifecycle
- Event-basiertes Routing
- Session-State-Management
- Cross-Agent-Kommunikation

### 3. Multimodal Runtime

**Location**: `packages/core/src/multimodal/`

**Komponenten**:
- `text/streaming.service.ts` - Text-Streaming
- `voice/asr.service.ts` - Speech-to-Text (Streaming, Barge-in)
- `voice/tts.service.ts` - Text-to-Speech (Streaming, Prosody)
- `multimodal.module.ts` - NestJS Module

**Features**:
- Text-Streaming für Echtzeit-Kommunikation
- Streaming ASR mit Barge-in Support
- Streaming TTS mit Prosody-Anpassung
- Event-basierte Integration

### 4. Knowledge & Action Layer

**Location**: `packages/core/src/knowledge/`

**Komponenten**:
- `rag/rag.service.ts` - Provider-agnostischer RAG-Service
- `tools/registry.service.ts` - Tool-Registry
- `tools/execution.service.ts` - Tool-Ausführung
- `workflows/workflow.service.ts` - Workflow-Engine
- `knowledge.module.ts` - NestJS Module

**Features**:
- Provider-agnostischer RAG (WattWeiser, F13, etc.)
- Zentrale Tool-Registry
- Tool-Ausführung mit Validierung
- Workflow-Engine mit Genehmigung

### 5. Observability & Analytics

**Location**: `packages/core/src/observability/`

**Komponenten**:
- `trace.service.ts` - Event-Traces für Replay
- `metrics.service.ts` - KPIs & Analytics
- `observability.module.ts` - NestJS Module

**Features**:
- Event-Traces pro Konversation
- Replay-Fähigkeit für Audit
- KPIs (Completion, Deflection, Fallback)
- Cross-Session Analytics

## Verwendung

### Installation

```bash
cd packages/core
pnpm install
```

### Integration in Service

```typescript
import { EventsModule, OrchestratorModule, KnowledgeModule } from '@wattweiser/core';

@Module({
  imports: [
    EventsModule,
    OrchestratorModule,
    KnowledgeModule,
  ],
})
export class MyServiceModule {}
```

### Event emittieren

```typescript
import { EventBusService } from '@wattweiser/core';
import { EventDomain, IntentEventSchema } from '@wattweiser/core';

constructor(private readonly eventBus: EventBusService) {}

async handleMessage(message: string) {
  const event = IntentEventSchema.parse({
    id: uuid(),
    type: 'intent.message.processed',
    domain: EventDomain.INTENT,
    action: 'message.processed',
    timestamp: Date.now(),
    sessionId: '...',
    tenantId: '...',
    payload: { message },
  });

  await this.eventBus.emit(event);
}
```

### Event-Handler registrieren

```typescript
import { EventBusService } from '@wattweiser/core';
import { EventHandler } from '@wattweiser/core';

constructor(private readonly eventBus: EventBusService) {
  this.eventBus.subscribe('intent.message.processed', async (event) => {
    // Handle event
  });
}
```

## Dependencies

- `@nestjs/common` - NestJS Framework
- `@nestjs/config` - Configuration
- `ioredis` - Redis Client
- `zod` - Schema Validation
- `uuid` - UUID Generation

## Code-Qualität

- TypeScript Strict Mode
- Zod-Validierung für alle Events
- Vollständige Type-Safety
- Keine Linter-Fehler

## Weiterführende Dokumentation

- [Projektplan](../.cursor/plans/README.md)
- [Event-Typen](../packages/core/src/events/types.ts)
- [Orchestrator-Dokumentation](../packages/core/src/orchestrator/)

