# Feature-Guards & Middleware Dokumentation

## Übersicht

Feature-Guards und Middleware ermöglichen es, Endpoints und Funktionalität basierend auf Tenant-Profile-Features zu steuern.

## Feature-Guards

### Verwendung

#### 1. Decorator-basiert

```typescript
import { Feature, FeatureGuard } from '@wattweiser/core';

@Controller('tools')
@UseGuards(FeatureGuard)
export class ToolsController {
  @Feature('toolCallsEnabled')
  @Post('execute')
  async executeTool() {
    // Wird nur ausgeführt wenn toolCallsEnabled aktiviert ist
  }
}
```

#### 2. Factory-basiert

```typescript
import { createFeatureGuard } from '@wattweiser/core';

@Controller('tools')
@UseGuards(createFeatureGuard('toolCallsEnabled'))
export class ToolsController {
  @Post('execute')
  async executeTool() {
    // Wird nur ausgeführt wenn toolCallsEnabled aktiviert ist
  }
}
```

#### 3. Inline Guard

```typescript
import { FeatureGuard } from '@wattweiser/core';

@Controller('admin')
export class AdminController {
  constructor(private readonly featureGuard: FeatureGuard) {}

  @Post('advanced-features')
  @UseGuards(this.featureGuard)
  async advancedFeatures() {
    // Feature wird aus Metadata extrahiert
  }
}
```

### Error-Handling

Wenn ein Feature nicht aktiviert ist, wird ein `ForbiddenException` geworfen:

```json
{
  "statusCode": 403,
  "message": "Feature 'toolCallsEnabled' is not enabled for this tenant. Please contact your administrator.",
  "error": "Forbidden"
}
```

## Feature-Middleware

### Verwendung

```typescript
import { FeatureMiddleware } from '@wattweiser/core';

@Module({
  // ...
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(FeatureMiddleware)
      .forRoutes('*');
  }
}
```

### Request-Erweiterung

Die Middleware fügt Features zum Request hinzu:

```typescript
@Get('endpoint')
async handler(@Req() req: Request) {
  const features = (req as any).features;
  const tenantId = (req as any).tenantId;

  if (features.toolCallsEnabled) {
    // Tool-Call ausführen
  }
}
```

## Best Practices

### 1. Feature-Checks in Services

```typescript
@Injectable()
export class MyService {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  async doSomething(tenantId: string) {
    const enabled = await this.featureFlags.isEnabled(tenantId, 'toolCallsEnabled');
    
    if (enabled) {
      // Feature-spezifische Logik
    } else {
      // Alternative Logik
    }
  }
}
```

### 2. Conditional Rendering im Frontend

```typescript
const features = await getFeatures(tenantId);

if (features.sourceRequired) {
  // Source Cards anzeigen
}

if (features.hitlRequired) {
  // Human-in-the-Loop UI anzeigen
}
```

### 3. Channel-Aktivierung

```typescript
@Get('channels')
async listChannels(@Req() req: Request) {
  const features = (req as any).features;
  
  const channels = [];
  if (features.webChat) channels.push('web-chat');
  if (features.phone) channels.push('phone');
  if (features.whatsapp) channels.push('whatsapp');
  
  return channels;
}
```

## Weiterführende Dokumentation

- [Profile-System](./PROFILE_SYSTEM.md)
- [Feature-Guards](../packages/core/src/profiles/guards/feature.guard.ts)
- [Feature-Middleware](../packages/core/src/profiles/middleware/feature.middleware.ts)

