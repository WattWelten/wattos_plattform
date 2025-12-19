# Deployment-Guide

## Übersicht

WattOS kann auf verschiedenen Plattformen deployed werden:
- **Railway** (Empfohlen für Backend-Services)
- **Vercel** (Empfohlen für Frontend)
- **Docker Compose** (Lokale Entwicklung)
- **Kubernetes** (Production, geplant)

## Voraussetzungen

- Docker & Docker Compose (optional)
- PostgreSQL 15+ (mit pgvector Extension)
- Redis 7+
- Node.js 20+ (für lokale Entwicklung)
- pnpm 9+

## Lokale Entwicklung

### Mit Docker Compose

```bash
# Services starten
docker-compose up -d

# Migrationen ausführen
pnpm db:migrate

# Entwicklungsserver starten
pnpm dev
```

### Ohne Docker

```bash
# PostgreSQL starten
# Redis starten

# Dependencies installieren
pnpm install

# Migrationen ausführen
pnpm db:migrate

# Services starten
pnpm dev
```

## Produktions-Deployment

### Railway

1. Railway CLI installieren:
```bash
npm i -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Projekt initialisieren:
```bash
railway init
```

4. Umgebungsvariablen setzen:
```bash
railway variables set DATABASE_URL=...
railway variables set REDIS_URL=...
```

5. Deploy:
```bash
railway up
```

### Vercel (Frontend)

1. Vercel CLI installieren:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd apps/web
vercel
```

### Docker

```bash
# Build
docker-compose -f docker-compose.prod.yml build

# Start
docker-compose -f docker-compose.prod.yml up -d
```

## Umgebungsvariablen

### Erforderlich

- `DATABASE_URL`: PostgreSQL Connection String
- `REDIS_URL`: Redis Connection String
- `JWT_SECRET`: Secret für JWT-Tokens

### Optional

- `OPENAI_API_KEY`: OpenAI API Key
- `ANTHROPIC_API_KEY`: Anthropic API Key
- `AZURE_OPENAI_API_KEY`: Azure OpenAI API Key

## Monitoring

### Health Checks

- API Gateway: `http://localhost:3001/health`
- Chat Service: `http://localhost:3006/health`
- RAG Service: `http://localhost:3007/health`

### Metriken

- Admin Dashboard: `http://localhost:3000/de/admin/dashboard`

## Skalierung

### Horizontale Skalierung

Services können horizontal skaliert werden:

```bash
# Mehrere Instanzen des Chat-Services
docker-compose scale chat-service=3
```

### Database Scaling

- PostgreSQL: Read Replicas für Leseoperationen
- Redis: Redis Cluster für hohe Verfügbarkeit

## Backup & Recovery

### Database Backup

```bash
# PostgreSQL Backup
pg_dump -U user -d wattos_ki > backup.sql

# Restore
psql -U user -d wattos_ki < backup.sql
```

### Redis Backup

```bash
# Redis Backup
redis-cli BGSAVE
```

## Troubleshooting

### Services starten nicht

1. Prüfen Sie die Logs:
```bash
docker-compose logs
```

2. Prüfen Sie die Umgebungsvariablen:
```bash
railway variables
```

### Database Connection Issues

1. Prüfen Sie die `DATABASE_URL`
2. Prüfen Sie die Netzwerk-Verbindung
3. Prüfen Sie die Firewall-Regeln
