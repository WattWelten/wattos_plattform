# Log-Analyse Plan: GitHub Actions & Railway

## Übersicht

Dieses Dokument beschreibt den strukturierten Plan zur Analyse von GitHub Actions und Railway Logs für intelligente Fehlerbehebung.

## Ziele

1. **Automatische Log-Sammlung** von GitHub Actions und Railway
2. **Intelligente Fehlererkennung** mit Pattern-Matching
3. **Automatische Lösungsvorschläge** basierend auf Fehlermustern
4. **Priorisierung** von kritischen Fehlern
5. **Trend-Analyse** für proaktive Problembehebung

## Analyse-Phasen

### Phase 1: Log-Sammlung

#### GitHub Actions Logs
- **Workflow-Runs** sammeln (letzte 24h, 7 Tage, 30 Tage)
- **Job-Logs** extrahieren (validate, deploy, health-check)
- **Step-Logs** analysieren (Build, Test, Deploy)
- **Artifacts** sammeln (Configs, Reports)

#### Railway Logs
- **Service-Logs** für alle 18 Services
- **Build-Logs** für fehlgeschlagene Deployments
- **Runtime-Logs** für laufende Services
- **Error-Logs** mit Stack-Traces

### Phase 2: Fehler-Kategorisierung

#### Kategorie A: Kritische Fehler (Sofortige Behebung)
- **Build-Fehler**: Compilation, Dependency-Installation
- **Start-Fehler**: Port-Konflikte, Missing ENV-Vars
- **Health-Check-Fehler**: Service nicht erreichbar
- **Database-Fehler**: Connection-Fehler, Migration-Fehler

#### Kategorie B: Warnungen (Überwachung)
- **Performance-Warnungen**: Langsame Response-Times
- **Deprecation-Warnungen**: Veraltete APIs
- **Resource-Warnungen**: Memory, CPU-Limits
- **Network-Warnungen**: Timeouts, Connection-Errors

#### Kategorie C: Informational (Dokumentation)
- **Deployment-Info**: Erfolgreiche Deployments
- **Health-Status**: Service-Status-Updates
- **Metrics**: Performance-Metriken

### Phase 3: Pattern-Matching

#### Bekannte Fehlermuster

1. **Build-Fehler**
   - Pattern: `npm ERR`, `pnpm ERR`, `build failed`, `compilation error`
   - Ursachen: Dependency-Konflikte, TypeScript-Fehler, Missing Files
   - Lösung: Dependency-Update, Type-Check, File-Check

2. **Environment-Variable-Fehler**
   - Pattern: `undefined`, `missing`, `required`, `env var not set`
   - Ursachen: Fehlende ENV-Vars, Falsche Werte
   - Lösung: ENV-Var-Validierung, Default-Werte

3. **Port-Konflikte**
   - Pattern: `port already in use`, `EADDRINUSE`, `bind error`
   - Ursachen: Mehrere Instanzen, Falsche Port-Konfiguration
   - Lösung: Port-Validierung, Service-Isolation

4. **Database-Fehler**
   - Pattern: `connection refused`, `ECONNREFUSED`, `migration failed`
   - Ursachen: DB nicht erreichbar, Migration-Fehler
   - Lösung: DB-Health-Check, Migration-Rollback

5. **Service-Discovery-Fehler**
   - Pattern: `service not found`, `URL not found`, `connection timeout`
   - Ursachen: Service nicht deployed, Falsche URL
   - Lösung: Service-URL-Sync, Health-Check

6. **Memory/Resource-Fehler**
   - Pattern: `out of memory`, `OOM`, `memory limit exceeded`
   - Ursachen: Zu wenig Memory, Memory-Leak
   - Lösung: Memory-Limit-Erhöhung, Code-Optimierung

### Phase 4: Intelligente Lösungsvorschläge

#### Automatische Lösungen
- **ENV-Var-Fehler**: Vorschlag für fehlende Variablen
- **Dependency-Fehler**: Vorschlag für Package-Updates
- **Config-Fehler**: Vorschlag für Config-Korrekturen

#### Manuelle Lösungen
- **Komplexe Fehler**: Schritt-für-Schritt-Anleitung
- **Infrastructure-Fehler**: Railway-Dashboard-Checks
- **Code-Fehler**: Code-Review-Empfehlungen

### Phase 5: Reporting

#### Report-Formate
- **Markdown-Report**: Für Dokumentation
- **JSON-Report**: Für Automatisierung
- **HTML-Dashboard**: Für Visualisierung
- **GitHub-Issue**: Für kritische Fehler

#### Report-Inhalte
- **Zusammenfassung**: Fehler-Statistiken
- **Kategorisierung**: Nach Service, Fehlertyp
- **Lösungsvorschläge**: Automatisch und manuell
- **Trend-Analyse**: Fehler über Zeit
- **Priorisierung**: Kritische vs. Warnungen

## Implementierung

### Scripts

1. **`scripts/analyze-logs-intelligent.sh`**
   - Haupt-Script für Log-Analyse
   - Sammelt GitHub Actions und Railway Logs
   - Führt Pattern-Matching durch
   - Generiert Lösungsvorschläge

2. **`scripts/collect-github-logs.sh`**
   - Sammelt GitHub Actions Workflow-Logs
   - Extrahiert Job- und Step-Logs
   - Speichert in strukturiertem Format

3. **`scripts/collect-railway-logs.sh`**
   - Sammelt Railway Service-Logs
   - Extrahiert Build- und Runtime-Logs
   - Speichert nach Service getrennt

4. **`scripts/detect-error-patterns.sh`**
   - Pattern-Matching für bekannte Fehler
   - Kategorisiert Fehler
   - Priorisiert nach Schweregrad

5. **`scripts/generate-solutions.sh`**
   - Generiert Lösungsvorschläge
   - Erstellt Fix-Scripts
   - Dokumentiert Lösungen

### GitHub Actions Workflow

Erweitere `.github/workflows/monitor.yml`:
- Automatische Log-Sammlung nach jedem Deployment
- Tägliche Analyse-Reports
- Automatische Issue-Erstellung bei kritischen Fehlern

## Verwendung

### Manuelle Analyse

```bash
# Vollständige Analyse
./scripts/analyze-logs-intelligent.sh

# Nur GitHub Actions Logs
./scripts/collect-github-logs.sh
./scripts/analyze-logs-intelligent.sh --source github

# Nur Railway Logs
./scripts/collect-railway-logs.sh
./scripts/analyze-logs-intelligent.sh --source railway

# Spezifischer Service
./scripts/analyze-logs-intelligent.sh --service api-gateway
```

### Automatische Analyse

- Läuft automatisch nach jedem Deployment
- Tägliche Reports via GitHub Issues
- Kritische Fehler triggern Alerts

## Erfolgskriterien

- ✅ Alle Logs werden automatisch gesammelt
- ✅ Fehler werden korrekt kategorisiert
- ✅ Lösungsvorschläge sind präzise und umsetzbar
- ✅ Reports sind klar und verständlich
- ✅ Kritische Fehler werden sofort erkannt

## Nächste Schritte

1. Implementiere `analyze-logs-intelligent.sh`
2. Erweitere Pattern-Matching
3. Integriere in GitHub Actions Workflow
4. Erstelle Dashboard für Visualisierung
5. Dokumentiere Fehlermuster und Lösungen






