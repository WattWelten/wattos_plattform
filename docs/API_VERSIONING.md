# API Versioning Strategy

## Übersicht

Die WattOS KI Plattform verwendet URL-basierte API-Versionierung für klare und explizite Versionierung aller Endpunkte.

## Versionierungs-Strategie

### URL-basierte Versionierung

Alle API-Endpunkte sind versioniert über den URL-Pfad:

```
/api/v1/characters      → Version 1
/api/v2/characters     → Version 2 (wenn Breaking Changes)
```

### Versionierungs-Regeln

#### Major Version (v1 → v2)
**Breaking Changes:**
- Entfernte Endpunkte
- Geänderte Request/Response Strukturen
- Geänderte Authentifizierung
- Geänderte Fehler-Codes

**Beispiel:**
```typescript
// v1
GET /api/v1/characters
Response: { id: string, name: string }

// v2 (Breaking Change)
GET /api/v2/characters
Response: { characterId: string, characterName: string, metadata: object }
```

#### Minor Version (v1.0 → v1.1)
**Neue Features (backward-compatible):**
- Neue Endpunkte
- Neue optionale Felder in Responses
- Neue Query-Parameter

**Beispiel:**
```typescript
// v1.0
GET /api/v1/characters
Response: { id: string, name: string }

// v1.1 (Non-breaking)
GET /api/v1/characters
Response: { id: string, name: string, metadata?: object } // Neues optionales Feld
```

#### Patch Version (v1.0.0 → v1.0.1)
**Bugfixes (backward-compatible):**
- Bugfixes ohne API-Änderungen
- Performance-Verbesserungen
- Dokumentations-Updates

## Deprecation Policy

### 6-Monats-Regel

1. **Deprecation Announcement**: 6 Monate vor Entfernung
2. **Deprecation Warning**: In API-Responses und Dokumentation
3. **Migration Guide**: Vollständige Anleitung für Migration
4. **Support**: Während Deprecation-Zeitraum

### Deprecation Headers

Alle deprecated Endpunkte senden Warnungen:

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: 2025-07-01T00:00:00Z
Link: </api/v2/characters>; rel="successor-version"
```

## Migration Guides

### v1 → v2 Migration

**Breaking Changes:**
- `id` → `characterId`
- `name` → `characterName`
- Neue `metadata` Struktur

**Migration Steps:**
1. Update API-Calls zu `/api/v2/characters`
2. Update Response-Parsing
3. Update TypeScript Types
4. Testen in Staging

**Code Example:**
```typescript
// v1
const response = await fetch('/api/v1/characters');
const data = await response.json();
console.log(data.id, data.name);

// v2
const response = await response.json();
console.log(data.characterId, data.characterName, data.metadata);
```

## Versionierung in Code

### Controller Versionierung

```typescript
@Controller('v1/characters')
export class CharactersV1Controller {
  // v1 Implementation
}

@Controller('v2/characters')
export class CharactersV2Controller {
  // v2 Implementation
}
```

### DTO Versionierung

```typescript
// v1 DTOs
export class CharacterV1Dto {
  id: string;
  name: string;
}

// v2 DTOs
export class CharacterV2Dto {
  characterId: string;
  characterName: string;
  metadata: object;
}
```

## Best Practices

1. **Immer backward-compatible** - Neue Versionen sollten alte nicht brechen
2. **Klare Migration Paths** - Migration Guides für alle Breaking Changes
3. **Deprecation Warnings** - Frühzeitig warnen vor Entfernung
4. **Versionierung dokumentieren** - In OpenAPI/Swagger Docs
5. **Version Testing** - Beide Versionen parallel testen

## Aktuelle Versionen

- **v1**: Aktuelle stabile Version
  - Characters API
  - Conversations API
  - Artifacts API

## Zukünftige Versionen

- **v2**: Geplant für Q2 2025
  - Verbesserte Character API
  - Neue Metadata-Struktur
  - Enhanced Artifacts API












