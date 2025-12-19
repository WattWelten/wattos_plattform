# Onboarding-Dokumentation

## Übersicht

Das Onboarding-System führt neue Benutzer durch die Einrichtung ihrer Plattform. Es erstellt automatisch:

1. **Knowledge Space**: Wissensraum für Dokumente
2. **Character**: KI-Charakter mit System-Prompt und Knowledge Base
3. **Optional**: Agent-Konfiguration

## Onboarding-Flow

### Schritt 1: Willkommen
Begrüßung und Übersicht über die Plattform.

### Schritt 2: Organisation
- **Organisationsname**: Name der Organisation
- **Organisationstyp**: KMU, Schule oder Verwaltung

### Schritt 3: Wissensraum
- **Name**: Name des Wissensraums (z.B. "IT-Dokumentation")
- Optional: Beschreibung

### Schritt 4: Agent/Character
Auswahl eines vorkonfigurierten Agent-Typs:
- **IT-Support**: Hilft bei IT-Fragen und Problemen
- **Sales**: Unterstützt im Vertrieb
- **Marketing**: Hilft bei Marketing-Aufgaben

### Schritt 5: Fertig
Zusammenfassung und Weiterleitung zum Chat.

## API-Integration

### Knowledge Space erstellen

```typescript
import { createKnowledgeSpace } from '@/lib/api/knowledge-spaces';

const knowledgeSpace = await createKnowledgeSpace({
  name: 'IT-Dokumentation',
  description: 'Wissensraum für IT-Dokumentation',
}, token);
```

### Character erstellen

```typescript
import { createCharacter } from '@/lib/api/characters';

const character = await createCharacter({
  role: 'it-support',
  agent: 'chatbot',
  system_prompt: 'Du bist ein hilfreicher IT-Support Assistent...',
  knowledge_base: {
    knowledgeSpaceId: knowledgeSpace.id,
  },
}, token);
```

## System-Prompts

Vordefinierte System-Prompts für verschiedene Agent-Typen:

### IT-Support
```
Du bist ein hilfreicher IT-Support Assistent. Du hilfst Benutzern bei IT-Problemen und Fragen.
```

### Sales
```
Du bist ein freundlicher Sales-Assistent. Du unterstützt Kunden bei Produktfragen und Verkaufsprozessen.
```

### Marketing
```
Du bist ein kreativer Marketing-Assistent. Du hilfst bei Marketing-Aufgaben, Content-Erstellung und Kampagnen.
```

## Weiterleitung

Nach erfolgreichem Onboarding wird der Benutzer zum Chat weitergeleitet:

```
/de/chat?character={characterRole}
```

Der Chat lädt automatisch den erstellten Character.

## Fehlerbehandlung

- **Nicht angemeldet**: Weiterleitung zum Login
- **API-Fehler**: Fehlermeldung mit Details
- **Validierung**: Client-seitige Validierung vor Absenden

## Erweiterungen

Mögliche zukünftige Erweiterungen:

- Mehr Agent-Typen
- Custom System-Prompts
- Mehrere Knowledge Spaces
- Agent-Konfiguration (Tools, Policies)
- Tenant-Setup (wenn nicht vorhanden)














