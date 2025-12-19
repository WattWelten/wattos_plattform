# Code Review Guidelines

## Übersicht

Diese Richtlinien helfen bei Code Reviews für die WattOS KI Plattform. Ziel ist es, Code-Qualität sicherzustellen und Wissen zu teilen.

## Review-Kriterien

### 1. Code-Qualität

- **TypeScript:** Keine Type-Fehler
- **ESLint:** Keine Errors, Warnings minimiert
- **Prettier:** Konsistente Formatierung
- **Complexity:** Funktionen nicht zu komplex
- **File Size:** Dateien nicht zu groß

### 2. Funktionalität

- **Korrekt:** Code macht was er soll
- **Vollständig:** Alle Edge Cases behandelt
- **Getestet:** Tests vorhanden und aussagekräftig
- **Dokumentiert:** Code ist verständlich

### 3. Architektur

- **Plattformweites Denken:** Änderungen passen zur Architektur
- **Service-Abhängigkeiten:** Korrekt berücksichtigt
- **Breaking Changes:** Vermieden oder dokumentiert
- **Performance:** Keine Performance-Regressionen

### 4. Sicherheit

- **Secrets:** Keine hardcodierten Secrets
- **Input Validation:** Alle Inputs validiert
- **Error Handling:** Robuste Fehlerbehandlung
- **Dependencies:** Keine bekannten Vulnerabilities

## Review-Prozess

### 1. Automatische Checks

- CI läuft automatisch
- Alle Tests müssen bestehen
- Code-Qualitäts-Checks müssen bestehen

### 2. Manueller Review

- **Code-Stil:** Konsistent mit Projekt-Standards
- **Logik:** Korrekt und verständlich
- **Tests:** Ausreichend und relevant
- **Dokumentation:** Ausreichend dokumentiert

### 3. Feedback

- **Konstruktiv:** Konstruktives Feedback
- **Spezifisch:** Konkrete Verbesserungsvorschläge
- **Respektvoll:** Respektvolle Kommunikation

## Checkliste für Reviewer

### Code-Qualität

- [ ] Keine TypeScript Fehler
- [ ] Keine ESLint Errors
- [ ] Code ist formatiert (Prettier)
- [ ] Keine Magic Numbers
- [ ] Keine console.log Statements
- [ ] Funktionen nicht zu komplex
- [ ] Dateien nicht zu groß

### Funktionalität

- [ ] Code macht was er soll
- [ ] Edge Cases behandelt
- [ ] Error Handling vorhanden
- [ ] Tests vorhanden und aussagekräftig

### Architektur

- [ ] Passt zur Plattform-Architektur
- [ ] Service-Abhängigkeiten korrekt
- [ ] Keine Breaking Changes (oder dokumentiert)
- [ ] Performance akzeptabel

### Sicherheit

- [ ] Keine hardcodierten Secrets
- [ ] Input Validation vorhanden
- [ ] Error Handling robust
- [ ] Dependencies sicher

### Dokumentation

- [ ] Code ist verständlich
- [ ] Komplexe Logik dokumentiert
- [ ] README aktualisiert (falls nötig)
- [ ] API-Dokumentation aktualisiert (falls nötig)

## Review-Kommentare

### Positive Kommentare

- ✅ "Gute Lösung!"
- ✅ "Sehr klar und verständlich"
- ✅ "Gute Test-Coverage"

### Verbesserungsvorschläge

- 💡 "Könnte man hier X verwenden?"
- 💡 "Wäre Y nicht besser?"
- 💡 "Könnte man das vereinfachen?"

### Kritische Kommentare

- ❌ "Das könnte zu Problem X führen"
- ❌ "Hier fehlt Error Handling"
- ❌ "Das ist ein Breaking Change"

## Approve-Kriterien

Ein PR sollte approved werden, wenn:

- ✅ Alle automatischen Checks bestehen
- ✅ Code-Qualität hoch ist
- ✅ Funktionalität korrekt ist
- ✅ Tests ausreichend sind
- ✅ Dokumentation ausreichend ist
- ✅ Keine kritischen Probleme

## Best Practices

### Für Reviewer

- **Schnell antworten:** Reviews innerhalb von 24-48 Stunden
- **Konstruktiv:** Konstruktives Feedback geben
- **Lernend:** Wissen teilen
- **Respektvoll:** Respektvolle Kommunikation

### Für Entwickler

- **Offen:** Offen für Feedback
- **Lernend:** Aus Feedback lernen
- **Proaktiv:** Fragen stellen
- **Respektvoll:** Respektvolle Kommunikation

## Weiterführende Dokumentation

- [CODE_QUALITY_STANDARDS.md](CODE_QUALITY_STANDARDS.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md)












