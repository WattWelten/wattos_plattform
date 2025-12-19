# Projektplan-Management

## Übersicht

Dieses Verzeichnis enthält alle Projektpläne für WattOS V2. Der Projektplan ist die **"Source of Truth"** für alle Entwicklungsaktivitäten.

## Plan-Struktur

```
.cursor/plans/
  ├── README.md                    # Diese Datei
  ├── wattos_v2_main.plan.md      # Haupt-Projektplan
  ├── architecture.plan.md          # Architektur-Details
  ├── implementation.plan.md        # Implementierungs-Details
  └── CHANGELOG.md                 # Plan-Änderungs-Log
```

## Plan-Philosophie

**Kernprinzipien**:
1. **Niemals den Plan verlassen** - Alle Änderungen müssen im Plan dokumentiert sein
2. **Immer sichern** - Plan-Updates werden automatisch gesichert
3. **Immer dokumentieren** - Jede Code-Änderung muss im Plan reflektiert sein
4. **Sauberer Senior Dev Code** - Code-Qualitäts-Standards werden strikt eingehalten

## Workflow

### Plan-Update-Workflow

**Vor jeder Code-Änderung**:
1. Plan lesen und verstehen
2. Geplante Änderung im Plan dokumentieren
3. Plan aktualisieren (wenn nötig)
4. Plan sichern (Git Commit)
5. Code-Änderung implementieren
6. Plan mit tatsächlicher Implementierung synchronisieren

**Nach jeder Code-Änderung**:
1. Plan mit Implementierung abgleichen
2. Dokumentation aktualisieren
3. Changelog aktualisieren
4. Plan sichern

### Changelog-Format

```markdown
## [YYYY-MM-DD] - Feature/Änderung
- Beschreibung der Änderung
- Betroffene Dateien/Module
- Breaking Changes (falls vorhanden)
```

## Automatische Sicherung

Plan-Updates werden automatisch zu `https://github.com/WattWelten/projekt-blaupause` gesichert über GitHub Actions.

## Validierung

Pre-Commit Hooks prüfen automatisch:
- Plan-Konformität
- Changelog-Aktualisierung
- Dokumentation

## Weiterführende Dokumentation

- [Haupt-Projektplan](./wattos_v2_main.plan.md)
- [Architektur-Details](./architecture.plan.md)
- [Implementierungs-Details](./implementation.plan.md)
- [Changelog](./CHANGELOG.md)

