# Character Service API Dokumentation

## Übersicht

Der Character Service ermöglicht die automatische Definition von Charakteren aus natürlichen Sprach-Prompts mit LLM-basierter Extraktion und automatischer Tenant-Profile-Erstellung.

## Endpunkte

### POST `/api/v1/characters/define`

Definiert einen Charakter aus einem Prompt.

**Request Body:**
```json
{
  "tenantId": "string",
  "prompt": "Du bist Kaya, die Bürgerassistenz..."
}
```

**Response:**
```json
{
  "characterId": "uuid",
  "name": "Kaya",
  "role": "Bürgerassistenz",
  "personality": {},
  "tenantProfileCreated": true
}
```

### POST `/api/v1/characters`

Erstellt einen Character manuell.

**Request Body:**
```json
{
  "role": "string",
  "agent": "chatbot",
  "system_prompt": "string",
  "custom_parameters": {},
  "knowledge_base": {}
}
```

### GET `/api/v1/characters?tenantId={tenantId}`

Listet alle Characters für einen Tenant auf.

### GET `/api/v1/characters/{role}?tenantId={tenantId}`

Ruft einen Character nach Role ab.

## Setup

1. Environment Variables:
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
LLM_GATEWAY_URL=http://localhost:3009
```

2. Database Migration:
```bash
pnpm db:migrate
```

3. Service starten:
```bash
cd apps/services/character-service
pnpm dev
```

## Integration

Der Service integriert sich mit:
- **LLM Gateway**: Für Charakter-Extraktion
- **Profile Service**: Für Tenant-Profile-Erstellung
- **Database**: Für Persistierung

