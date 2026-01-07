# Development Roadmap - Code-QualitÃ¤t & Refactoring

**Erstellt:** 2025-01-22  
**Status:** Phase 0 abgeschlossen, Phase 1 in Arbeit

## Ãœbersicht

Dieses Dokument beschreibt den strategischen Plan zur systematischen Verbesserung der Code-QualitÃ¤t, Behebung von TODOs und Optimierung der Plattform gemÃ¤ÃŸ .cursorrules.

## Baseline-Status (2025-01-22)

### TypeScript Type-Check
**Status:** âœ… **ERFOLGREICH**
- Alle 24 Tasks erfolgreich
- Keine TypeScript-Fehler gefunden
- Alle Packages kompilieren ohne Fehler

### ESLint Linting
**Status:** âŒ **FEHLER GEFUNDEN**
- **@wattweiser/customer-portal**: Invalid project directory (lint Verzeichnis fehlt)
- **@wattweiser/console**: Invalid project directory (lint Verzeichnis fehlt)
- **@wattweiser/config**: Alle Dateien ignoriert (ESLint-Konfiguration fehlt)
- **@wattweiser/web**: Warning Ã¼ber MODULE_TYPELESS_PACKAGE_JSON

**Details:**
- 7 Packages erfolgreich gelintet
- 3 Packages mit Fehlern
- 1 Package mit Warnung

### Unit Tests
**Status:** âŒ **FEHLER GEFUNDEN**
- **@wattweiser/gateway**: Keine Test-Dateien gefunden
- **@wattweiser/agents**: âœ… 9 Tests erfolgreich

**Details:**
- 8 Packages erfolgreich getestet
- 1 Package mit Fehler (keine Tests vorhanden)

### Build
**Status:** âœ… **ERFOLGREICH** (aus vorherigem Build)
- Alle 17 Tasks erfolgreich
- Alle Apps/Packages bauen erfolgreich
- Next.js Proxy-Migration erfolgreich

## Phase 0: Plan-Dokumentation âœ…

**Status:** Abgeschlossen

### DurchgefÃ¼hrte Aufgaben
1. âœ… Plan-Dokumentation erstellt (DEVELOPMENT_ROADMAP.md)
2. âœ… Baseline-Status erfasst (Type-Check, Lint, Test, Build)
3. âœ… Erfolgskriterien fÃ¼r jede Phase definiert

### NÃ¤chste Schritte
- Phase 1: Code-QualitÃ¤t sicherstellen

---

## Phase 1: Code-QualitÃ¤t sicherstellen

**Status:** In Arbeit  
**Ziel:** GemÃ¤ÃŸ .cursorrules: Typecheck â†’ Lint â†’ Test â†’ Build mÃ¼ssen grÃ¼n sein

### 1.1 TypeScript Type-Check
**Status:** âœ… Abgeschlossen
- Alle Packages ohne TypeScript-Fehler
- Keine Aktion erforderlich

### 1.2 ESLint Linting
**Status:** ðŸ”„ In Arbeit
- **Zu beheben:**
  - pps/customer-portal: Lint-Script korrigieren
  - pps/console: Lint-Script korrigieren
  - packages/config: ESLint-Konfiguration hinzufÃ¼gen
  - pps/web: "type": "module" zu package.json hinzufÃ¼gen

### 1.3 Unit Tests
**Status:** ðŸ”„ In Arbeit
- **Zu beheben:**
  - pps/gateway: Test-Dateien hinzufÃ¼gen oder Test-Script anpassen

### 1.4 Build-Verifikation
**Status:** âœ… Abgeschlossen
- Alle Packages bauen erfolgreich

### Erfolgskriterien
- âœ… pnpm type-check ohne Fehler
- ðŸ”„ pnpm lint ohne Fehler (3 Fehler zu beheben)
- ðŸ”„ pnpm test:unit alle Tests grÃ¼n (1 Fehler zu beheben)
- âœ… pnpm build alle Packages erfolgreich

