# Persona & Agent Generator API Dokumentation

## Übersicht

Automatische Generierung von Personas aus gecrawlten Daten und Charakter-Definition, sowie Agent-Generierung aus Personas.

## Persona Generator Service

### POST `/api/v1/personas/generate`

Generiert Personas für einen Character.

**Request Body:**
```json
{
  "characterId": "uuid",
  "maxPersonas": 10,
  "minQualityScore": 0.7
}
```

**Response:**
```json
{
  "personas": [
    {
      "id": "uuid",
      "name": "Maria, 35, junge Mutter",
      "description": "...",
      "traits": {},
      "qualityScore": 0.85
    }
  ],
  "totalGenerated": 10,
  "filtered": 2
}
```

## Agent Generator Service

### POST `/api/v1/agents/generate`

Generiert Agents für Personas.

**Request Body:**
```json
{
  "personaIds": ["uuid1", "uuid2"],
  "validate": true
}
```

**Response:**
```json
{
  "agents": [
    {
      "id": "uuid",
      "name": "Maria Agent",
      "role": "Maria, 35, junge Mutter",
      "tools": ["rag-search", "web-search"],
      "ragConfig": {},
      "valid": true
    }
  ],
  "totalGenerated": 2,
  "validated": 2
}
```

## Qualitäts-Filter

Personas werden nach folgenden Kriterien gefiltert:
- Name vorhanden und aussagekräftig
- Beschreibung detailliert (min. 200 Zeichen)
- Traits vollständig
- Pain Points und Goals vorhanden

## Tool-Zuordnung

Agents erhalten automatisch Tools basierend auf:
- Persona Goals
- Persona Pain Points
- Standard-Tools (rag-search, web-search)

## Setup

```bash
# Persona Generator
cd apps/services/persona-generator-service
pnpm dev

# Agent Generator
cd apps/services/agent-generator-service
pnpm dev
```


