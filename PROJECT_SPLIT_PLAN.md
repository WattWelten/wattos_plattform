# PROJEKTAUFTEILUNG PLAN: WattOS_Plattform

**Ziel:** Monorepo in separate, verwaltbare Projekte aufteilen, um Cursor Serialization Errors zu vermeiden.

## PROBLEM

- **Aktuell:** ~91.799 Dateien in einem Monorepo
- **Cursor Limit:** ~30.000-50.000 Dateien fÃ¼r optimale Performance
- **Ergebnis:** Serialization Errors, langsame Indexierung, Timeouts

## LÃ–SUNG: PROJEKTAUFTEILUNG

### Option 1: Funktionale Aufteilung (EMPFOHLEN)

#### 1. WattOS_Core
**Pfad:** D:\cursor.ai\Projects\WattOS_Core

**EnthÃ¤lt:**
- packages/core/ - Kern-Logik
- packages/db/ - Datenbank-Schema und Migrations
- packages/shared/ - Shared Utilities
- packages/config/ - Konfiguration
- packages/ui/ - UI-Komponenten

**GeschÃ¤tzte GrÃ¶ÃŸe:** ~15.000-20.000 Dateien

**AbhÃ¤ngigkeiten:** Keine (Basis-Package)

---

#### 2. WattOS_Apps
**Pfad:** D:\cursor.ai\Projects\WattOS_Apps

**EnthÃ¤lt:**
- pps/console/ - Admin Console
- pps/web/ - Web Application
- pps/customer-portal/ - Customer Portal
- pps/gateway/ - API Gateway

**GeschÃ¤tzte GrÃ¶ÃŸe:** ~25.000-30.000 Dateien

**AbhÃ¤ngigkeiten:** WattOS_Core (als npm/pnpm Package)

---

#### 3. WattOS_Services
**Pfad:** D:\cursor.ai\Projects\WattOS_Services

**EnthÃ¤lt:**
- pps/services/ - Microservices
- pps/workers/ - Background Workers
- infra/ - Infrastructure Configs

**GeschÃ¤tzte GrÃ¶ÃŸe:** ~20.000-25.000 Dateien

**AbhÃ¤ngigkeiten:** WattOS_Core (als npm/pnpm Package)

---

#### 4. WattOS_Addons
**Pfad:** D:\cursor.ai\Projects\WattOS_Addons

**EnthÃ¤lt:**
- packages/addons/ - Alle Addons (f13, dms, etc.)
- packages/agents/ - AI Agents
- packages/characters/ - Character System
- packages/document-processor/ - Document Processing
- packages/evaluations/ - Evaluation System
- packages/metrics/ - Metrics System
- packages/vector-store/ - Vector Store

**GeschÃ¤tzte GrÃ¶ÃŸe:** ~20.000-25.000 Dateien

**AbhÃ¤ngigkeiten:** WattOS_Core (als npm/pnpm Package)

---

### Option 2: Minimale Aufteilung (SCHNELLER)

#### 1. WattOS_Platform_Core
**Pfad:** D:\cursor.ai\Projects\WattOS_Platform_Core

**EnthÃ¤lt:**
- Alle packages/
- pps/gateway/
- pps/services/
- pps/workers/

**GeschÃ¤tzte GrÃ¶ÃŸe:** ~50.000-60.000 Dateien

---

#### 2. WattOS_Platform_Apps
**Pfad:** D:\cursor.ai\Projects\WattOS_Platform_Apps

**EnthÃ¤lt:**
- pps/console/
- pps/web/
- pps/customer-portal/

**GeschÃ¤tzte GrÃ¶ÃŸe:** ~30.000-35.000 Dateien

---

## MIGRATION PLAN

### Phase 1: Vorbereitung

1. **Backup erstellen**
   `powershell
   # VollstÃ¤ndiges Backup
   Copy-Item "D:\cursor.ai\Projects\WattOS_Plattform" "D:\cursor.ai\Projects\WattOS_Plattform_BACKUP" -Recurse
   `

2. **Git Repository vorbereiten**
   - Neue Repositories erstellen (oder Branches)
   - Git History beibehalten (git subtree oder filter-branch)

3. **Dependencies analysieren**
   - AbhÃ¤ngigkeiten zwischen Packages/Apps dokumentieren
   - Shared Dependencies identifizieren

### Phase 2: Core Package erstellen

