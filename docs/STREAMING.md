# Streaming-Service Dokumentation

## Übersicht

Der Streaming-Service ermöglicht Echtzeit-Streaming von LLM-Antworten über Server-Sent Events (SSE). Er unterstützt:

- **Chat-Streaming**: Streaming für Standard-Chats
- **Conversation-Streaming**: Streaming für Character-basierte Conversations mit RAG
- **Audio-Streaming**: Audio-Streaming (in Entwicklung)

## Architektur

### SSE (Server-Sent Events)

Der Service nutzt SSE für unidirektionales Streaming vom Server zum Client:

```
Client → POST /conversations/message/stream
Server → SSE Stream: chunk → chunk → done
```

### Event-Typen

- **`chunk`**: Einzelner Text-Chunk
- **`done`**: Stream abgeschlossen, vollständiger Text + Citations

## API-Endpunkte

### Conversation-Streaming

```http
POST /v1/conversations/message/stream
Content-Type: application/json

{
  "thread_id": "uuid",
  "message": "Was ist KI?",
  "search_tool_config": {
    "strategy": "two_stage",
    "top_k": 4
  }
}
```

**Response:** SSE Stream

```
data: {"type":"chunk","content":"KI","threadId":"uuid"}

data: {"type":"chunk","content":" steht","threadId":"uuid"}

data: {"type":"chunk","content":" für","threadId":"uuid"}

...

data: {"type":"done","content":"KI steht für Künstliche Intelligenz...","threadId":"uuid","citations":[...]}

```

### Chat-Streaming

```http
POST /sse/{chatId}/stream
Content-Type: application/json

{
  "message": "Hallo!",
  "model": "gpt-4",
  "provider": "openai"
}
```

## Implementierung

### Streaming-Flow

1. **Request empfangen** → Conversation/Chat laden
2. **User-Nachricht speichern** → In DB persistieren
3. **RAG-Context abrufen** → (bei Conversations mit search_tool_config)
4. **LLM-Stream starten** → Verbindung zu LLM-Gateway
5. **Chunks emittieren** → SSE-Events senden
6. **Finale Nachricht speichern** → In DB persistieren
7. **Done-Event senden** → Mit Citations

### Fehlerbehandlung

- **LLM-Fehler**: Stream wird abgebrochen, Fehler wird emittiert
- **DB-Fehler**: Werden geloggt, brechen Stream nicht ab
- **RAG-Fehler**: Fallback auf leeren Context

## Client-Integration

### React Hook Beispiel

```typescript
const useStreamingMessage = () => {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const streamMessage = async (threadId: string, message: string) => {
    setIsStreaming(true);
    setContent('');

    const eventSource = new EventSource(
      `${API_URL}/api/v1/conversations/message/stream`,
      {
        method: 'POST',
        body: JSON.stringify({ thread_id: threadId, message }),
      }
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chunk') {
        setContent((prev) => prev + data.content);
      } else if (data.type === 'done') {
        setContent(data.content);
        setIsStreaming(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setIsStreaming(false);
      eventSource.close();
    };
  };

  return { content, isStreaming, streamMessage };
};
```

## Performance

- **Chunk-Größe**: Konfigurierbar über `streaming.chunkSize`
- **Buffer-Management**: Automatisches Buffering für unvollständige SSE-Lines
- **DB-Operationen**: Asynchron, blockieren Stream nicht

## Erweiterungen

Mögliche zukünftige Erweiterungen:

- **WebSocket-Support**: Für bidirektionales Streaming
- **Audio-Streaming**: Vollständige TTS-Integration
- **Multi-User-Streaming**: Broadcast für mehrere Clients
- **Stream-Pause/Resume**: Unterbrechung und Fortsetzung














