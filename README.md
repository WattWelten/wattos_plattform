> ðŸ§­ **Cursor Global Playbook aktiv** Â· Diesen Leitfaden nutzen wir als Source of Truth.
> Datei: \docs/CURSOR_GLOBAL_PLAYBOOK.md\ (oder zentral: \WattWelten/cursor.ai\).


# WattOS KI - Modulare, DSGVO-konforme KI-Plattform

[![CI](https://github.com/WattWelten/wattos_plattform/actions/workflows/ci.yml/badge.svg)](https://github.com/WattWelten/wattos_plattform/actions/workflows/ci.yml)

WattOS KI ist eine modulare, DSGVO-konforme KI-Plattform für kleine und mittlere Unternehmen (KMU), Schulen und öffentliche Verwaltungen. Die Plattform bietet Multi-LLM-Support, RAG (Retrieval-Augmented Generation), Digitale Mitarbeiter (Agents) und eine vollständige Admin-Konsole.

## 🚀 Features

- **Multi-LLM-Support**: OpenAI, Anthropic, Azure OpenAI, Google, Ollama
- **RAG-System**: Dokumentenbasierte Wissensräume mit Vector Stores (pgvector, OpenSearch)
- **Digitale Mitarbeiter**: Vorkonfigurierte Agenten für IT-Support, Sales, Marketing, Legal, Meetings
- **DSGVO-konform**: Alle Daten bleiben in der EU, vollständige Kontrolle
- **Admin-Konsole**: Nutzerverwaltung, Provider-Konfiguration, Metriken, Audit-Logs
- **i18n**: Deutsch und Englisch
- **Modulare Architektur**: Monorepo mit Turbo, Microservices mit NestJS und FastAPI
- **API Dokumentation**: OpenAPI/Swagger Integration unter `/api/docs`
- **Feature Flags**: Redis-basierte Feature Flags mit Gradual Rollout
- **CI/CD Pipeline**: Automatisiertes Deployment via GitHub Actions zu Railway
- **Monitoring & Logging**: Automatisierte Log-Analyse und Monitoring

## 📋 Voraussetzungen

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL 15+ (mit pgvector Extension)
- Redis 7+
- Docker & Docker Compose (optional)

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

# Entwicklungsserver starten (alle Services mit Turbo)
pnpm dev
```

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
- **Railway** - Backend Services Deployment
- **Vercel** - Frontend Deployment
- **Automated Testing** - Unit, Integration, E2E Tests
- **Automated Monitoring** - Log Analysis, Error Detection
- **Automated Rollback** - Bei Fehlern

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

## 🚢 Deployment

Die Plattform kann auf Railway, Vercel oder anderen Cloud-Providern deployed werden.

### Railway (Empfohlen)

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

Beiträge sind willkommen! Bitte erstellen Sie einen Issue oder einen Pull Request.

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten

## 👥 Kontakt

- Website: https://www.wattweiser.com
- GitHub: https://github.com/WattWelten/wattos_plattform

