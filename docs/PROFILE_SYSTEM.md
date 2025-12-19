# Profile-System Dokumentation

## Übersicht

Das Profile-System ermöglicht es, verschiedene Markt- und Compliance-Anforderungen über Konfiguration zu steuern, ohne den Core-Code zu ändern.

## Architektur

### Profile-Komponenten

```
packages/core/src/profiles/
  ├── types.ts              # Profile-Typen (Market, Mode, Features)
  ├── profile.service.ts    # Profile-Loading & Caching
  ├── feature-flags.service.ts # Feature-Flag-Checks
  ├── validators/           # Profile-Validatoren
  │   ├── enterprise.validator.ts
  │   ├── gov.validator.ts
  │   ├── media.validator.ts
  │   └── health.validator.ts
  └── profiles.module.ts    # NestJS Module
```

## Profile-Typen

### Market

- `enterprise` - B2B Enterprise-Kunden
- `gov` - Öffentliche Verwaltung
- `media` - Medien & Moderation
- `health` - Regulierte Branchen (Health, Finance)

### Mode

- `standard` - Standard-Modus
- `regulated` - Regulierter Modus (strikte Compliance)
- `gov-f13` - Gov-Modus mit F13-Backend

## Standard-Profile

### Enterprise Profile

**Konfiguration**:
```typescript
{
  market: "enterprise",
  mode: "standard",
  providers: {
    llm: "wattweiser",
    rag: "wattweiser",
    // ...
  },
  compliance: {
    gdpr: true,
    aiAct: true,
    disclosure: false,
    retentionDays: 90,
  },
  features: {
    guidedFlows: false,
    sourceRequired: false,
    hitlRequired: false,
    toolCallsEnabled: true,
    visionEnabled: false,
    webChat: true,
    phone: true,
    whatsapp: true,
  }
}
```

**Features**:
- Freiere Konversation
- Tiefe System-Integrationen
- Tool-Calls aktiv
- Alle Channels verfügbar

### Gov Profile

**Konfiguration**:
```typescript
{
  market: "gov",
  mode: "gov-f13",
  providers: {
    llm: "f13",
    rag: "f13",
    // ...
  },
  compliance: {
    gdpr: true,
    aiAct: true,
    disclosure: true, // Immer aktiv
    retentionDays: 365,
  },
  features: {
    guidedFlows: true,
    sourceRequired: true, // Quellenpflicht
    hitlRequired: false,
    toolCallsEnabled: false, // Begrenzt
    visionEnabled: false,
    webChat: true,
    phone: true,
    whatsapp: false,
  }
}
```

**Features**:
- Geführte Journeys
- Quellenpflicht
- Disclosure immer aktiv
- F13-Backend
- Tool-Calls begrenzt

### Media Profile

**Konfiguration**:
```typescript
{
  market: "media",
  mode: "standard",
  providers: {
    llm: "wattweiser",
    rag: "wattweiser",
    // ...
  },
  compliance: {
    gdpr: true,
    aiAct: true,
    disclosure: true,
    retentionDays: 180,
  },
  features: {
    guidedFlows: false,
    sourceRequired: false,
    hitlRequired: true, // Verpflichtend
    toolCallsEnabled: false, // Nicht erlaubt
    visionEnabled: false,
    webChat: true,
    phone: false,
    whatsapp: true,
  }
}
```

**Features**:
- Script-basierte Inhalte
- Human-in-the-Loop verpflichtend
- Keine Tool-Calls
- Draft → Review → Publish

### Health/Finance Profile

**Konfiguration**:
```typescript
{
  market: "health",
  mode: "regulated",
  providers: {
    llm: "wattweiser",
    rag: "wattweiser",
    // ...
  },
  compliance: {
    gdpr: true,
    aiAct: true,
    disclosure: true,
    retentionDays: 730, // 2 Jahre
  },
  features: {
    guidedFlows: true,
    sourceRequired: true,
    hitlRequired: true, // Verpflichtend
    toolCallsEnabled: false, // Nicht erlaubt
    visionEnabled: false,
    webChat: true,
    phone: true,
    whatsapp: false,
  }
}
```

**Features**:
- Starke Eskalation
- Human-in-the-Loop verpflichtend
- Längere Retention (2 Jahre)
- Stark eingeschränkte Autonomie

## Feature-Flags

### Verwendung

```typescript
import { FeatureFlagsService } from '@wattweiser/core';

constructor(private readonly featureFlags: FeatureFlagsService) {}

async handleRequest(tenantId: string) {
  // Feature prüfen
  const enabled = await this.featureFlags.isEnabled(tenantId, 'toolCallsEnabled');
  
  if (enabled) {
    // Tool-Call ausführen
  } else {
    // Alternative Logik
  }
  
  // Feature erforderlich (wirft Error wenn nicht aktiviert)
  await this.featureFlags.requireFeature(tenantId, 'sourceRequired');
}
```

### Guards/Middleware

```typescript
@UseGuards(FeatureGuard('toolCallsEnabled'))
@Post('tools/execute')
async executeTool() {
  // Tool wird nur ausgeführt wenn Feature aktiviert ist
}
```

## Profile-Validierung

Profile werden durch Validatoren geprüft:

- **EnterpriseValidator** - Validiert Enterprise-Profile
- **GovValidator** - Validiert Gov-Profile
- **MediaValidator** - Validiert Media-Profile
- **HealthValidator** - Validiert Health/Finance-Profile

## Datenbank-Integration

Profile werden in der Datenbank gespeichert:

```prisma
model TenantProfile {
  id          String   @id @default(uuid())
  tenantId    String   @unique
  market      String
  mode        String
  providers   Json
  compliance  Json
  features    Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Caching

Profile werden gecacht für bessere Performance:

- Cache-TTL: 1 Stunde (konfigurierbar)
- Automatische Invalidierung bei Updates
- Manuelle Cache-Invalidierung möglich

## Weiterführende Dokumentation

- [Core Platform Dokumentation](./WATTOS_V2_CORE_PLATFORM.md)
- [Profile-Typen](../packages/core/src/profiles/types.ts)
- [Feature-Flags Service](../packages/core/src/profiles/feature-flags.service.ts)

