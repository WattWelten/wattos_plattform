# WattOS Plattform

Eine moderne, skalierbare KI-Plattform für intelligente Assistants und Knowledge Management.

## 🚀 Features

- **Multi-Tenant Architecture**: Vollständige Tenant-Isolation
- **Video Avatar Service**: 3D-Avatar-Erstellung und Video-Aufnahme (HeyGen/Synthesia-ähnlich)
- **Keycloak Integration**: Enterprise-grade Authentication & Authorization mit JWKS-Verification
- **RAG (Retrieval-Augmented Generation)**: Intelligente Wissensdatenbanken mit pgvector
- **Apple 2026 Design System**: Moderne, zugängliche UI mit Bento-Dashboard
- **Analytics & Monitoring**: Detaillierte Einblicke in Nutzung und Performance
- **Feature Flags**: Flexible Feature-Verwaltung
- **CI/CD Pipeline**: Automatisiertes Testing und Deployment
- **E2E Testing**: Playwright-basierte End-to-End Tests
- **Onboarding & Guided Tours**: Benutzerfreundliche Einführung

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

**Wichtig**: Prisma 7.2.0+ erfordert eine `prisma.config.ts` Datei (bereits vorhanden).

```bash
cd packages/db
pnpm prisma migrate deploy
```

Dies erstellt:
- Multi-Tenant Schema-Erweiterungen (Enums, Modelle, Constraints)
- KPI Views für Performance-Optimierung

### 6. Demo-Daten seeden (optional)

```bash
# Standard Seeds
pnpm seed:dev

# Multi-Tenant Demo-Tenants (4 Tenants: musterlandkreis, musterschule, musterkmu, musterklinik)
pnpm seed:tenants
```

Dies erstellt:
- Demo-Tenant mit Rollen (admin, editor, viewer)
- Demo-Users
- 5 Knowledge Spaces mit Sample-Content
- Chunks für Vektor-Suche (Embeddings können später über RAG-Service generiert werden)
- **Multi-Tenant**: 4 Demo-Tenants mit Configs, Users, Spaces, Sources, Documents

### 7. Anwendung starten

#### MVP-Mode (ohne Login, für Demo/Testing)

```bash
pnpm dev:mvp
```

**Wichtig**: Für MVP-Mode müssen folgende Environment-Variablen gesetzt sein:
- `DISABLE_AUTH=true` (Gateway)
- `NEXT_PUBLIC_DISABLE_AUTH=true` (Web)

Im MVP-Mode:
- ✅ Kein Login erforderlich
- ✅ Alle Services direkt nutzbar
- ✅ Mock-User wird automatisch gesetzt
- ✅ Perfekt für Demo und Testing

#### Normal-Mode (mit Login)

```bash
pnpm dev
```

Dies startet:
- Web App (http://localhost:3000)
- Customer Portal (http://localhost:3002)
- Gateway API (http://localhost:3001)
- Avatar Service (http://localhost:3009)
- Video Service (http://localhost:3017)
- RAG Service (http://localhost:3005)
- Weitere Services (siehe `package.json`)

## 📚 Dokumentation

- [Multi-Tenant KPI System](./docs/MULTI_TENANT_KPI.md) - Multi-Tenant Analytics & KPI-System
- [Video Avatar Service - Architektur](./docs/VIDEO_AVATAR_ARCHITECTURE.md) - Video-Avatar-Service Architektur & Design
- [Video Avatar Service - Setup](./docs/VIDEO_AVATAR_SETUP.md) - Setup-Anleitung für Video-Avatar-Service
- [Environment Variables Reference](./docs/ENV_REFERENCE.md) - Vollständige ENV-Variablen-Referenz
- [E2E Testing Guide](./docs/HOWTO_E2E.md) - Playwright E2E Testing Anleitung
- [Coolify Deployment Guide](./docs/COOLIFY_DEPLOYMENT.md) - Deployment auf Hetzner via Coolify
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
