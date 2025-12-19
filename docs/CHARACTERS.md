# Character-System Dokumentation

## Übersicht

Das Character-System ermöglicht es Benutzern, einfach eigene KI-Charaktere zu erstellen und zu verwalten. Jeder Character hat eine eindeutige `role` und kann mit verschiedenen Konfigurationen (Voice, System-Prompt, Knowledge Base) personalisiert werden.

## Architektur

### Character-Service

Der Character-Service (`apps/services/character-service`) ist ein NestJS-Service, der folgende Funktionen bereitstellt:

- **Character-Management**: CRUD-Operationen für Characters
- **Artifact-Management**: Verwaltung von Artefakten (Dokumente, URLs) pro Character

### Datenmodell

```prisma
model Character {
  id              String   @id @default(uuid())
  role            String   @unique
  agent           String   @default("chatbot")
  voiceId         String?
  voiceModel      String?
  systemPrompt    String?  @db.Text
  customParameters Json    @default("{}")
  knowledgeBase   Json     @default("{}")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  conversations   Conversation[]
  artifacts       Artifact[]
}

model Artifact {
  id          String   @id @default(uuid())
  characterId String
  name        String
  description String?  @db.Text
  url         String
  storageType String   @default("local")
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  character  Character @relation(...)
}
```

## API-Endpunkte

### Characters

- `POST /api/v1/characters` - Character erstellen
- `GET /api/v1/characters` - Alle Characters auflisten
- `GET /api/v1/characters/{role}` - Character nach role abrufen
- `PUT /api/v1/characters/{id}` - Character aktualisieren
- `DELETE /api/v1/characters/{id}` - Character löschen

### Artifacts

- `POST /api/v1/artifacts/add_url` - Artefakt per URL hinzufügen
- `GET /api/v1/artifacts?character={role}` - Artefakte auflisten
- `GET /api/v1/artifacts/{id}` - Artefakt abrufen
- `DELETE /api/v1/artifacts/{id}` - Artefakt löschen

## Verwendung

### Character erstellen

```typescript
import { createCharacter } from '@/lib/api/characters';

const character = await createCharacter({
  role: 'assistant',
  system_prompt: 'Du bist ein hilfreicher Assistent.',
  voice_id: 'Brian',
  voice_model: 'eleven_flash_v2_5',
  knowledge_base: {
    knowledgeSpaceId: 'ks_123',
  },
}, token);
```

### Conversation mit Character starten

```typescript
import { createConversation } from '@/lib/api/conversations';

const conversation = await createConversation({
  role: 'assistant',
}, token);

// conversation.thread_id verwenden für weitere Nachrichten
```

### Nachricht mit RAG-Suche senden

```typescript
import { sendMessage } from '@/lib/api/conversations';

const response = await sendMessage({
  thread_id: conversation.thread_id,
  message: 'Was ist KI?',
  search_tool_config: {
    strategy: 'two_stage', // oder 'single_stage'
    top_k: 4,
  },
}, token);
```

## Two-Stage Retrieval

Das `search_tool_config` ermöglicht die Konfiguration der RAG-Suche:

- **`strategy: 'two_stage'`**: Zweistufiger Retrieval-Prozess
  1. Grobe Suche mit `top_k * 2` Ergebnissen
  2. Feine Suche auf Top-Ergebnissen mit `top_k` Ergebnissen
- **`strategy: 'single_stage'`**: Standard Single-Stage Retrieval

Two-Stage Retrieval verbessert die Relevanz der Suchergebnisse, insbesondere bei großen Wissensbasen.

## Integration mit Conversations

Characters sind eng mit dem Conversations-System verbunden:

1. **Character erstellen** → Definiert die Persönlichkeit und Konfiguration
2. **Conversation starten** → Verwendet die Character-Konfiguration
3. **Nachrichten senden** → Nutzt Character's Knowledge Base für RAG

## Best Practices

1. **Eindeutige Roles**: Jeder Character sollte eine eindeutige `role` haben
2. **System-Prompts**: Klare, spezifische System-Prompts für bessere Ergebnisse
3. **Knowledge Base**: Verknüpfe Characters mit relevanten Wissensräumen
4. **Artifacts**: Nutze Artifacts für zusätzliche Kontext-Dokumente

## Erweiterungen

Mögliche zukünftige Erweiterungen:

- Voice-Cloning für Characters
- Multi-Modal Support (Bilder, Videos)
- Character-Templates
- Character-Sharing zwischen Tenants
- Character-Analytics und Performance-Tracking














