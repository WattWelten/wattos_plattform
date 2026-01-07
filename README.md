> ðŸ§­ **Cursor Global Playbook aktiv** Â· Diesen Leitfaden nutzen wir als Source of Truth.
> Datei: \docs/CURSOR_GLOBAL_PLAYBOOK.md\ (oder zentral: \WattWelten/cursor.ai\).


# WattOS KI - Modulare, DSGVO-konforme KI-Plattform

[![CI](https://github.com/WattWelten/wattos_plattform/actions/workflows/ci.yml/badge.svg)](https://github.com/WattWelten/wattos_plattform/actions/workflows/ci.yml)
[![CD](https://github.com/WattWelten/wattos_plattform/actions/workflows/cd.yml/badge.svg)](https://github.com/WattWelten/wattos_plattform/actions/workflows/cd.yml)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.9.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Production Ready](https://img.shields.io/badge/status-production%20ready-success.svg)](docs/PRODUCTION_READINESS_CHECKLIST.md)

WattOS KI ist eine modulare, DSGVO-konforme KI-Plattform für kleine und mittlere Unternehmen (KMU), Schulen und öffentliche Verwaltungen. Die Plattform bietet Multi-LLM-Support, RAG (Retrieval-Augmented Generation), Digitale Mitarbeiter (Agents) und eine vollständige Admin-Konsole.

## 🚀 Features

- **Multi-LLM-Support**: OpenAI, Anthropic, Azure OpenAI, Google, Ollama
- **RAG-System**: Dokumentenbasierte Wissensräume mit Vector Stores (pgvector, OpenSearch)
- **Digitale Mitarbeiter**: Vorkonfigurierte Agenten für IT-Support, Sales, Marketing, Legal, Meetings
- **Dashboard Builder**: Low-Code Dashboard-Erstellung mit Drag & Drop Widgets
- **Widget System**: Wiederverwendbare Widgets für Metriken, Analytics, Conversations, Agents
- **Alert System**: Konfigurierbare Alert Rules und Alert Management
- **Knowledge Base**: KBArticle Management für strukturierte Wissensdatenbanken
- **F13 Integration**: F13Config für Government-Compliance
- **Cost Tracking**: Detaillierte LLM-Kosten-Tracking und Metriken
- **Agent Instanzen**: Automatische Agent-Erstellung basierend auf roleType
- **Avatar System**: 3D Avatar-Rendering mit LipSync und Animationen
- **Command Palette**: Keyboard-Shortcuts (Cmd/Ctrl+K) für schnelle Navigation
- **DSGVO-konform**: Alle Daten bleiben in der EU, vollständige Kontrolle
- **Admin-Konsole**: Nutzerverwaltung, Provider-Konfiguration, Metriken, Audit-Logs
- **i18n**: Deutsch und Englisch
- **Modulare Architektur**: Monorepo mit Turbo, Microservices mit NestJS und FastAPI
- **API Dokumentation**: OpenAPI/Swagger Integration unter `/api/docs`
- **Feature Flags**: Redis-basierte Feature Flags mit Gradual Rollout
- **CI/CD Pipeline**: Automatisiertes Deployment via GitHub Actions zu Railway
- **Monitoring & Logging**: Automatisierte Log-Analyse und Monitoring

## 📋 Voraussetzungen

- Node.js >= 20.9.0
- pnpm >= 9.0.0
- PostgreSQL 16+ (mit pgvector Extension)
- Redis 7+
- Docker & Docker Compose (optional, für Container-Deployment)

## 🛠️ Installation

```bash
# Repository klonen
git clone https://github.com/WattWelten/wattos_plattform.git
cd wattos_plattform

# Dependencies installieren (pnpm mit Turbo)
pnpm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env Datei bearbeiten und Werte anpassen
# Siehe docs/ENVIRONMENT_VARIABLES.md für vollständige Dokumentation

# Datenbank-Migrationen ausführen
pnpm db:migrate

# Type-Check ausführen (optional, aber empfohlen)
pnpm type-check

# Build testen (optional)
pnpm build

# Entwicklungsserver starten (alle Services mit Turbo)
pnpm dev

# Oder nur MVP-Services starten (schneller)
pnpm dev:mvp
```

### 🏗️ Build & Type-Check

Das Projekt verwendet Turbo 2.x mit der neuen `tasks` Syntax:

```bash
# Type-Check für alle Packages
pnpm type-check

# Build für alle Packages
pnpm build

# Build für MVP-Services nur
pnpm build:mvp
```

**Hinweis:** Die Konfigurationsdateien (`next.config`, `postcss.config`) verwenden die `.cjs` Endung für ES-Module-Kompatibilität.

## 🏗️ Projektstruktur

```
wattos_plattform/
├── apps/
│   ├── web/                      # Next.js Frontend
│   ├── gateway/                  # API Gateway (Auth, Rate-Limiting, Proxy)
│   ├── services/                 # Backend Microservices
│   │   ├── chat-service/         # Chat-Service (WebSocket/SSE)
│   │   ├── rag-service/          # RAG-Service
│   │   ├── agent-service/        # Agent-Service (LangGraph)
│   │   ├── tool-service/         # Tool-Service
│   │   ├── feedback-service/      # Feedback-Service
│   │   ├── admin-service/         # Admin-Service
│   │   ├── summary-service/       # Summary-Service
│   │   ├── avatar-service/        # Avatar-Service
│   │   ├── character-service/     # Character-Service
│   │   ├── metaverse-service/     # Metaverse-Service
│   │   ├── ingestion-service/     # Ingestion-Service (FastAPI)
│   │   ├── llm-gateway/           # LLM Gateway Service
│   │   ├── crawler-service/       # Crawler-Service
│   │   ├── customer-intelligence-service/ # Customer Intelligence Service
│   │   ├── voice-service/         # Voice-Service
│   │   ├── phone-bot-service/     # Phone Bot Service
│   │   ├── whatsapp-bot-service/  # WhatsApp Bot Service
│   │   ├── web-chat-service/      # Web Chat Service
│   │   ├── agent-generator-service/ # Agent Generator Service
│   │   ├── dashboard-service/     # Dashboard Service
│   │   ├── f13-service/           # F13 Service
│   │   ├── knowledge-enhancement-service/ # Knowledge Enhancement Service
│   │   ├── monitoring-dashboard-service/ # Monitoring Dashboard Service
│   │   ├── observability-service/ # Observability Service
│   │   ├── persona-generator-service/ # Persona Generator Service
│   │   └── widget-service/        # Widget Service
│   └── workers/                   # Background Workers
│       ├── agent-worker/          # Agent Worker
│       ├── document-worker/       # Document Worker
│       ├── crawler-scheduler/     # Crawler Scheduler
│       └── kb-sync-worker/        # Knowledge Base Sync Worker
├── packages/
│   ├── shared/                    # Shared Utilities
│   ├── agents/                    # Agent-SDK
│   ├── vector-store/              # Vector Store Abstractions
│   ├── evaluations/               # Evaluations-Harness
│   ├── core/                      # Core Package
│   ├── db/                        # Database Package
│   ├── document-processor/        # Document Processor
│   ├── config/                    # Configuration Package
│   └── addons/                    # Addons Package
├── .github/
│   ├── workflows/                 # CI/CD Workflows
│   └── dependabot.yml            # Dependency Updates
├── scripts/                       # Deployment & Utility Scripts
├── docs/                          # Dokumentation
├── infra/                         # Infrastructure Configuration
├── schemas/                       # JSON Schemas
└── reports/                       # Reports & Analysis
```

## 🔧 Konfiguration

### Umgebungsvariablen

Erstellen Sie eine `.env` Datei im Root-Verzeichnis:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wattos_plattform

# Redis
REDIS_URL=redis://localhost:6379

# API Gateway
API_GATEWAY_PORT=3001
JWT_SECRET=your-secret-key

# Services
CHAT_SERVICE_URL=http://localhost:3006
RAG_SERVICE_URL=http://localhost:3007
AGENT_SERVICE_URL=http://localhost:3008

# LLM Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

## 🚀 CI/CD & Deployment

Die Plattform verfügt über eine vollständig automatisierte CI/CD-Pipeline:

- **GitHub Actions** - Automatisches Testing, Building, Deployment
  - CI: Lint, Type Check, Unit/Integration Tests, Build, Security Audit
  - CD: Docker Image Build & Push, Staging/Production Deployment
- **Docker** - Multi-stage Builds für optimierte Container
  - Gateway, Web, Customer Portal mit standalone output
  - Health Checks, Non-root User, Security Headers
- **Railway** - Backend Services Deployment (optional)
- **Vercel** - Frontend Deployment (optional)
- **Automated Testing** - Unit, Integration, E2E Tests (Vitest, Playwright)
- **Automated Monitoring** - Log Analysis, Error Detection, Metrics
- **Observability** - Request-ID Tracking, Structured Logging (Pino), Metrics (Prometheus), OpenTelemetry (optional)

Siehe [Deployment Automation](docs/DEPLOYMENT_AUTOMATION.md) für Details.

## 🧪 Tests

```bash
# Unit Tests
pnpm test:unit

# E2E Tests
pnpm test:e2e

# Alle Tests
pnpm test
```

## 📦 Build

```bash
# Alle Packages bauen
pnpm build

# Nur Frontend bauen
cd apps/web && pnpm build
```

## 🧹 Cleanup & Wartung

Das Projekt bietet mehrere Cleanup-Scripts zur Bereinigung von Build-Artefakten, Caches und temporären Dateien:

```bash
# Umfassendes Cleanup (Build-Artefakte, Caches, Logs, Test-Artefakte)
pnpm clean:all

# pnpm Cache bereinigen (entfernt ungenutzte Pakete)
pnpm clean:cache

# Build-Artefakte entfernen (dist, .next, .turbo, etc.)
pnpm clean:build

# Standard Cleanup (nur Turbo Cleanup)
pnpm clean
```

**Was wird bereinigt:**
- Build-Artefakte: `dist/`, `build/`, `.next/`, `.turbo/`, `*.tsbuildinfo`, `*.map`
- Test-Artefakte: `playwright-report/`, `test-results/`, `coverage/`
- Caches: `.cursor/`, `.cursor-cache/`, pnpm Store
- Log-Dateien: `*.log`
- Python Cache: `__pycache__/`, `*.pyc`

**Hinweis:** Die Cleanup-Scripts sind sicher und löschen nur Build-Artefakte und Caches. Source-Code wird nicht gelöscht.

## 🚢 Deployment

Die Plattform kann mit Docker, Railway, Vercel oder anderen Cloud-Providern deployed werden.

### Docker (Empfohlen für Production)

**Lokale Entwicklung mit Docker Compose:**
```bash
cd docker
docker-compose up -d
```

**Services:**
- PostgreSQL (Port 5432)
- Redis (Port 6379)
- Gateway (Port 3001)
- Web (Port 3000)
- Customer Portal (Port 3002)

**Docker Images bauen:**
```bash
# Gateway
docker build -f docker/Dockerfile.gateway -t wattos-gateway:latest .

# Web
docker build -f docker/Dockerfile.web -t wattos-web:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api .

# Customer Portal
docker build -f docker/Dockerfile.customer-portal -t wattos-customer-portal:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api .
```

### Railway (Alternative)

Siehe [Railway Deployment Guide](./docs/DEPLOYMENT_RAILWAY.md) für detaillierte Anleitung.

**Kurzfassung:**
```bash
# Railway CLI installieren
npm i -g @railway/cli

# Login
railway login

# Services deployen (jeder Service separat)
railway service <service-name>
railway up
```

**Wichtige Services:**
- API Gateway, Chat Service, RAG Service, Agent Service, LLM Gateway
- Customer Intelligence Service, Crawler Service, Voice Service

Siehe [DEPLOYMENT_RAILWAY.md](./docs/DEPLOYMENT_RAILWAY.md) für vollständige Anleitung.

## 📚 Dokumentation

### Core Documentation

- [Architektur-Übersicht](./docs/ARCHITECTURE_OVERVIEW.md) - Detaillierte System-Architektur
- [Plattform-Übersicht](./docs/PLATFORM_OVERVIEW.md) - Umfassende Plattform-Dokumentation
- [Railway Deployment Guide](./docs/DEPLOYMENT_RAILWAY.md) - Schritt-für-Schritt Railway Deployment
- [Deployment Automation](./docs/DEPLOYMENT_AUTOMATION.md) - CI/CD Pipeline & Automatisierung
- [Secrets Setup](./docs/SECRETS_SETUP.md) - GitHub Secrets & Railway Variables
- [First Deployment](./docs/FIRST_DEPLOYMENT.md) - Schritt-für-Schritt Anleitung für erstes Deployment
- [Developer Setup](./docs/DEVELOPER_SETUP.md) - Lokale Entwicklung & Setup
- [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md) - Vollständige ENV-Variablen-Dokumentation
- [API Versioning](./docs/API_VERSIONING.md) - API Versionierungs-Strategie
- [Monitoring Dashboard](./docs/MONITORING_DASHBOARD.md) - Monitoring & Dashboard Setup
- [Runbooks](./docs/runbooks/) - Incident Response & Troubleshooting
- [Präsentation](./docs/PRESENTATION.md) - 10-seitige Plattform-Präsentation

### Quality Assurance

- [Quality Assurance](./docs/QUALITY_ASSURANCE.md) - Umfassende Qualitätssicherung
- [Code Quality Standards](./docs/CODE_QUALITY_STANDARDS.md) - Code-Qualitäts-Standards
- [TypeScript Strict Mode](./docs/TYPESCRIPT_STRICT_MODE.md) - TypeScript Konfiguration
- [Deployment Validation](./docs/DEPLOYMENT_VALIDATION.md) - Deployment-Validierung
- [Quality Metrics](./docs/QUALITY_METRICS.md) - Qualitäts-Metriken (automatisch generiert)
- [Deployment Metrics](./docs/DEPLOYMENT_METRICS.md) - Deployment-Metriken (automatisch generiert)

### Contributing

- [Contributing Guide](./docs/CONTRIBUTING.md) - Wie du beitragen kannst
- [Code Review Guidelines](./docs/CODE_REVIEW_GUIDELINES.md) - Code Review Richtlinien

### Deployment

- [Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md) - Automatisch generierte Checkliste
- [Service Dependencies](./docs/SERVICE_DEPENDENCIES.md) - Service-Abhängigkeiten
- [Deployment Audit](./docs/DEPLOYMENT_AUDIT.md) - Deployment-Dokumentation Audit

## 🤝 Beitragen

Beiträge sind willkommen! Bitte lesen Sie unseren [Contributing Guide](docs/CONTRIBUTING.md) bevor Sie einen Pull Request erstellen.

### Quick Start für Contributors

1. Fork das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'feat: Add amazing feature'`)
4. Pushen Sie zum Branch (`git push origin feature/amazing-feature`)
5. Öffnen Sie einen Pull Request

### Code Standards

- **Conventional Commits**: Verwenden Sie [Conventional Commits](https://www.conventionalcommits.org/)
- **TypeScript**: Strict Mode aktiviert
- **Tests**: Neue Features müssen Tests enthalten
- **Linting**: Code muss ESLint-Regeln erfüllen
- **Type Safety**: Alle Typen müssen explizit definiert sein

Siehe [Code Quality Standards](docs/CODE_QUALITY_STANDARDS.md) für Details.

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten

Siehe [LICENSE](LICENSE) für Details.

## 🔒 Security

Wenn Sie ein Sicherheitsproblem gefunden haben, bitte **nicht** ein öffentliches Issue erstellen. Kontaktieren Sie uns stattdessen über [SECURITY.md](SECURITY.md).

## 📊 Projekt-Status

✅ **Production Ready** - Alle Phasen (1-14) des MVP Production Readiness Plans abgeschlossen

- ✅ Phase 1-12: Core Features & Infrastructure
- ✅ Phase 13: Dokumentation
- ✅ Phase 14: Finale Optimierungen & Cleanup

Siehe [Production Readiness Checklist](docs/PRODUCTION_READINESS_CHECKLIST.md) für Details.

## 👥 Kontakt

- Website: https://www.wattweiser.com
- GitHub: https://github.com/WattWelten/wattos_plattform

