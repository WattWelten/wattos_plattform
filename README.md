# WattOS Plattform

Eine moderne, skalierbare KI-Plattform für intelligente Assistants und Knowledge Management.

## 🚀 Features

- **Multi-Tenant Architecture**: Vollständige Tenant-Isolation
- **Keycloak Integration**: Enterprise-grade Authentication & Authorization
- **RAG (Retrieval-Augmented Generation)**: Intelligente Wissensdatenbanken
- **Apple 2026 Design System**: Moderne, zugängliche UI
- **Analytics & Monitoring**: Detaillierte Einblicke in Nutzung und Performance
- **Feature Flags**: Flexible Feature-Verwaltung
- **CI/CD Pipeline**: Automatisiertes Testing und Deployment

## 📋 Voraussetzungen

- Node.js >= 20.9.0
- pnpm >= 9.0.0
- Docker & Docker Compose
- PostgreSQL 16+ mit pgvector Extension
- Redis 7+

## 🛠️ Installation

### 1. Repository klonen

```bash
git clone <repository-url>
cd WattOS_Plattform
```

### 2. Dependencies installieren

```bash
pnpm install
```

### 3. Environment-Variablen konfigurieren

Kopiere die Beispiel-Dateien:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/gateway/.env.example apps/gateway/.env
```

Bearbeite die `.env` Dateien mit deinen Werten (siehe [ENV_REFERENCE.md](./docs/ENV_REFERENCE.md)).

### 4. Infrastruktur starten

```bash
pnpm dev:stack
```

Dies startet:
- PostgreSQL mit pgvector
- Redis
- Keycloak

### 5. Datenbank-Migrationen ausführen

```bash
cd packages/db
pnpm prisma migrate deploy
```

### 6. Demo-Daten seeden (optional)

```bash
pnpm seed:dev
```

### 7. Anwendung starten

```bash
pnpm dev:mvp
```

Dies startet:
- Web App (http://localhost:3000)
- Gateway API (http://localhost:3001)
- RAG Service (http://localhost:3005)

## 📚 Dokumentation

- [Environment Variables Reference](./docs/ENV_REFERENCE.md) - Vollständige ENV-Variablen-Referenz
- [E2E Testing Guide](./docs/HOWTO_E2E.md) - Playwright E2E Testing Anleitung
- [Vector Index Strategy](./packages/db/docs/VECTOR_INDEX_STRATEGY.md) - pgvector Index-Strategie

## 🧪 Testing

### Unit & Integration Tests

```bash
pnpm test
```

### E2E Tests

```bash
pnpm e2e
```

Siehe [HOWTO_E2E.md](./docs/HOWTO_E2E.md) für Details.

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint:fix
```

## 🏗️ Projekt-Struktur

```
WattOS_Plattform/
├── apps/
│   ├── web/              # Next.js Frontend
│   ├── gateway/          # NestJS API Gateway
│   └── services/         # Microservices
├── packages/
│   ├── ui/               # Design System
│   ├── db/               # Prisma Schema & Client
│   ├── shared/           # Shared Utilities
│   └── config/           # Config Management
├── infra/                # Infrastructure as Code
├── docker/               # Docker Configs
├── docs/                 # Dokumentation
└── scripts/              # Utility Scripts
```

## 🚢 Deployment

### Production Build

```bash
pnpm build
```

### Docker

Siehe [DOCKER_BUILD.md](./docs/DOCKER_BUILD.md) für Docker-Build-Anleitung.

### CI/CD

GitHub Actions Workflows:
- **CI**: Automatisches Testing bei Push/PR
- **Build Images**: Docker-Builds für Gateway & Web
- **Deploy**: Automatisches Deployment zu Coolify

## 🔐 Security

- Keycloak für Authentication & Authorization
- JWT mit JWKS-Verification
- CORS mit Allowlist
- Rate Limiting
- Body Size Limits
- Security Headers

## 📊 Monitoring & Observability

- JSON Logging mit Request-ID
- OpenTelemetry Integration
- Sentry Error Tracking (optional)
- Health Endpoints (`/api/health`)
- Analytics Dashboard

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'feat: Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

### Commit Convention

Wir verwenden [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Neue Features
- `fix:` Bug Fixes
- `docs:` Dokumentation
- `style:` Code Style Änderungen
- `refactor:` Code Refactoring
- `test:` Tests
- `chore:` Maintenance

## 📝 License

[Lizenz-Informationen hier einfügen]

## 🙏 Credits

- Design System inspiriert von Apple's Design Language 2026
- Built with Next.js, NestJS, Prisma, PostgreSQL, Redis, Keycloak
