# Ingestion-Service Dokumentation

## Übersicht

Der Ingestion-Service ist ein FastAPI-basierter Service für die Verarbeitung von Dokumenten. Er bietet:

- **File Watching**: Automatisches Erkennen neuer Dateien
- **Queue Management**: Asynchrone Verarbeitung über Redis
- **DB-Integration**: Automatische Persistierung von Documents und Chunks
- **Status-Tracking**: Echtzeit-Status-Updates für Dokument-Verarbeitung

## Architektur

### Verarbeitungs-Pipeline

1. **File Upload/Watch** → Dokument wird erkannt oder hochgeladen
2. **Queue** → Job wird in Redis-Queue eingereiht
3. **Processing** → Dokument wird verarbeitet:
   - Dokument in DB speichern
   - Chunking
   - Embedding-Generierung (über LLM-Gateway)
   - PII-Redaction
   - Vector Store (über RAG-Service)
   - Chunks in DB speichern
4. **Completion** → Status wird aktualisiert

## DB-Integration

### HTTP-API Endpunkte

Der Ingestion-Service kommuniziert über HTTP mit dem Admin-Service für DB-Operationen:

#### Document erstellen

```http
POST /db/documents
Content-Type: application/json

{
  "id": "doc_123",
  "knowledgeSpaceId": "ks_456",
  "fileName": "document.pdf",
  "filePath": "/documents/doc_123/document.pdf",
  "fileType": "pdf",
  "fileSize": 1024000
}
```

#### Chunks speichern

```http
POST /db/chunks
Content-Type: application/json

{
  "chunks": [
    {
      "id": "doc_123_chunk_0",
      "documentId": "doc_123",
      "content": "Chunk content...",
      "chunkIndex": 0,
      "metadata": {},
      "embedding": [0.1, 0.2, ...]
    }
  ]
}
```

#### Document-Status abrufen

```http
GET /db/documents/{document_id}
```

## API-Endpunkte

### Dokument hochladen

```http
POST /upload
Content-Type: multipart/form-data

file: <file>
knowledge_space_id: "ks_123" (optional)
```

**Response:**
```json
{
  "document_id": "doc_123",
  "status": "queued",
  "message": "Document queued for processing"
}
```

### Status abrufen

```http
GET /status/{document_id}
```

**Response:**
```json
{
  "document_id": "doc_123",
  "status": "completed",
  "progress": 1.0,
  "chunks_count": 42
}
```

### Queue-Statistiken

```http
GET /queue/stats
```

### File-Watcher steuern

```http
POST /watch/start
Content-Type: application/json

{
  "path": "/path/to/watch"
}
```

```http
POST /watch/stop
Content-Type: application/json

{
  "path": "/path/to/watch"
}
```

## Konfiguration

### Umgebungsvariablen

```env
# Admin-Service URL (für DB-Operationen)
ADMIN_SERVICE_URL=http://localhost:3008

# LLM-Gateway URL (für Embeddings)
LLM_GATEWAY_URL=http://localhost:3009

# RAG-Service URL (für Vector Store)
RAG_SERVICE_URL=http://localhost:3007

# Redis (für Queue)
REDIS_URL=redis://localhost:6379
```

## Verarbeitungs-Details

### Chunking

- **Strategie**: Fixed-size chunks mit Overlap
- **Standard**: 1000 Zeichen pro Chunk, 200 Zeichen Overlap
- **Anpassbar**: Über Chunking-Optionen

### Embeddings

- **Provider**: OpenAI (standard)
- **Model**: text-embedding-3-small
- **Dimensionen**: 1536

### PII-Redaction

Automatische Erkennung und Redaction von:
- E-Mail-Adressen
- Telefonnummern (deutsches Format)
- IBANs

## Fehlerbehandlung

- **DB-Fehler**: Werden geloggt, brechen Verarbeitung nicht ab
- **Embedding-Fehler**: Fallback auf leeres Embedding
- **Vector Store-Fehler**: Werden geloggt, Verarbeitung wird fortgesetzt

## Monitoring

Der Service loggt alle wichtigen Ereignisse:
- Dokument-Erstellung
- Chunk-Erstellung
- Embedding-Generierung
- DB-Operationen
- Fehler














