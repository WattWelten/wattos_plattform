# Video Service

Microservice für Video-Upload, -Speicherung und -Verwaltung.

## Features

- Video-Upload (WebM, MP4)
- Metadaten-Extraktion (FFmpeg)
- Thumbnail-Generierung
- Multi-Tenant Support
- Lokaler Storage (erweiterbar auf S3/MinIO)

## API

Siehe [Hauptdokumentation](../../docs/video-avatar-service.md#api-endpoints).

## Konfiguration

```bash
VIDEO_SERVICE_PORT=3017
VIDEO_STORAGE_TYPE=local
VIDEO_STORAGE_LOCAL_PATH=./storage/videos
VIDEO_MAX_FILE_SIZE=104857600
VIDEO_MAX_DURATION=600
```

## Entwicklung

```bash
# Service starten
pnpm dev

# Build
pnpm build

# Tests
pnpm test
```

## Abhängigkeiten

- FFmpeg (für Metadaten und Thumbnails)
- PostgreSQL (via Prisma)
- NestJS
