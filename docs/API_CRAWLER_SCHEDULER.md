# Crawler Scheduler Worker Dokumentation

## Übersicht

Der Crawler Scheduler Worker verwaltet Cron-basierte Crawling-Jobs mit Multi-URL-Support, Incremental Crawling und Parallelisierung.

## Features

- **Tägliches Crawling um 5:00 Uhr**: Automatische Ausführung aller aktiven Jobs
- **Multi-URL-Support**: Mehrere URLs pro Job
- **Incremental Crawling**: Nur geänderte Seiten werden gecrawlt
- **Parallelisierung**: Max. 5 Jobs gleichzeitig

## Konfiguration

### Environment Variables

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CRAWLER_MAX_CONCURRENT=5
CRAWLER_SERVICE_URL=http://localhost:3015
```

### Crawl Job erstellen

```typescript
await prisma.crawlJob.create({
  data: {
    tenantId: 'tenant-id',
    characterId: 'character-id',
    urls: ['https://example.com'],
    schedule: '0 5 * * *', // Täglich um 5:00 Uhr
    config: {
      incremental: true,
    },
  },
});
```

## Cron-Jobs

### Tägliches Crawling (5:00 Uhr)
- Führt alle aktiven Jobs aus
- Parallelisiert für Performance

### Scheduled Jobs Check (alle 15 Minuten)
- Prüft auf fällige Jobs
- Führt sie automatisch aus

## Incremental Crawling

Wenn `config.incremental === true`:
- Hash-Vergleich für jede URL
- Nur geänderte Seiten werden gecrawlt
- Performance-Optimierung

## Setup

```bash
cd apps/workers/crawler-scheduler
pnpm install
pnpm dev
```


