# ðŸ”„ Ãœbergabe-Prompt fÃ¼r neuen Agent

**Datum:** 2025-01-27  
**Status:** Phase 6 (Testing) in Arbeit  
**Repository:** WattOS_Plattform  
**Branch:** main (oder aktueller Feature-Branch)

---

## ðŸ“‹ Projekt-Ãœbersicht

**WattOS KI** ist eine modulare, DSGVO-konforme KI-Plattform fÃ¼r KMU, Schulen und Ã¶ffentliche Verwaltungen. Die Plattform bietet Multi-LLM-Support, RAG, Digitale Mitarbeiter (Agents) und eine vollstÃ¤ndige Admin-Konsole.

### Technologie-Stack
- **Frontend:** Next.js 14+ (React 19), TypeScript, Tailwind CSS, Radix UI, Three.js
- **Backend:** NestJS (Node.js), FastAPI (Python), PostgreSQL 16+ (mit pgvector), Redis 7+
- **Monorepo:** pnpm Workspaces + Turbo
- **CI/CD:** GitHub Actions â†’ Railway/Docker
- **Testing:** Vitest, Playwright
- **Deployment:** Docker, WSL (fÃ¼r Windows-Entwicklung)

---

## âœ… Aktueller Stand (Phasen 1-7)

### Phase 1-2: Basis-Implementierung âœ… ABGESCHLOSSEN
- âœ… Database Schema erweitert (KBArticle, F13Config, Dashboard, Widget, AlertRule, Alert, AgentSwarm, AgentCommunication, AgentTemplate, AgentReview, ScheduledTask, AgentMemory)
- âœ… Migration erstellt: 20250127000000_add_kb_articles_f13_dashboards_widgets_alerts
- âœ… Dashboard Service: CRUD fÃ¼r Dashboards und Widgets
- âœ… Admin Service: MVP-Metriken mit Feedback-Score, LLM Cost Tracking
- âœ… Agent Service: Konkrete Agent-Instanzen (ITSupportAgent, SalesAgent, MarketingAgent, LegalAgent, MeetingAgent)
- âœ… Summary Service: Chat- und Document-Summarization implementiert

### Phase 3: Frontend-Komponenten âœ… ABGESCHLOSSEN
- âœ… Dashboard Builder: Drag & Drop Widget-Layout
- âœ… Widget Library: Wiederverwendbare Widget-Komponenten
- âœ… Avatar System: Animationen und LipSync-Hooks
- âœ… Admin UI: Auto-Refresh fÃ¼r Metriken
- âœ… User Management: Edit-Dialog fÃ¼r Benutzer
- âœ… Command Palette: Keyboard-Shortcuts (Cmd/Ctrl+K)

### Phase 4: Core-Features âœ… ABGESCHLOSSEN
- âœ… Workflow Condition-Logik
- âœ… Tool Kategorie-System
- âœ… OpenSearch Client fÃ¼r RAG Service
- âœ… DMS API Calls (listDocuments, getDocument, getDocumentContent, getFolders)
- âœ… F13 Health-Check Endpoints

### Phase 5: Customer Portal âœ… ABGESCHLOSSEN
- âœ… Customer Portal API Endpoints
- âœ… Conversation Replay Komponente

### Phase 6: Testing ðŸ”„ IN ARBEIT
- âš ï¸ **AKTUELLES PROBLEM:** itest.setup.ts Fehler in packages/shared
  - **Fehler:** Error: Cannot find module '/@id/C:/cursor.ai/WattOS_Plattform/packages/shared/vitest.setup.ts'
  - **LÃ¶sung:** itest.config.ts erstellt ohne setupFiles (Datei existiert nicht)
  - **Status:** Konfiguration erstellt, Tests mÃ¼ssen erneut ausgefÃ¼hrt werden

### Phase 7: Dokumentation â³ AUSSTEHEND
- â³ Finale Code-Dokumentation
- â³ API-Dokumentation aktualisieren
- â³ README aktualisieren

---

## ðŸ› Bekannte Probleme & LÃ¶sungen

