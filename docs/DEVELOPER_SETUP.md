# Developer Setup Guide

## Voraussetzungen

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **PostgreSQL** 15+ (mit pgvector Extension)
- **Redis** 7+
- **Git** 2.30+
- **Docker** & Docker Compose (optional)

## Repository Setup

### 1. Repository klonen

```bash
git clone https://github.com/WattWelten/wattos-ki.git
cd wattos-ki
```

### 2. Dependencies installieren

```bash
pnpm install
```

### 3. Environment Variables konfigurieren

```bash
# Kopiere .env.example zu .env (falls vorhanden)
cp .env.example .env

# Bearbeite .env und setze die erforderlichen Werte
```

**Erforderliche Environment Variables:**
- `DATABASE_URL` - PostgreSQL Connection String
- `REDIS_URL` - Redis Connection String
- `JWT_SECRET` - Secret für JWT-Tokens
- `OPENAI_API_KEY` - OpenAI API Key (optional)

Siehe `docs/ENVIRONMENT_VARIABLES.md` für vollständige Liste.

## Database Setup

### Mit Docker Compose

```bash
# Starte PostgreSQL und Redis
docker-compose up -d

# Warte bis Services bereit sind
sleep 10

# Führe Migrationen aus
pnpm db:migrate
```

### Ohne Docker

```bash
# Installiere PostgreSQL 15+ mit pgvector
# Installiere Redis 7+

# Erstelle Datenbank
createdb wattos_ki

# Führe Migrationen aus
pnpm db:migrate
```

## Entwicklung

### Lokale Entwicklung starten

```bash
# Starte alle Services
pnpm dev

# Oder einzelne Services
cd apps/services/api-gateway
pnpm dev
```

### Services

- **API Gateway**: http://localhost:3001
- **Chat Service**: http://localhost:3006
- **RAG Service**: http://localhost:3007
- **Agent Service**: http://localhost:3008
- **LLM Gateway**: http://localhost:3009
- **Frontend**: http://localhost:3000

## Testing

### Unit Tests

```bash
pnpm test:unit
```

### Integration Tests

```bash
pnpm test:integration
```

### E2E Tests

```bash
pnpm test:e2e
```

### Coverage

```bash
pnpm test:unit --coverage
```

## Code Quality

### Pre-Commit Hooks

Pre-Commit Hooks laufen automatisch vor jedem Commit:

- ESLint (mit Auto-Fix)
- Prettier (Auto-Format)
- TypeScript Type-Check
- Commit Message Validierung (Conventional Commits)

**Setup:**
```bash
# Husky wird automatisch installiert mit pnpm install
# Hooks sind bereits konfiguriert in .husky/
```

**Hooks umgehen (nur in Notfällen):**
```bash
git commit --no-verify
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm type-check
```

### Code Formatting

```bash
pnpm format
```

### Code Quality Standards

Siehe: [CODE_QUALITY_STANDARDS.md](CODE_QUALITY_STANDARDS.md)

## Debugging

### VS Code Debugging

1. Öffne VS Code
2. Gehe zu "Run and Debug"
3. Wähle "Debug API Gateway" (oder anderen Service)
4. Setze Breakpoints
5. Starte Debugging

### Logs

```bash
# Alle Services
pnpm dev

# Einzelner Service
cd apps/services/api-gateway
pnpm dev
```

## Git Workflow

### Branch Strategy

- `main` → Production
- `develop` → Staging
- `feature/*` → Feature Branches
- `hotfix/*` → Hotfix Branches

### Commit Guidelines

Verwende [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Neue Feature
fix: Bugfix
docs: Dokumentation
refactor: Refactoring
test: Tests
chore: Maintenance
```

**Wichtig:** Commit-Messages werden automatisch validiert durch Commitlint.

**Beispiele:**
```
feat(chat): add streaming support
fix(rag): correct vector search query
docs: update deployment guide
refactor(gateway): simplify proxy logic
```

**Breaking Changes:**
```
feat(api)!: change authentication method

BREAKING CHANGE: JWT tokens now require additional claims
```

### Pull Request Process

1. Erstelle Feature Branch
2. Entwickle & Committe
3. Erstelle Pull Request
4. CI läuft automatisch
5. Code Review
6. Merge zu `develop`

## Common Issues

### Dependencies installieren schlägt fehl

```bash
# Lösche node_modules und lock file
rm -rf node_modules pnpm-lock.yaml

# Installiere neu
pnpm install
```

### Database Connection Error

```bash
# Prüfe DATABASE_URL
echo $DATABASE_URL

# Prüfe PostgreSQL Status
pg_isready

# Prüfe pgvector Extension
psql -d wattos_ki -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Port bereits belegt

```bash
# Finde Prozess auf Port
lsof -i :3001

# Beende Prozess
kill -9 <PID>
```

### Redis Connection Error

```bash
# Prüfe Redis Status
redis-cli ping

# Starte Redis
redis-server
```

## Nützliche Commands

```bash
# Clean build
pnpm clean

# Build alle Services
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint

# Format
pnpm format

# Database Migration
pnpm db:migrate

# Database Generate (Prisma)
pnpm db:generate
```

## VS Code Extensions

Empfohlene Extensions (siehe `.vscode/extensions.json`):

- ESLint
- Prettier
- TypeScript
- Prisma
- Docker
- GitLens

## Weitere Ressourcen

- [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- [Environment Variables](ENVIRONMENT_VARIABLES.md)
- [Deployment Guide](DEPLOYMENT_RAILWAY.md)
- [API Documentation](api.md)

