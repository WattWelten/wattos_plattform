# Ãœbergabe-Prompt fÃ¼r neuen Agent

**Datum:** 2025-01-27 | **Status:** Phase 6 (Testing) | **Repo:** WattOS_Plattform

## Projekt-Ãœbersicht

WattOS KI - Modulare, DSGVO-konforme KI-Plattform fÃ¼r KMU, Schulen und Ã¶ffentliche Verwaltungen.

**Stack:** Next.js 14+, NestJS, FastAPI, PostgreSQL 16+ (pgvector), Redis 7+, pnpm Workspaces + Turbo

## Aktueller Stand

### Phase 1-5: ABGESCHLOSSEN
- Database Schema erweitert (KBArticle, F13Config, Dashboard, Widget, AlertRule, Alert, AgentSwarm, etc.)
- Dashboard Service: CRUD fÃ¼r Dashboards und Widgets
- Admin Service: MVP-Metriken mit Feedback-Score, LLM Cost Tracking
- Agent Service: Konkrete Agent-Instanzen (ITSupportAgent, SalesAgent, MarketingAgent, LegalAgent, MeetingAgent)
- Summary Service: Chat- und Document-Summarization
- Frontend: Dashboard Builder, Widget Library, Avatar System, Admin UI, User Management, Command Palette
- Core: Workflow Condition-Logik, Tool Kategorie-System, OpenSearch Client, DMS API Calls, F13 Health-Check
- Customer Portal: API Endpoints, Conversation Replay

### Phase 6: IN ARBEIT
- âœ… **BEHOBEN:** vitest.config.ts wurde erstellt in packages/shared
  - Datei: `packages/shared/vitest.config.ts`
  - Inhalt: Basis-Konfiguration mit globals: true und environment: 'node'
  - **NÃ¤chster Schritt:** Tests erneut ausfÃ¼hren: `cd packages/shared && pnpm test`

### Phase 7: AUSSTEHEND
- Finale Code-Dokumentation
- API-Dokumentation aktualisieren
- README aktualisieren

## Bekannte Probleme & LÃ¶sungen

1. âœ… **Vitest Setup:** `packages/shared/vitest.config.ts` wurde erstellt
   - LÃ¶sung: Konfiguration ohne setupFiles erstellt
   - Status: Bereit fÃ¼r Tests

2. **Database:** `prisma migrate dev` benÃ¶tigt laufende DB
   - LÃ¶sung: Migrationen manuell mit `--create-only` erstellen
   - Hinweis: FÃ¼r lokale Entwicklung PostgreSQL + pgvector Extension benÃ¶tigt

3. **WSL/Docker:** FÃ¼r Builds/Tests auÃŸerhalb von Cursor nutzen
   - Commands: `pnpm build:wsl`, `pnpm test:wsl`
   - Grund: Cursor-Ãœberlastung vermeiden

## NÃ¤chste Schritte (PrioritÃ¤t)

### Sofort (Phase 6 abschlieÃŸen)
1. **Tests ausfÃ¼hren:**
   ```bash
   cd packages/shared
   pnpm test
   ```
   - Alle Test-Fehler beheben
   - Coverage prÃ¼fen

2. **Type-Check:**
   ```bash
   pnpm type-check
   ```

3. **Lint:**
   ```bash
   pnpm lint
   ```

4. **Build:**
   ```bash
   pnpm build
   ```

### Danach (Phase 7)
5. **Dokumentation aktualisieren:**
   - README.md prÃ¼fen und aktualisieren
   - API-Dokumentation (OpenAPI/Swagger) aktualisieren
   - Code-Kommentare fÃ¼r neue Features

6. **Commit & Push:**
   ```bash
   git add .
   git commit -m "feat: Phase 6-7 Testing & Documentation abgeschlossen"
   git push
   ```

### Weiter (Phase 8+)
- **Phase 8:** Multi-Agent Orchestrator, Agent Builder, Marketplace, Learning
- **Phase 9:** Workflow Engine, Scheduler, Event-Driven Automation
- **Phase 10:** Vision, Audio, Document Agents
- **Phase 11:** Memory System, Personality
- **Phase 12:** Observability, Debugging
- **Phase 13:** Security, Governance

## Wichtige Commands

```bash
# Dependencies
pnpm install

# Entwicklung
pnpm dev

# Build & Tests
pnpm build
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Code-QualitÃ¤t
pnpm type-check
pnpm lint
pnpm lint:fix

# Database
pnpm db:migrate
pnpm db:generate

# Docker
pnpm docker:build
pnpm docker:up
pnpm docker:down

# WSL (fÃ¼r Windows)
pnpm build:wsl
pnpm test:wsl
```

## Entwicklungs-Richtlinien

- **TypeScript:** Strikte Typisierung, keine `any` ohne BegrÃ¼ndung
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Testing:** Unit-Tests fÃ¼r Services, E2E fÃ¼r kritische Flows
- **ModularitÃ¤t:** Jeder Service eigenstÃ¤ndig deploybar
- **DSGVO:** Alle Daten bleiben in EU
- **WCAG AA:** Barrierefreie UI-Komponenten
- **Performance:** Code-Splitting, Caching, Database-Indizes

## Wichtige Hinweise

1. **Cursor-Ãœberlastung vermeiden:**
   - WSL/Docker auÃŸerhalb von Cursor nutzen
   - GroÃŸe Builds/Tests in separaten Terminals
   - Nicht zu viele gleichzeitige Tool-Calls

2. **Commits nach jeder Phase:**
   - Kleine, atomare Commits
   - Conventional Commits Format
   - Nach jeder Phase committen und pushen

3. **Testing:**
   - Vor jedem Commit Tests ausfÃ¼hren
   - Type-Check muss grÃ¼n sein
   - Lint muss grÃ¼n sein
   - Build muss erfolgreich sein

4. **Fehlerbehandlung:**
   - Bei Unklarheiten fragen
   - Fehler dokumentieren
   - LÃ¶sungen in diesem Dokument aktualisieren

## Schnellstart fÃ¼r neuen Agent

1. **Repository klonen und Setup:**
   ```bash
   git clone https://github.com/WattWelten/wattos_plattform.git
   cd wattos_plattform
   pnpm install
   cp .env.example .env
   # .env anpassen
   ```

2. **Aktuellen Stand prÃ¼fen:**
   ```bash
   git status
   git log --oneline -10
   ```

3. **Tests ausfÃ¼hren:**
   ```bash
   pnpm test
   ```

4. **Mit Phase 6 fortfahren:**
   - `packages/shared/vitest.config.ts` prÃ¼fen (âœ… bereits erstellt)
   - Tests reparieren: `cd packages/shared && pnpm test`
   - Phase 6 abschlieÃŸen
   - Phase 7 starten

## Wichtige Dateien

- `packages/shared/vitest.config.ts` - Vitest Konfiguration (âœ… erstellt)
- `packages/db/schema.prisma` - Database Schema
- `package.json` - Root package.json mit Workspace-Scripts
- `turbo.json` - Turbo Build-Konfiguration

---

**Viel Erfolg! ðŸš€**