1. **WattOS_Core erstellen**
   `powershell
   # Neues Projekt erstellen
   New-Item -ItemType Directory -Path "D:\cursor.ai\Projects\WattOS_Core"
   
   # Packages kopieren
   Copy-Item "D:\cursor.ai\Projects\WattOS_Plattform\packages\core" "D:\cursor.ai\Projects\WattOS_Core\packages\core" -Recurse
   Copy-Item "D:\cursor.ai\Projects\WattOS_Plattform\packages\db" "D:\cursor.ai\Projects\WattOS_Core\packages\db" -Recurse
   Copy-Item "D:\cursor.ai\Projects\WattOS_Plattform\packages\shared" "D:\cursor.ai\Projects\WattOS_Core\packages\shared" -Recurse
   Copy-Item "D:\cursor.ai\Projects\WattOS_Plattform\packages\config" "D:\cursor.ai\Projects\WattOS_Core\packages\config" -Recurse
   Copy-Item "D:\cursor.ai\Projects\WattOS_Plattform\packages\ui" "D:\cursor.ai\Projects\WattOS_Core\packages\ui" -Recurse
   `

2. **Package.json anpassen**
   - Root package.json erstellen
   - Workspace-Konfiguration
   - Build-Scripts

3. **Als npm Package verÃ¶ffentlichen**
   - Lokales npm Registry oder
   - Private npm Registry oder
   - Git Submodule / pnpm Workspace

### Phase 3: Andere Projekte erstellen

1. **WattOS_Apps erstellen**
   - Apps kopieren
   - WattOS_Core als Dependency hinzufÃ¼gen
   - package.json anpassen

2. **WattOS_Services erstellen**
   - Services kopieren
   - WattOS_Core als Dependency hinzufÃ¼gen
   - package.json anpassen

3. **WattOS_Addons erstellen**
   - Addons kopieren
   - WattOS_Core als Dependency hinzufÃ¼gen
   - package.json anpassen

### Phase 4: Testing & Validation

1. **Build-Tests**
   - Jedes Projekt einzeln bauen
   - Dependencies prÃ¼fen

2. **Integration-Tests**
   - Cross-Project Dependencies testen
   - API-KompatibilitÃ¤t prÃ¼fen

3. **Cursor-Tests**
   - Jedes Projekt in Cursor Ã¶ffnen
   - Indexierung prÃ¼fen
   - Serialization Errors prÃ¼fen

## ALTERNATIVE: CURSOR WORKSPACE

Falls Aufteilung nicht mÃ¶glich ist, verwende Cursor Workspace:

### .code-workspace Datei erstellen

**Datei:** WattOS_Plattform.code-workspace

`json
{
  "folders": [
    {
      "path": ".",
      "name": "WattOS Root"
    },
    {
      "path": "packages/core",
      "name": "Core Package"
    },
    {
      "path": "packages/db",
      "name": "DB Package"
    },
    {
      "path": "packages/shared",
      "name": "Shared Package"
    },
    {
      "path": "apps/web",
      "name": "Web App"
    },
    {
      "path": "apps/console",
      "name": "Console App"
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/build": true,
      "**/.next": true,
      "**/reports": true,
      "**/.turbo": true,
      "**/logs": true,
      "**/coverage": true,
      "**/e2e-screens": true,
      "**/test-results": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/build": true,
      "**/.next": true,
      "**/reports": true,
      "**/.turbo": true
    }
  }
}
`

## EMPFEHLUNG

**Option 1 (Funktionale Aufteilung) ist empfohlen**, da:
- Jedes Projekt < 30.000 Dateien
- Klare AbhÃ¤ngigkeiten
- Bessere Wartbarkeit
- Cursor kann jedes Projekt optimal indexieren

**Option 2 (Workspace) ist schneller**, aber:
- Immer noch groÃŸes Projekt
- MÃ¶glicherweise weiterhin Serialization Errors
- Weniger klare Struktur

## NÃ„CHSTE SCHRITTE

1. **Entscheidung treffen:** Aufteilung oder Workspace?
2. **Backup erstellen:** Vor jeder Ã„nderung!
3. **Schrittweise migrieren:** Nicht alles auf einmal
4. **Testen:** Jeden Schritt validieren

## AUTOMATISIERUNG

Siehe: scripts\split-project-automated.ps1 (wird erstellt)

---

**Erstellt:** 2026-01-04 15:56:09
**Projekt:** WattOS_Plattform
**Apps gefunden:** apps, console, customer-portal, gateway, services, web, workers
**Packages gefunden:** addons, agents, characters, config, core, db, document-processor, evaluations, metrics, shared, ui, vector-store