### 1. Vitest Setup-Problem
**Problem:** packages/shared referenziert nicht-existente itest.setup.ts  
**LÃ¶sung:** itest.config.ts wurde erstellt ohne setupFiles  
**NÃ¤chster Schritt:** Tests erneut ausfÃ¼hren und weitere Probleme beheben

### 2. Database Connection
**Problem:** prisma migrate dev schlÃ¤gt fehl wenn DB nicht lÃ¤uft  
**LÃ¶sung:** Migrationen manuell erstellen mit --create-only oder SQL-Dateien direkt schreiben  
**Hinweis:** FÃ¼r lokale Entwicklung PostgreSQL + pgvector Extension benÃ¶tigt

### 3. WSL/Docker Integration
**Hinweis:** FÃ¼r Builds und Tests WSL/Docker auÃŸerhalb von Cursor nutzen, um Ãœberlastung zu vermeiden  
**Scripts:** pnpm build:wsl, pnpm test:wsl, pnpm docker:build

---

## ðŸ“ NÃ¤chste Schritte (PrioritÃ¤t)

### Sofort (Phase 6 abschlieÃŸen)
1. **Tests reparieren und ausfÃ¼hren**
   `ash
   cd packages/shared
   pnpm test
   `
   - Alle Test-Fehler beheben
   - Coverage prÃ¼fen
   - Integration-Tests ausfÃ¼hren

2. **Type-Check & Lint**
   `ash
   pnpm type-check
   pnpm lint
   `

3. **Build prÃ¼fen**
   `ash
   pnpm build
   `

### Danach (Phase 7)
4. **Dokumentation aktualisieren**
   - README.md prÃ¼fen und aktualisieren
   - API-Dokumentation (OpenAPI/Swagger) aktualisieren
   - Code-Kommentare fÃ¼r neue Features

5. **Commit & Push**
   `ash
   git add .
   git commit -m "feat: Phase 6-7 Testing & Documentation abgeschlossen"
   git push
   `

### Weiter (Phase 8+)
6. **Phase 8.1: Multi-Agent Orchestrator**
   - Agent-to-Agent Kommunikation
   - Swarms implementieren
   - Task Delegation

7. **Phase 8.2-8.4:** Agent Builder, Marketplace, Learning
8. **Phase 9:** Workflow Engine, Scheduler, Event-Driven Automation
9. **Phase 10:** Vision, Audio, Document Agents
10. **Phase 11:** Memory System, Personality
11. **Phase 12:** Observability, Debugging
12. **Phase 13:** Security, Governance

---

## ðŸ› ï¸ Wichtige Dateien & Verzeichnisse

### Konfiguration
- package.json - Root package.json mit Workspace-Scripts
- 	urbo.json - Turbo Build-Konfiguration
- pnpm-workspace.yaml - pnpm Workspace-Konfiguration
- .env.example - Umgebungsvariablen Template

### Database
- packages/db/schema.prisma - Prisma Schema
- packages/db/migrations/ - Datenbank-Migrationen

