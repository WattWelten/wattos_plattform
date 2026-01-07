# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

### Build-Fixes & Dev Stack Behebung (2025-01-27)

#### 🐛 Build-Fehler behoben

- ✅ **AvatarV2.tsx**: Entfernt problematischen Import `'../types/react-three-fiber-global'`
  - Typendeklarationen werden automatisch über `tsconfig.json` eingebunden
  - Behebt "Module not found" Fehler in Next.js/Turbopack Build
  - Build erfolgreich: ✓ Compiled successfully in 7.1s
  - Alle 20 statischen Seiten generiert

#### ✅ Verifikation

- ✅ TypeScript-Check erfolgreich (`tsc --noEmit`)
- ✅ Build-Test erfolgreich (`pnpm build --filter=@wattweiser/web`)
- ✅ Keine Linter-Fehler
- ✅ Keine weiteren problematischen Imports gefunden

### Code Cleanup & Refactoring (2025-01-27)

#### 🧹 Code Cleanup

- ✅ Build-Artefakte entfernt (.map, .tsbuildinfo Dateien)
- ✅ TypeScript-Konfigurationen optimiert und vereinheitlicht
- ✅ .gitignore und .dockerignore aktualisiert
- ✅ Cleanup-Skripte hinzugefügt (cleanup-wattos.ps1, cleanup-wattos-v2.ps1, cleanup-wattos-optimized.ps1)

#### 🔧 Refactoring

- ✅ Gateway Service: Auth-Module optimiert, Token-Blacklist verbessert
- ✅ LLM Gateway: Provider-Implementierungen refactored (OpenAI, Anthropic, Azure, Google)
- ✅ Agent Service: Graph Service und HITL Service verbessert
- ✅ Crawler Service: Engine und Controller optimiert
- ✅ Core Package: Channel Router, Event Bus, RAG Service refactored
- ✅ Shared Package: Cache Service, Observability Module, Resilience Services verbessert
- ✅ UI Package: Komponenten optimiert und vereinheitlicht

#### ✅ Test Updates

- ✅ Test-Setup mit Vitest konfiguriert
- ✅ Test-Mocks und Helpers aktualisiert
- ✅ Compliance-Tests erweitert (Audit Replay, Disclosure, PII Redaction, Retention Policy)
- ✅ Channel Router Tests verbessert
- ✅ Event Bus Tests aktualisiert

#### 📝 Dokumentation

- ✅ CI/CD Workflows aktualisiert
- ✅ Dependabot-Konfiguration erweitert
- ✅ Test-Dokumentation aktualisiert (TEST_EXECUTION_STATUS.md, TEST_FIXES_STRATEGY.md, TEST_IMPLEMENTATION_STATUS.md)
- ✅ Reports aktualisiert (findings.md, service-matrix.md, test-summary.md)

#### 🔄 Dependency Updates

- ✅ pnpm-lock.yaml aktualisiert
- ✅ Package.json Dateien in allen Services und Packages aktualisiert

### Phase 1-3: Basis-Implementierung (2025-01-27)

#### ✨ Neue Features

**Datenbank-Modelle (Phase 1)**
- ✅ KBArticle Model für Knowledge Base Artikel
- ✅ F13Config Model für F13-Integration
- ✅ Dashboard Model für Dashboard-Management
- ✅ Widget Model für Dashboard-Widgets
- ✅ AlertRule und Alert Models für Alert-Management
- ✅ Migration erstellt: `20250127000000_add_kb_articles_f13_dashboards_widgets_alerts`

**Backend Services (Phase 2)**
- ✅ Dashboard Service: Widget Service und Controller hinzugefügt
- ✅ Admin Service: Feedback Score Berechnung, Cost Tracking Metriken, Prompt Token Extraction
- ✅ Agent Service: Konkrete Agent-Instanzen (ITSupportAgent, SalesAgent, MarketingAgent, LegalAgent, MeetingAgent)
- ✅ Agent Service: Token Usage Extraction aus LLM-Responses
- ✅ Agent Service: Cost Tracking Integration
- ✅ Summary Service: Chat und Dokument aus DB laden implementiert

**Frontend Components (Phase 3)**
- ✅ Dashboard Builder: DashboardWidget, WidgetLibrary, DashboardLayout Komponenten
- ✅ Avatar Components: AvatarAnimations Hook, LipSync Hook mit Viseme Support
- ✅ Admin Dashboard UI: Auto-Refresh Toggle, Real-time Metrics
- ✅ User Management: UserEditDialog mit Form Validation
- ✅ Command Palette: useCommandPalette Hook mit Keyboard Shortcuts (Cmd/Ctrl+K)

#### 🔧 Verbesserungen

- Prisma Schema Formatierung verbessert
- Agent-Instanzen basierend auf roleType automatisch erstellt
- Cost Tracking Metriken im Admin Dashboard
- Real-time Dashboard Updates mit Auto-Refresh

#### 🐛 Bug Fixes

- Feedback Score Berechnung korrigiert (Durchschnitt statt Summe)
- Token Usage Extraction aus Graph Service Response
- Cost Tracking aus LLMUsage Tabelle

#### 📝 Dokumentation

- README aktualisiert mit neuen Features
- CHANGELOG erstellt

### Phase 4: Core Features & Integrations (2025-01-27)

#### ✨ Neue Features

**Workflow Engine (Phase 4.1)**
- ✅ Condition-Logik implementiert (eq, ne, gt, gte, lt, lte, contains, in, and, or, not)
- ✅ Context-basierte Condition-Evaluierung
- ✅ If/Then/Else Workflow-Steps

**Tool Registry (Phase 4.2)**
- ✅ Kategorie-System für Tools
- ✅ Tag-basierte Tool-Filterung
- ✅ Kategorie-Liste API

**Vector Store (Phase 4.3)**
- ✅ OpenSearch Client Integration
- ✅ OpenSearch URL/Username/Password Konfiguration

**DMS Integration (Phase 4.4)**
- ✅ DMS API Calls implementiert (listDocuments, getDocument, getDocumentContent, getFolders)
- ✅ DMS Health-Check Endpoint

**F13 Integration (Phase 4.5)**
- ✅ F13 Health-Check Endpoint implementiert

### Phase 5: Customer Portal & API Endpoints (2025-01-27)

#### ✨ Neue Features

**Customer Portal API (Phase 5.1)**
- ✅ Conversation Messages API Endpoint implementiert
- ✅ getConversationMessages API Call im Customer Portal
- ✅ Conversation Replay Component mit echten Daten

#### 🔧 Verbesserungen

- Admin Service: getConversationMessages Methode hinzugefügt
- Customer Portal: Conversation Replay verwendet jetzt echte API-Daten

