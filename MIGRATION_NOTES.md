# Migration Notes - MVP Models

## Status
✅ Migration SQL erstellt: `packages/db/migrations/20250122000000_add_mvp_models/migration.sql`
⚠️ Prisma Schema erweitert, aber Migration noch nicht ausgeführt

## Prisma 7 Kompatibilität
Das Projekt verwendet Prisma 6, aber `npx prisma format` hat Prisma 7 installiert.
Für die Migration sollte Prisma 6 verwendet werden:

```bash
cd packages/db
npx prisma@6 format
npx prisma@6 migrate dev --name add_mvp_models
```

## Manuelle Migration (Alternative)
Falls Prisma-Migration nicht funktioniert, kann die SQL-Datei direkt ausgeführt werden:

```bash
psql $DATABASE_URL -f packages/db/migrations/20250122000000_add_mvp_models/migration.sql
```

## Neue Models
- `Source` - Quellen für Crawling
- `Crawl` - Crawl-Jobs mit Status
- `Event` - Events für Metrics (Visemes, TTS, Errors, KPIs)
- `Config` - No-Code Tenant-Config
- `Index` - RAG-Index Statistiken

## Erweiterte Models
- `Conversation` - `sessionId`, `userAgent`, `startedAt` hinzugefügt
- `ConversationMessage` - `latencyMs`, `sourcesJsonb` hinzugefügt
- `Artifact` - `tenantId`, `hash` hinzugefügt, `characterId` optional gemacht



