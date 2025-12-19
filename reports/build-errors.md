# Build Errors Report

**Erstellt:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Status

- ✅ **F13 Package:** Build erfolgreich
- ❌ **Core Package:** Build fehlgeschlagen (TypeScript-Fehler)
- ⚠️ **Web Package:** next-intl Config hinzugefügt, E2E Tests benötigen laufenden Server

## Kritische Fehler (Core Package)

### 1. Type-Fehler mit `exactOptionalPropertyTypes`
- `ReplaySession.endTime`: `number | undefined` → `number`
- `SourceCard.metadata`: `Record<string, any> | undefined` → `Record<string, unknown>`
- `Citation.url`: `string | undefined` → `string`
- `EventTrace.metadata`: `Record<string, any> | undefined` → `Record<string, any>`
- `SessionState.userId`: `string | undefined` → `string`
- `AvatarV2Response.visemes`: `number[] | undefined` → `number[]`

### 2. Fehlende Properties
- `AvatarV2ModelConfig.quality` fehlt
- `AvatarV2SceneConfig.renderSettings` fehlt
- `AvatarV2LipSyncConfig.smoothness` und `precision` fehlen
- `AvatarV2AnimationConfig.loop` fehlt

### 3. Import-Fehler
- `@wattweiser/dms` Modul nicht gefunden
- `@wattweiser/f13` Modul nicht gefunden (bereits behoben)
- `@wattweiser/avatar` Modul nicht gefunden
- `@nestjs/axios` Modul nicht gefunden
- `@nestjs/core` Modul nicht gefunden
- `@wattweiser/db` Modul nicht gefunden

### 4. Method-Fehler
- `Logger.info` existiert nicht → `Logger.log` verwenden
- `configService.get` mit Default-Werten → `??` Operator verwenden
- `StreamingService` → `TextStreamingService`
- `ASRService` → `AsrService`
- `TTSService` → `TtsService`

### 5. Event-Domain-Fehler
- `EventDomain` vs `EventDomain.INTENT` Type-Mismatch

### 6. Unused Variables
- Viele `unused` Warnings (können ignoriert werden für jetzt)

## Nächste Schritte

1. ✅ F13 Package-Fehler behoben
2. ⚠️ Core Package-Fehler beheben (priorisiert)
3. ⚠️ Web Package E2E Tests (benötigt laufenden Server)
4. ⚠️ Integration Tests (benötigt Mock-API)

## Empfehlung

**Priorität 1 (Blockierend):**
- Import-Fehler beheben (fehlende Module)
- Type-Fehler mit `exactOptionalPropertyTypes` beheben
- Fehlende Properties hinzufügen

**Priorität 2 (Wichtig):**
- Method-Renames (Logger.info → Logger.log)
- Event-Domain Type-Fixes

**Priorität 3 (Nice-to-have):**
- Unused Variables entfernen
- Code-Optimierungen

