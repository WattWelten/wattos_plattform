# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

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

