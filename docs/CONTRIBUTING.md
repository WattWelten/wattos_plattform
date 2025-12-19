# Contributing to WattOS KI Platform

## Übersicht

Vielen Dank für dein Interesse an der WattOS KI Plattform! Dieses Dokument beschreibt, wie du zur Plattform beitragen kannst.

## Code of Conduct

- Respektvolles Verhalten
- Konstruktive Kritik
- Offene Kommunikation
- Qualität vor Geschwindigkeit

## Development Setup

Siehe: [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md)

## Contribution Workflow

### 1. Fork & Clone

```bash
# Fork das Repository auf GitHub
# Dann clone deinen Fork
git clone https://github.com/YOUR_USERNAME/wattweiser-platform.git
cd wattweiser-platform
```

### 2. Branch erstellen

```bash
# Erstelle einen Feature Branch
git checkout -b feature/your-feature-name

# Oder für Bugfixes
git checkout -b fix/your-bugfix-name
```

### 3. Entwickeln

- Entwickle deine Feature/Bugfix
- Folge den Code-Qualitäts-Standards
- Schreibe Tests
- Aktualisiere Dokumentation

### 4. Pre-Commit Checks

Vor jedem Commit laufen automatisch:

- ESLint (mit Auto-Fix)
- Prettier (Auto-Format)
- TypeScript Type-Check

**Wichtig:** Commits werden blockiert, wenn Checks fehlschlagen.

### 5. Commit Message

Verwende [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug
docs: update documentation
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

**Beispiele:**
```
feat(chat): add streaming support
fix(rag): correct vector search query
docs: update deployment guide
```

### 6. Push & Pull Request

```bash
git push origin feature/your-feature-name
```

Erstelle dann einen Pull Request auf GitHub.

### 7. Code Review

- PR wird automatisch von CI getestet
- Code Review durch Maintainer
- Änderungen basierend auf Feedback

### 8. Merge

Nach erfolgreichem Review wird der PR gemerged.

## Code-Qualitäts-Standards

### Allgemeine Regeln

- **TypeScript:** Strict Mode aktiviert
- **ESLint:** Alle Regeln müssen erfüllt sein
- **Prettier:** Automatische Formatierung
- **Tests:** >80% Coverage Ziel

### Code-Style

- **Imports:** Sortiert und gruppiert
- **Magic Numbers:** Named Constants verwenden
- **Console:** Logger statt console.log
- **Complexity:** Max. 15 pro Funktion
- **File Size:** Max. 500 Zeilen

Siehe: [CODE_QUALITY_STANDARDS.md](CODE_QUALITY_STANDARDS.md)

## Testing

### Unit Tests

```bash
pnpm test:unit
```

### Integration Tests

```bash
pnpm test:integration
```

### E2E Tests

```bash
pnpm test:e2e
```

### Coverage

```bash
pnpm test:unit --coverage
```

**Ziel:** >80% Code Coverage

## Dokumentation

### Code-Dokumentation

- JSDoc für öffentliche Funktionen
- README für Services
- Inline-Kommentare für komplexe Logik

### Dokumentation aktualisieren

- README.md bei größeren Änderungen
- API-Dokumentation bei Endpoint-Änderungen
- Deployment-Dokumentation bei Config-Änderungen

## Pull Request Checklist

Vor dem Erstellen eines PRs:

- [ ] Code folgt den Qualitäts-Standards
- [ ] Alle Tests bestehen
- [ ] Code Coverage nicht reduziert
- [ ] Dokumentation aktualisiert
- [ ] Commit Messages folgen Conventional Commits
- [ ] Keine Console.log Statements
- [ ] Keine TODO/FIXME in Production-Code
- [ ] Pre-Commit Hooks bestanden

## Branch Strategy

- `main` → Production
- `develop` → Staging
- `feature/*` → Feature Branches
- `fix/*` → Bugfix Branches
- `hotfix/*` → Hotfix Branches

## Fragen?

Bei Fragen:

- Erstelle ein GitHub Issue
- Kontaktiere die Maintainer
- Siehe [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md)

## Danke!

Vielen Dank für deinen Beitrag zur WattOS KI Plattform! 🎉