### Services
- pps/services/*/src/ - Alle Backend-Services
- pps/web/src/ - Next.js Frontend
- pps/gateway/src/ - API Gateway

### Packages
- packages/shared/ - Shared Utilities
- packages/core/ - Core Business Logic
- packages/agents/ - Agent-Implementierungen
- packages/vector-store/ - Vector Store Implementierungen

### Scripts
- scripts/ - Build, Test, Deployment Scripts
- docker/ - Docker-Konfigurationen

---

## ðŸŽ¯ Entwicklungs-Richtlinien

### Code-QualitÃ¤t
- âœ… **TypeScript:** Strikte Typisierung, keine ny ohne BegrÃ¼ndung
- âœ… **Linting:** ESLint + Prettier, alle Regeln befolgen
- âœ… **Testing:** Unit-Tests fÃ¼r Services, E2E fÃ¼r kritische Flows
- âœ… **Commits:** Conventional Commits (eat:, ix:, docs:, etc.)
- âœ… **Keine Secrets:** Niemals Secrets in Code committen

### Architektur
- âœ… **ModularitÃ¤t:** Jeder Service ist eigenstÃ¤ndig deploybar
- âœ… **Microservices:** Services kommunizieren Ã¼ber HTTP/gRPC
- âœ… **Monorepo:** Shared Code in packages/, Services in pps/services/
- âœ… **DSGVO:** Alle Daten bleiben in EU, keine externen Tracking-Services

### Performance
- âœ… **Code-Splitting:** Next.js automatisch, Services lazy-loaded
- âœ… **Caching:** Redis fÃ¼r Sessions, Feature Flags, Cache
- âœ… **Database:** Indizes fÃ¼r hÃ¤ufige Queries, pgvector fÃ¼r Vektoren
- âœ… **Avatar:** KTX2+Mipmaps, Mobile ohne SSAO, moderates DOF

### Accessibility
- âœ… **WCAG AA:** Alle UI-Komponenten barrierefrei
- âœ… **Keyboard Navigation:** Command Palette, Tab-Navigation
- âœ… **Screen Reader:** Semantisches HTML, ARIA-Labels

---

## ðŸ”§ Wichtige Commands

`ash
# Dependencies installieren
pnpm install

# Entwicklung starten (alle Services)
pnpm dev

# Build (alle Packages)
pnpm build

# Tests ausfÃ¼hren
pnpm test                    # Alle Tests
pnpm test:unit              # Nur Unit-Tests
pnpm test:integration       # Integration-Tests
pnpm test:e2e              # E2E-Tests (Playwright)

# Type-Check
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Database
pnpm db:migrate            # Migrationen ausfÃ¼hren
pnpm db:generate          # Prisma Client generieren

# Docker
pnpm docker:build         # Alle Images bauen
pnpm docker:up           # Container starten
pnpm docker:down         # Container stoppen

# WSL (fÃ¼r Windows)
pnpm build:wsl           # Build in WSL
pnpm test:wsl            # Tests in WSL
`

---

## ðŸ“š Referenz-Repositories

FÃ¼r Inspiration und Best Practices (nur fÃ¼r Fortschritt, kein RÃ¼ckschritt):
- https://github.com/WattWelten/wattweiser-mvp-agent
- https://github.com/WattWelten/WattOS-AI-Chatbot-Platform
- https://github.com/WattWelten/wattos_plattform (aktuelles Repo)

---

## âš ï¸ Wichtige Hinweise

1. **Cursor-Ãœberlastung vermeiden:**
   - WSL/Docker auÃŸerhalb von Cursor nutzen
   - GroÃŸe Builds/Tests in separaten Terminals
   - Nicht zu viele gleichzeitige Tool-Calls

2. **Commits nach jeder Phase:**
   - Kleine, atomare Commits
   - Conventional Commits Format
   - Nach jeder Phase committen und pushen

3. **Fehlerbehandlung:**
   - Bei Unklarheiten fragen
   - Fehler dokumentieren
   - LÃ¶sungen in diesem Dokument aktualisieren

4. **Testing:**
   - Vor jedem Commit Tests ausfÃ¼hren
   - Type-Check muss grÃ¼n sein
   - Lint muss grÃ¼n sein
   - Build muss erfolgreich sein

---

## ðŸš€ Schnellstart fÃ¼r neuen Agent

1. **Repository klonen und Setup:**
   `ash
   git clone https://github.com/WattWelten/wattos_plattform.git
   cd wattos_plattform
   pnpm install
   cp .env.example .env
   # .env anpassen
   `

2. **Aktuellen Stand prÃ¼fen:**
   `ash
   git status
   git log --oneline -10
   `

3. **Tests ausfÃ¼hren:**
   `ash
   pnpm test
   `

4. **Mit Phase 6 fortfahren:**
   - packages/shared/vitest.config.ts prÃ¼fen
   - Tests reparieren
   - Phase 6 abschlieÃŸen
   - Phase 7 starten

---

## ðŸ“ž Support & Fragen

Bei Fragen oder Problemen:
1. Dieses Dokument prÃ¼fen
2. Code-Kommentare lesen
3. GitHub Issues prÃ¼fen
4. Bei Unklarheiten nachfragen

---

**Viel Erfolg! ðŸš€**