---

## Phase 2: TODOs & Feature-Verbesserungen

**Status:** Ausstehend

### 2.1 Admin-Rollen-Verifikation
**Datei:** pps/web/src/proxy.ts (Zeile 34)
- TODO: Server-seitige Admin-Rollen-Verifikation implementieren
- Nutze Gateway API-Endpoint fÃ¼r RollenprÃ¼fung

### 2.2 Command Palette Actions
**Datei:** pps/web/src/components/chat/command-palette.tsx
- TODO: "Settings Ã¶ffnen" (Zeile 45)
- TODO: "WissensrÃ¤ume Ã¶ffnen" (Zeile 59)
- TODO: "Agenten Ã¶ffnen" (Zeile 73)

### 2.3 Kontaktformular
**Datei:** pps/web/src/app/kontakt/page.tsx
- TODO: Form-Submission implementieren (Zeile 16)
- Telefonnummer aktualisieren (aktuell: XXX XXX XXX)

---

## Phase 3: Uncommitted Ã„nderungen organisieren

**Status:** Ausstehend

### Zu analysierende Ã„nderungen
- pps/gateway/src/proxy/proxy.service.ts
- pps/services/crawler-service/src/main.ts
- pps/services/dashboard-service/src/main.ts
- pps/services/summary-service/src/main.ts
- pps/web/src/components/avatar/*.tsx
- pps/web/src/components/dashboard/*.tsx
- Neue Type-Definitionen (pps/web/src/types/*.d.ts)
- Neue Komponenten
- ESLint-Konfigurationen

---

## Phase 4: Performance & Best Practices

**Status:** Ausstehend

### 4.1 Performance-Optimierungen
- KTX2+Mipmaps fÃ¼r Texturen prÃ¼fen
- Code-Splitting optimieren
- Mobile-Optimierungen (SSAO, DOF)

### 4.2 Accessibility (A11y)
- WCAG AA Compliance prÃ¼fen
- ARIA-Labels ergÃ¤nzen
- Keyboard-Navigation testen

### 4.3 Security
- Zod-Guards prÃ¼fen
- XSS-Schutz validieren
- Security-Headers prÃ¼fen

### 4.4 Avatar-Optimierungen
- Avaturn T2: material.morphTargets/morphNormals aktiv
- GLB-Morph-Tracks: Keine Ãœberschreibung zur Laufzeit
- 9:16 Layout: Avatar oben, Chat unten
- DPR: Desktop â‰¤2.0, Mobile â‰¤1.5

---

## Phase 5: Finale Analyse & Status-Report

**Status:** Ausstehend

### Geplante Aufgaben
- Umfassende Status-Analyse
- Metriken-Vergleich (Vorher/Nachher)
- NÃ¤chste Schritte definieren
- PHASE_4_ANALYSIS.md erstellen

---

## Workflow pro Phase

Jede Phase folgt diesem Muster:
1. **AusfÃ¼hrung**: Aufgaben der Phase durchfÃ¼hren
2. **Testing**: Relevante Tests ausfÃ¼hren (	ype-check, lint, 	est, uild)
3. **Dokumentation**: DEVELOPMENT_ROADMAP.md aktualisieren
4. **Commit**: Conventional Commit mit klarer Message

## Erfolgs-Metriken

- **Phase 1**: 100% Type-Check, Lint, Test, Build grÃ¼n
- **Phase 2**: 100% TODOs behoben
- **Phase 3**: 100% wichtige Ã„nderungen committed
- **Phase 4**: Performance +10%, A11y WCAG AA, Security hardened
- **Phase 5**: VollstÃ¤ndige Dokumentation und Roadmap

---

## Changelog

### 2025-01-22
- âœ… Phase 0 abgeschlossen: Plan-Dokumentation erstellt
- âœ… Baseline-Status erfasst
- ðŸ”„ Phase 1 gestartet: Code-QualitÃ¤t sicherstellen
