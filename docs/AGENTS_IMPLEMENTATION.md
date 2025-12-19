# Agents Implementation Dokumentation

## Übersicht

Die WattOS V2 Plattform nutzt eine **Event-basierte Multi-Agenten-Architektur**. Agents kommunizieren ausschließlich über Events, nicht über direkte Abhängigkeiten.

## Agent-Architektur

### Agent-Interface

Alle Agents implementieren das `Agent` Interface:

```typescript
interface Agent {
  readonly name: string;
  readonly version: string;
  handle(event: Event): Promise<Event | null>;
  healthCheck(): Promise<boolean>;
}
```

### Event-basierte Kommunikation

Agents:
- **Empfangen** Events vom Event-Bus
- **Verarbeiten** Events basierend auf Domain und Action
- **Emittieren** Response-Events zurück zum Event-Bus
- **Keine direkten Abhängigkeiten** zwischen Agents

## Implementierte Agents

### 1. Conversation-Agent

**Zuständigkeit**: Intent-Verarbeitung, Antwort-Generierung, RAG/Tool-Koordination

**Verarbeitete Events**:
- `intent.message.processed` - Nachricht verarbeiten
- `intent.intent.detected` - Intent erkannt
- `intent.response.generated` - Antwort generiert

**Funktionen**:
- RAG-Suche für Context-Aufbau
- LLM-Antwort-Generierung
- Citation-Management
- Profile-basierte Konfiguration

**Beispiel-Flow**:
```
Channel → intent.message.processed
  → Conversation-Agent
    → RAG-Suche (Retrieval-Agent)
    → LLM-Generierung
    → intent.response.generated
```

### 2. Retrieval-Agent

**Zuständigkeit**: RAG-Suchen, Context-Aufbau, Citation-Generierung

**Verarbeitete Events**:
- `knowledge.search.executed` - RAG-Suche ausführen
- `knowledge.context.built` - Context aufgebaut
- `knowledge.citation.generated` - Citation generiert

**Funktionen**:
- Semantische Suche in Knowledge-Spaces
- Context-Zusammenstellung
- Citation-Formatierung
- Error-Handling mit Fallback

**Beispiel-Flow**:
```
Conversation-Agent → knowledge.search.executed
  → Retrieval-Agent
    → RAG-Service.search()
    → knowledge.context.built
```

### 3. Compliance-Agent

**Zuständigkeit**: Policy-Prüfung, PII-Redaction, Audit-Logging

**Verarbeitete Events**:
- `compliance.disclosure.shown` - Disclosure angezeigt
- `compliance.pii.detected` - PII erkannt
- `compliance.pii.redacted` - PII redigiert
- `compliance.audit.logged` - Audit geloggt

**Funktionen**:
- Disclosure-Management (Gov-Mode)
- PII-Erkennung und -Redaction
- Audit-Logging für Compliance
- Profile-basierte Compliance-Regeln

**Beispiel-Flow**:
```
Conversation-Agent → compliance.disclosure.shown
  → Compliance-Agent
    → Profile-Prüfung
    → Disclosure-Event
    → compliance.audit.logged
```

### 4. Media-Agent

**Zuständigkeit**: ASR/TTS, Avatar-Animationen, Multimodal-Processing

**Verarbeitete Events**:
- `perception.audio.received` - Audio empfangen
- `perception.video.received` - Video empfangen
- `perception.text.received` - Text empfangen
- `avatar.animation.started` - Animation gestartet
- `avatar.animation.completed` - Animation abgeschlossen
- `avatar.lip-sync.updated` - Lip-Sync aktualisiert

**Funktionen**:
- ASR (Automatic Speech Recognition)
- TTS (Text-to-Speech)
- Avatar-Animation-Koordination
- Multimodal-Streaming

**Beispiel-Flow**:
```
Phone-Bot → perception.audio.received
  → Media-Agent
    → ASR-Service.transcribe()
    → intent.message.processed
```

## Event-Routing

### Standard-Routing-Regeln

```typescript
// Perception Events → Media Agent
perception.* → media-agent

// Intent Events → Conversation Agent
intent.* → conversation-agent

// Knowledge Events → Retrieval Agent
knowledge.* → retrieval-agent

// Compliance Events → Compliance Agent
compliance.* → compliance-agent

// Avatar Events → Media Agent
avatar.* → media-agent

// Channel Events → Conversation Agent
channel.* → conversation-agent
```

### Custom Routing

Routing-Regeln können zur Laufzeit angepasst werden:

```typescript
eventRouter.addRoutingRule('intent.*', ['conversation-agent', 'compliance-agent']);
```

## Agent-Lifecycle

### 1. Registrierung

Agents werden beim Modul-Start registriert:

```typescript
@Module({
  providers: [ConversationAgent, ...],
})
export class AgentsModule {
  constructor(
    private readonly agentRuntime: AgentRuntimeService,
    private readonly conversationAgent: ConversationAgent,
  ) {
    this.agentRuntime.registerAgent(this.conversationAgent);
  }
}
```

### 2. Event-Verarbeitung

1. Event wird zum Event-Bus emittiert
2. Event-Router bestimmt zuständige Agents
3. Agents verarbeiten Event asynchron
4. Response-Events werden emittiert

### 3. Health-Checks

Alle Agents unterstützen Health-Checks:

```typescript
const health = await agentRuntime.healthCheck();
// { 'conversation-agent': true, 'retrieval-agent': true, ... }
```

## Best Practices

### 1. Event-Idempotenz

Events sollten idempotent sein:

```typescript
// Prüfe ob Event bereits verarbeitet wurde
if (await this.isEventProcessed(event.id)) {
  return null;
}
```

### 2. Error-Handling

Robustes Error-Handling mit Fallback:

```typescript
try {
  const result = await this.ragService.search(query, context);
  return result;
} catch (error) {
  this.logger.error(`RAG search failed: ${error.message}`);
  // Fallback zu Standard-Response
  return { results: [], context: '' };
}
```

### 3. Async-Verarbeitung

Agents sollten nicht blockieren:

```typescript
async handle(event: Event): Promise<Event | null> {
  // Asynchrone Verarbeitung
  const result = await this.processAsync(event);
  return result;
}
```

### 4. Logging

Umfassendes Logging für Debugging:

```typescript
this.logger.debug(`Processing event: ${event.type}`, {
  sessionId: event.sessionId,
  tenantId: event.tenantId,
});
```

## Weiterführende Dokumentation

- [Core Platform](./WATTOS_V2_CORE_PLATFORM.md)
- [Event-Bus](./packages/core/src/events/bus.service.ts)
- [Orchestrator](./packages/core/src/orchestrator/)

