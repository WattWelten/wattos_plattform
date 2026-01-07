# Contributing to WattOS Plattform

Vielen Dank für Ihr Interesse an der WattOS Plattform! Wir freuen uns über Beiträge.

## Code of Conduct

Dieses Projekt folgt einem Code of Conduct. Durch die Teilnahme stimmen Sie zu, diesen einzuhalten. Siehe [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Wie kann ich beitragen?

### Bug Reports

Wenn Sie einen Bug gefunden haben:

1. Prüfen Sie, ob der Bug bereits in den Issues existiert
2. Erstellen Sie ein neues Issue mit:
   - Klarer Beschreibung des Problems
   - Schritten zur Reproduktion
   - Erwartetem vs. tatsächlichem Verhalten
   - Umgebung (OS, Node.js Version, etc.)
   - Screenshots (wenn relevant)

### Feature Requests

Für neue Features:

1. Prüfen Sie, ob das Feature bereits vorgeschlagen wurde
2. Erstellen Sie ein Issue mit:
   - Klarer Beschreibung des Features
   - Use Case / Motivation
   - Mögliche Implementierung (wenn vorhanden)

### Pull Requests

1. **Fork** das Repository
2. **Clone** Ihren Fork: `git clone https://github.com/YOUR_USERNAME/wattos_plattform.git`
3. **Erstellen** Sie einen Feature-Branch: `git checkout -b feature/amazing-feature`
4. **Installieren** Sie Dependencies: `pnpm install`
5. **Machen** Sie Ihre Änderungen
6. **Testen** Sie Ihre Änderungen: `pnpm test`
7. **Linten** Sie Ihren Code: `pnpm lint`
8. **Type-Check**: `pnpm type-check`
9. **Committen** Sie mit Conventional Commits: `git commit -m 'feat: Add amazing feature'`
10. **Pushen** Sie zum Branch: `git push origin feature/amazing-feature`
11. **Öffnen** Sie einen Pull Request

## Development Setup

### Voraussetzungen

- Node.js >= 20.9.0
- pnpm >= 9.0.0
- PostgreSQL 16+ (mit pgvector)
- Redis 7+

### Setup

```bash
# Repository klonen
git clone https://github.com/WattWelten/wattos_plattform.git
cd wattos_plattform

# Dependencies installieren
pnpm install

# Environment Variables konfigurieren
cp .env.example .env
# .env Datei bearbeiten

# Datenbank-Migrationen ausführen
pnpm db:migrate

# Entwicklungsserver starten
pnpm dev
```

## Coding Standards

### Conventional Commits

Wir verwenden [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code style changes (formatting)
refactor: Code refactoring
test: Add or update tests
chore: Maintenance tasks
```

### TypeScript

- **Strict Mode**: Aktiviert
- **Type Safety**: Alle Typen müssen explizit definiert sein
- **No `any`**: Vermeiden Sie `any`, verwenden Sie spezifische Typen

### Code Style

- **ESLint**: Code muss ESLint-Regeln erfüllen
- **Prettier**: Code wird automatisch formatiert
- **Imports**: Sortiert und gruppiert

### Testing

- **Unit Tests**: Für alle neuen Features
- **Integration Tests**: Für API-Endpoints
- **E2E Tests**: Für kritische User-Flows
- **Coverage**: Mindestens 80% Code-Coverage

### Dokumentation

- **JSDoc**: Für alle öffentlichen Funktionen
- **README**: Aktualisieren bei Änderungen
- **Comments**: Komplexe Logik kommentieren

## Pull Request Process

1. **Beschreibung**: Klare Beschreibung der Änderungen
2. **Tests**: Alle Tests müssen grün sein
3. **Linting**: Code muss Lint-Checks bestehen
4. **Type-Check**: TypeScript muss ohne Fehler kompilieren
5. **Dokumentation**: README/Docs aktualisieren (wenn nötig)
6. **Commits**: Klare, beschreibende Commit-Messages

### PR Template

```markdown
## Beschreibung
Kurze Beschreibung der Änderungen

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit Tests hinzugefügt/aktualisiert
- [ ] Integration Tests hinzugefügt/aktualisiert
- [ ] E2E Tests hinzugefügt/aktualisiert
- [ ] Manuell getestet

## Checklist
- [ ] Code folgt den Style-Richtlinien
- [ ] Self-review durchgeführt
- [ ] Kommentare für komplexe Code-Stellen hinzugefügt
- [ ] Dokumentation aktualisiert
- [ ] Keine neuen Warnings
- [ ] Tests hinzugefügt und bestehen
- [ ] Type-Check erfolgreich
```

## Code Review

- Reviews werden innerhalb von 2 Werktagen durchgeführt
- Constructive Feedback wird geschätzt
- Fragen sind willkommen

## Fragen?

- Öffnen Sie ein Issue mit dem Label `question`
- Kontaktieren Sie die Maintainer

## Danksagungen

Vielen Dank an alle Contributors! 🎉









