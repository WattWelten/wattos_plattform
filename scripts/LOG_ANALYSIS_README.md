# Log-Analyse Scripts - Verwendung

## Übersicht

Die Log-Analyse-Scripts ermöglichen intelligente Analyse von GitHub Actions und Railway Logs mit automatischer Fehlererkennung und Lösungsvorschlägen.

## Scripts

### 1. `analyze-logs-intelligent.sh` - Haupt-Script

Führt vollständige Log-Analyse durch mit Pattern-Matching und Lösungsvorschlägen.

**Verwendung:**
```bash
# Vollständige Analyse (GitHub Actions + Railway)
./scripts/analyze-logs-intelligent.sh [environment] [source] [service]

# Beispiele:
./scripts/analyze-logs-intelligent.sh production all
./scripts/analyze-logs-intelligent.sh production github
./scripts/analyze-logs-intelligent.sh production railway api-gateway
```

**Parameter:**
- `environment`: production, staging (Standard: production)
- `source`: all, github, railway (Standard: all)
- `service`: Optional - spezifischer Service (Standard: alle)

**Output:**
- `log-analysis-YYYYMMDD-HHMMSS/analysis-report.md` - Haupt-Report
- `log-analysis-YYYYMMDD-HHMMSS/solutions.md` - Lösungsvorschläge
- `log-analysis-YYYYMMDD-HHMMSS/errors.json` - Fehler-Details (JSON)
- `log-analysis-YYYYMMDD-HHMMSS/github/` - GitHub Actions Logs
- `log-analysis-YYYYMMDD-HHMMSS/railway/` - Railway Logs

### 2. `collect-github-logs.sh` - GitHub Actions Logs sammeln

Sammelt GitHub Actions Workflow-Logs.

**Verwendung:**
```bash
./scripts/collect-github-logs.sh [output-dir] [workflow]

# Beispiele:
./scripts/collect-github-logs.sh logs/github
./scripts/collect-github-logs.sh logs/github deploy-railway.yml
```

**Voraussetzungen:**
- GitHub CLI (`gh`) installiert
- Authentifiziert: `gh auth login`

### 3. `collect-railway-logs.sh` - Railway Logs sammeln

Sammelt Railway Service-Logs.

**Verwendung:**
```bash
./scripts/collect-railway-logs.sh [output-dir] [service]

# Beispiele:
./scripts/collect-railway-logs.sh logs/railway
./scripts/collect-railway-logs.sh logs/railway api-gateway
```

**Voraussetzungen:**
- Railway CLI installiert: `npm install -g @railway/cli`
- Authentifiziert: `railway login`

### 4. `detect-error-patterns.sh` - Fehlermuster erkennen

Erkennt Fehlermuster in einer einzelnen Log-Datei.

**Verwendung:**
```bash
./scripts/detect-error-patterns.sh <log-file> [output-file]

# Beispiel:
./scripts/detect-error-patterns.sh logs/railway/api-gateway-runtime.log patterns.json
```

## Fehlermuster

### Kritische Fehler (Sofortige Behebung)

1. **Build-Fehler**
   - `build_npm_error`: npm/pnpm Installations-Fehler
   - `build_compile_error`: TypeScript/Compilation-Fehler
   - `build_dependency_error`: Dependency-Fehler

2. **Environment-Fehler**
   - `env_missing`: Fehlende Environment-Variablen
   - `env_invalid`: Ungültige Environment-Variablen

3. **Port-Fehler**
   - `port_conflict`: Port bereits in Verwendung

4. **Database-Fehler**
   - `db_connection`: Database-Verbindungsfehler
   - `db_migration`: Migration-Fehler

5. **Memory/Resource-Fehler**
   - `memory_error`: Out of Memory
   - `resource_error`: Resource-Limits überschritten

6. **Start-Fehler**
   - `start_error`: Service-Start-Fehler

### Warnungen (Überwachung)

1. **Service-Discovery-Fehler**
   - `service_not_found`: Service nicht gefunden
   - `service_unavailable`: Service nicht verfügbar

2. **Health-Check-Fehler**
   - `health_failed`: Health-Check fehlgeschlagen

## Lösungsvorschläge

Das Script generiert automatisch Lösungsvorschläge für erkannte Fehlermuster. Diese werden in `solutions.md` gespeichert.

### Beispiel-Lösungen

**Build-Fehler:**
1. Prüfe package.json Dependencies
2. Führe aus: `npm install --legacy-peer-deps`
3. Prüfe Node.js Version (sollte 20 sein)

**Environment-Fehler:**
1. Prüfe `.railway-secrets.env` Datei
2. Setze fehlende ENV-Vars in Railway Dashboard
3. Führe aus: `./scripts/setup-railway-env-vars.sh`

**Database-Fehler:**
1. Prüfe `DATABASE_URL` env var
2. Prüfe ob PostgreSQL Service läuft
3. Teste Connection: `railway variables --service <service> | grep DATABASE_URL`

## Workflow-Integration

### GitHub Actions

Die Log-Analyse kann in GitHub Actions Workflows integriert werden:

```yaml
- name: Analyze Logs
  run: |
    chmod +x scripts/analyze-logs-intelligent.sh
    ./scripts/analyze-logs-intelligent.sh production railway
  continue-on-error: true

- name: Upload Analysis Report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: log-analysis-report
    path: log-analysis-*/
```

### Automatische Analyse

Für automatische Analyse nach jedem Deployment, siehe `.github/workflows/monitor.yml`.

## Best Practices

1. **Regelmäßige Analyse**: Führe Log-Analyse nach jedem Deployment durch
2. **Kritische Fehler priorisieren**: Beginne mit kritischen Fehlern
3. **Lösungsvorschläge befolgen**: Folge den generierten Lösungsvorschlägen
4. **Trend-Analyse**: Analysiere Logs über Zeit für proaktive Problembehebung
5. **Dokumentation**: Dokumentiere neue Fehlermuster und Lösungen

## Troubleshooting

### GitHub CLI nicht verfügbar

```bash
# macOS
brew install gh

# Linux
sudo apt-get install gh

# Windows
winget install GitHub.cli
```

### Railway CLI nicht verfügbar

```bash
npm install -g @railway/cli
```

### Authentifizierung

```bash
# GitHub
gh auth login

# Railway
railway login
```

### Script-Berechtigungen

```bash
chmod +x scripts/*.sh
```

## Nächste Schritte

1. Führe erste Analyse durch: `./scripts/analyze-logs-intelligent.sh`
2. Prüfe Report: `log-analysis-*/analysis-report.md`
3. Befolge Lösungsvorschläge: `log-analysis-*/solutions.md`
4. Integriere in CI/CD für automatische Analyse






