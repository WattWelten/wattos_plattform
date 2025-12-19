# Compliance Features Dokumentation

## Übersicht

Die Compliance-Features umfassen Disclosure-System, Source Cards und Audit & Replay für vollständige Nachvollziehbarkeit und Compliance (DSGVO, AI Act).

## Disclosure-System

### Funktionen

#### 1. Disclosure abrufen

```typescript
const disclosure = await disclosureService.getDisclosure(tenantId, sessionId);

if (disclosure) {
  // Disclosure anzeigen
  if (disclosure.required) {
    // Disclosure muss bestätigt werden
  }
}
```

#### 2. Disclosure bestätigen

```typescript
const acknowledged = await disclosureService.acknowledgeDisclosure(
  tenantId,
  sessionId,
  userId,
);
```

#### 3. Disclosure-Status prüfen

```typescript
const required = await disclosureService.isDisclosureRequired(tenantId);
```

### Disclosure-Typen

- **gov-full**: Vollständige Disclosure für Gov-Mode (F13)
- **standard**: Standard-Disclosure für regulierte Märkte
- **minimal**: Minimale Disclosure für Enterprise

### Disclosure-Inhalte

**Gov-Full**:
```
KI-Assistent Hinweis (Vollständig)

Dieser KI-Assistent nutzt künstliche Intelligenz zur Beantwortung Ihrer Fragen. 

WICHTIG:
- Die Antworten werden automatisch generiert und können Fehler enthalten
- Bitte prüfen Sie wichtige Informationen in den Originalquellen
- Alle Quellenangaben sind verpflichtend angezeigt
- Ihre Daten werden gemäß DSGVO und AI Act verarbeitet
- Vollständige Audit-Logs werden für Nachvollziehbarkeit gespeichert

Durch die Nutzung bestätigen Sie, dass Sie diese Hinweise verstanden haben.
```

## Source Cards

### Funktionen

#### 1. Source Cards erstellen

```typescript
const sourceCards = await sourceCardsService.createSourceCards(
  tenantId,
  sessionId,
  ragResults,
);
```

#### 2. Source Cards validieren

```typescript
const validation = await sourceCardsService.validateSourceCards(
  tenantId,
  sourceCards,
);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

#### 3. Source Cards für UI formatieren

```typescript
const formatted = sourceCardsService.formatSourceCardsForUI(sourceCards);
```

### Source Card Struktur

```typescript
interface SourceCard {
  id: string;
  content: string;
  source: string;
  score: number;
  documentName?: string;
  documentUrl?: string;
  pageNumber?: number;
  metadata?: Record<string, any>;
}
```

### Erzwungene Source Cards (Gov-Mode)

Bei Gov-Mode (`sourceRequired: true`) sind Source Cards **verpflichtend**:

- Jede Antwort muss Source Cards enthalten
- Fehlende Source Cards werden geloggt
- Validation schlägt fehl ohne Source Cards

## Audit & Replay

### Funktionen

#### 1. Event-History abrufen

```typescript
const history = await auditReplayService.getEventHistory(sessionId, {
  startTime: Date.now() - 3600000, // Letzte Stunde
  domain: EventDomain.INTENT,
  limit: 100,
});
```

#### 2. Replay-Session erstellen

```typescript
const replaySession = await auditReplayService.createReplaySession(
  sessionId,
  tenantId,
  {
    startTime: Date.now() - 3600000,
    endTime: Date.now(),
  },
);
```

#### 3. Replay durchführen

```typescript
await auditReplayService.replaySession(replaySession.id, {
  speed: 2.0, // 2x Geschwindigkeit
  startFrom: 0,
});
```

#### 4. Audit-Log exportieren

```typescript
// JSON Export
const json = await auditReplayService.exportAuditLog(
  tenantId,
  sessionId,
  'json',
);

// CSV Export
const csv = await auditReplayService.exportAuditLog(
  tenantId,
  sessionId,
  'csv',
);
```

### Replay-Session Struktur

```typescript
interface ReplaySession {
  sessionId: string;
  tenantId: string;
  userId?: string;
  events: Event[];
  startTime: number;
  endTime?: number;
  duration?: number;
}
```

## Integration

### Conversation-Agent Integration

Der Conversation-Agent nutzt Source Cards automatisch:

```typescript
// RAG-Results → Source Cards
const sourceCards = await sourceCardsService.createSourceCards(
  tenantId,
  sessionId,
  ragResponse.results,
);

// Source Cards in Response
responseEvent.payload.citations = sourceCards;
```

### Compliance-Agent Integration

Der Compliance-Agent nutzt Disclosure-System:

```typescript
// Disclosure prüfen
const disclosure = await disclosureService.getDisclosure(tenantId, sessionId);

if (disclosure && disclosure.required && !disclosure.acknowledged) {
  // Disclosure anzeigen und auf Bestätigung warten
}
```

## Best Practices

### 1. Disclosure immer prüfen

```typescript
// Vor jeder Konversation
const disclosure = await disclosureService.getDisclosure(tenantId, sessionId);
if (disclosure && disclosure.required && !disclosure.acknowledged) {
  // Disclosure anzeigen
  return { requiresDisclosure: true, disclosure };
}
```

### 2. Source Cards validieren

```typescript
// Nach RAG-Suche
const validation = await sourceCardsService.validateSourceCards(
  tenantId,
  sourceCards,
);

if (!validation.valid) {
  // Fehler behandeln
  throw new Error(`Source cards validation failed: ${validation.errors.join(', ')}`);
}
```

### 3. Audit-Logs regelmäßig exportieren

```typescript
// Täglicher Export
setInterval(async () => {
  const sessions = await getActiveSessions(tenantId);
  for (const session of sessions) {
    await auditReplayService.exportAuditLog(tenantId, session.id, 'json');
  }
}, 86400000); // 24 Stunden
```

## Weiterführende Dokumentation

- [Profile-System](./PROFILE_SYSTEM.md)
- [Compliance-Agent](./AGENTS_IMPLEMENTATION.md#3-compliance-agent)
- [RAG-Service](./packages/core/src/knowledge/rag/rag.service.ts)

