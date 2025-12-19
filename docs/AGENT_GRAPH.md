# Agent Graph-Orchestrierung Dokumentation

## Übersicht

Der Agent-Service nutzt LangGraph für die Orchestrierung von Agent-Runs. LangGraph ermöglicht komplexe Workflows mit bedingten Verzweigungen, Tool-Ausführungen und Human-in-the-Loop (HiTL).

## Architektur

### Graph-Struktur

```
START → LLM Node → Router Node → [Tool Node] → LLM Node → END
                      ↓
                    (Tool Calls?)
                      ↓
                   continue/end
```

### Nodes

1. **LLM Node**: Ruft LLM-Gateway auf, generiert Antworten und Tool Calls
2. **Router Node**: Entscheidet, ob Tool Calls vorhanden sind
3. **Tools Node**: Führt Tools über Tool-Service aus

### State Management

Der Graph-State enthält:
- **messages**: LangChain BaseMessages (System, Human, AI)
- **agentState**: AgentState mit Metadaten
- **toolResults**: Ergebnisse von Tool-Ausführungen
- **next**: Routing-Informationen

## Graph-Erstellung

### Automatische Graph-Erstellung

```typescript
const graph = graphService.createAgentGraph(agentId, tools);
```

Der Graph wird automatisch erstellt basierend auf:
- Agent-Konfiguration (Tools, Persona)
- Verfügbare Tools aus Tool-Service

### Graph-Caching

Graphen werden gecacht, um Performance zu optimieren:
- Ein Graph pro Agent-ID
- Wiederverwendung bei mehreren Runs

## Graph-Ausführung

### Flow

1. **Initial State**: AgentState wird in GraphState konvertiert
2. **LLM Node**: Generiert Antwort oder Tool Calls
3. **Router Node**: Entscheidet über Weiterführung
4. **Tools Node**: Führt Tools aus (falls vorhanden)
5. **Loop**: Zurück zu LLM Node mit Tool-Ergebnissen
6. **End**: Finale Antwort wird extrahiert

### Beispiel

```typescript
const agentState: AgentState = {
  agentId: 'agent_123',
  tenantId: 'tenant_456',
  input: 'Sende eine E-Mail an support@example.com',
  systemPrompt: 'Du bist ein hilfreicher Assistent.',
  availableTools: ['send_email', 'search_knowledge_base'],
  // ...
};

const initialState = graphStateService.initializeState(agentState, input);
const result = await graphService.executeGraph(graph, initialState);
```

## Tool-Integration

### Tool-Ausführung

Tools werden über den Tool-Service ausgeführt:

```typescript
POST /tools/execute
{
  "toolId": "send_email",
  "input": {
    "to": "support@example.com",
    "subject": "...",
    "body": "..."
  }
}
```

### Tool Call Tracking

Jeder Tool Call wird automatisch in der DB gespeichert:
- Tool-Name
- Input
- Output
- Fehler (falls vorhanden)

## LLM-Integration

### LLM-Gateway

Der Graph nutzt den LLM-Gateway für alle LLM-Aufrufe:

```typescript
POST /v1/chat/completions
{
  "model": "gpt-4",
  "messages": [...],
  "tools": [...]
}
```

### Tool Calls

LLM-Gateway unterstützt Tool Calls im OpenAI-Format:
- Function Calling
- Tool Results werden als Messages zurückgegeben

## HiTL-Integration

### Approval-Workflows

Tools können Approval erfordern:
1. Tool Call wird erkannt
2. HiTL-Service wird aufgerufen
3. Graph pausiert
4. Nach Approval: Graph wird fortgesetzt

### Resume

```typescript
await agentService.resumeRun(runId, approval);
```

## Fehlerbehandlung

- **LLM-Fehler**: Werden geloggt, Graph wird abgebrochen
- **Tool-Fehler**: Werden in toolResults gespeichert, Graph wird fortgesetzt
- **DB-Fehler**: Werden geloggt, brechen Graph nicht ab

## Performance

- **Graph-Caching**: Reduziert Overhead bei wiederholten Runs
- **Asynchrone Tool-Ausführung**: Tools werden parallel ausgeführt (wenn möglich)
- **State-Updates**: Nur notwendige State-Updates

## Erweiterungen

Mögliche zukünftige Erweiterungen:

- **Streaming**: Graph-Ausführung mit Streaming
- **Parallel Tool Execution**: Mehrere Tools gleichzeitig
- **Graph-Visualisierung**: Graph-Struktur visualisieren
- **Checkpointing**: Graph-State speichern und wiederherstellen














