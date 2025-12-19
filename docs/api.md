# WattWeiser API Dokumentation

## Übersicht

Die WattWeiser Plattform bietet eine REST-API für alle Hauptfunktionen. Alle Endpunkte sind über das API-Gateway (`/api`) erreichbar.

## Authentifizierung

Die meisten Endpunkte erfordern JWT-Authentifizierung:

```http
Authorization: Bearer <access_token>
```

## Character API

### Character erstellen

```http
POST /api/v1/characters
Content-Type: application/json

{
  "role": "assistant",
  "agent": "chatbot",
  "voice_id": "Brian",
  "voice_model": "eleven_flash_v2_5",
  "system_prompt": "Du bist ein hilfreicher Assistent.",
  "custom_parameters": {},
  "knowledge_base": {}
}
```

**Response:**
```json
{
  "id": "uuid",
  "role": "assistant",
  "agent": "chatbot",
  "voice_id": "Brian",
  "voice_model": "eleven_flash_v2_5",
  "system_prompt": "Du bist ein hilfreicher Assistent.",
  "custom_parameters": {},
  "knowledge_base": {},
  "created_at": "2025-01-25T12:00:00Z",
  "updated_at": "2025-01-25T12:00:00Z"
}
```

### Alle Characters auflisten

```http
GET /api/v1/characters
```

### Character nach role abrufen

```http
GET /api/v1/characters/{role}
```

### Character aktualisieren

```http
PUT /api/v1/characters/{id}
Content-Type: application/json

{
  "system_prompt": "Neuer System-Prompt",
  "voice_id": "Alice"
}
```

### Character löschen

```http
DELETE /api/v1/characters/{id}
```

## Conversations API

### Conversation erstellen

```http
POST /api/v1/conversations
Content-Type: application/json

{
  "role": "assistant"
}
```

**Response:**
```json
{
  "thread_id": "uuid",
  "role": "assistant"
}
```

### Conversation abrufen

```http
GET /api/v1/conversations/{threadId}
```

**Response:**
```json
{
  "thread_id": "uuid",
  "role": "assistant",
  "messages": [
    {
      "role": "user",
      "content": "Hallo!",
      "citations": null,
      "created_at": "2025-01-25T12:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Hallo! Wie kann ich Ihnen helfen?",
      "citations": [],
      "created_at": "2025-01-25T12:00:30Z"
    }
  ]
}
```

### Nachricht senden

```http
POST /api/v1/conversations/message
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

**Response:**
```json
{
  "thread_id": "uuid",
  "role": "assistant",
  "message": "KI steht für Künstliche Intelligenz...",
  "citations": [
    {
      "id": "chunk_123",
      "content": "Künstliche Intelligenz (KI)...",
      "score": 0.95,
      "metadata": {
        "documentId": "doc_456",
        "chunkIndex": 0
      }
    }
  ]
}
```

### Streaming-Nachricht

```http
POST /api/v1/conversations/message/stream
Content-Type: application/json

{
  "thread_id": "uuid",
  "message": "Erkläre mir KI",
  "search_tool_config": {
    "strategy": "two_stage",
    "top_k": 4
  }
}
```

**Response:** Server-Sent Events (SSE) Stream

### Audio-Streaming-Nachricht

```http
POST /api/v1/conversations/message/audio/stream
Content-Type: application/json

{
  "thread_id": "uuid",
  "message": "Erkläre mir KI"
}
```

**Response:** Audio-Stream (MP3/WAV)

## Artifacts API

### Artefakt per URL hinzufügen

```http
POST /api/v1/artifacts/add_url
Content-Type: application/json

{
  "character": "assistant",
  "name": "Produktbroschüre",
  "description": "Unsere aktuelle Produktbroschüre",
  "url": "https://example.com/brochure.pdf",
  "storage_type": "url"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Produktbroschüre",
  "description": "Unsere aktuelle Produktbroschüre",
  "url": "https://example.com/brochure.pdf",
  "storage_type": "url",
  "metadata": {},
  "created_at": "2025-01-25T12:00:00Z",
  "updated_at": "2025-01-25T12:00:00Z"
}
```

### Alle Artefakte auflisten

```http
GET /api/v1/artifacts?character=assistant
```

### Artefakt abrufen

```http
GET /api/v1/artifacts/{id}
```

### Artefakt löschen

```http
DELETE /api/v1/artifacts/{id}
```

## Search Tool Config

Das `search_tool_config` Objekt ermöglicht die Konfiguration der RAG-Suche:

```typescript
{
  strategy?: 'two_stage' | 'single_stage';  // Standard: 'single_stage'
  top_k?: number;                            // Standard: 4
}
```

### Two-Stage Retrieval

Bei `strategy: 'two_stage'` wird ein zweistufiger Retrieval-Prozess durchgeführt:

1. **Erste Stufe (Coarse Search):** Grobe Suche mit `top_k * 2` Ergebnissen
2. **Zweite Stufe (Fine Search):** Feine Suche auf den Top-Ergebnissen mit `top_k` Ergebnissen

Dies verbessert die Relevanz der Suchergebnisse, insbesondere bei großen Wissensbasen.

## Fehlerbehandlung

Alle Endpunkte geben bei Fehlern einen HTTP-Status-Code und eine Fehlermeldung zurück:

```json
{
  "statusCode": 404,
  "message": "Character mit role 'assistant' nicht gefunden",
  "error": "Not Found"
}
```

## Rate Limiting

Die API hat Rate-Limiting aktiviert:
- **100 Requests pro Minute** pro Benutzer
- Bei Überschreitung: HTTP 429 (Too Many Requests)
