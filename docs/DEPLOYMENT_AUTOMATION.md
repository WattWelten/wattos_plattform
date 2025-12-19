# Deployment Automation Dokumentation

## Übersicht

Diese Dokumentation beschreibt das vollständig automatisierte CI/CD-System für die WattOS KI Plattform. Alle Deployments, Tests, Migrations und Monitoring-Aufgaben sind automatisiert.

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Trigger:**
- Push zu `main`, `develop`, `staging`
- Pull Requests
- Täglich um Mitternacht (Scheduled)

**Jobs:**
1. **lint-and-test** - Linting, Type-Checking, Building, Unit Tests mit Coverage
2. **security-scan** - Trivy Vulnerability Scanner
3. **dependency-check** - Dependency Audit

**Features:**
- Matrix Build für Node.js 18 und 20
- Code Coverage Reports (Codecov)
- Build Artifacts für alle Services
- Security Scanning

### Staging Deployment (`.github/workflows/deploy-staging.yml`)

**Trigger:**
- Push zu `develop` Branch
- Manuell via `workflow_dispatch`

**Schritte:**
1. Checkout Code
2. Setup Dependencies
3. Run Tests
4. Build Services
5. Deploy zu Railway Staging
6. Health Checks
7. Smoke Tests
8. Notifications

### Production Deployment (`.github/workflows/deploy-production.yml`)

**Trigger:**
- Push von Version-Tags (`v*.*.*`)
- Manuell via `workflow_dispatch`

**Jobs:**
1. **pre-deployment-checks** - Vollständige Test-Suite
2. **migrate-database** - Database Migrations
3. **deploy-production** - Production Deployment

**Features:**
- Blue-Green Deployment Strategy
- Automatischer Rollback bei Fehlern
- Health Checks aller Services
- Smoke Tests
- Deployment Validation

### Migration Workflow (`.github/workflows/migrate.yml`)

**Trigger:**
- Vor Production Deployment
- Manuell via `workflow_dispatch`

**Features:**
- Pre-Deployment Migrations
- Migration Status Check
- Migration Verification
- Rollback bei Fehlern

### Monitoring Workflow (`.github/workflows/monitor.yml`)

**Trigger:**
- Stündlich (Scheduled)
- Täglich um Mitternacht
- Nach jedem Deployment

**Jobs:**
1. **collect-logs** - Log-Sammlung von Railway
2. **analyze-logs** - Log-Analyse und Error Detection
3. **performance-metrics** - Performance-Metriken

**Features:**
- Automatische Error Detection
- Daily Performance Reports
- GitHub Issues bei kritischen Fehlern

### Auto-Update Workflow (`.github/workflows/auto-update.yml`)

**Trigger:**
- Täglich um 2 Uhr morgens
- Dependabot Events
- Manuell

**Jobs:**
1. **update-dependencies** - Dependency Updates
2. **format-code** - Code Formatting (Prettier)
3. **update-documentation** - Dokumentation Updates

**Features:**
- Automatische Dependency Updates
- Code Formatting
- Auto-Commit mit `[skip ci]` Tag

### Frontend Deployment (`.github/workflows/deploy-frontend.yml`)

**Trigger:**
- Push zu `main` (Production)
- Pull Requests (Preview)

**Jobs:**
1. **build-and-test** - Build und Tests
2. **deploy-preview** - Preview Deployment für PRs
3. **deploy-production** - Production Deployment

**Features:**
- Automatisches Deployment zu Vercel
- Preview Deployments für PRs
- E2E Tests gegen deployed Frontend

## Scripts

### `scripts/health-check.sh`

Health Checks für alle Services.

**Usage:**
```bash
./scripts/health-check.sh [staging|production]
```

### `scripts/smoke-tests.sh`

Basis-Tests nach Deployment.

**Usage:**
```bash
./scripts/smoke-tests.sh [staging|production]
```

### `scripts/migrate.sh`

Database Migration Management.

**Usage:**
```bash
./scripts/migrate.sh [deploy|status|verify] [environment]
```

### `scripts/log-analyzer.sh`

Log-Analyse und Error Detection.

**Usage:**
```bash
./scripts/log-analyzer.sh [collect|analyze|detect-errors|report|metrics|daily-report] [log-dir]
```

### `scripts/validate-deployment.sh`

Post-Deployment Validation.

**Usage:**
```bash
./scripts/validate-deployment.sh [staging|production]
```

### `scripts/sync-service-urls.sh`

Service URL Synchronisation.

**Usage:**
```bash
./scripts/sync-service-urls.sh [staging|production]
```

### `scripts/set-env-vars.sh`

Environment Variable Management.

**Usage:**
```bash
./scripts/set-env-vars.sh [staging|production]
```

## Deployment-Strategie

### Staging
- Automatisches Deployment bei Push zu `develop`
- Keine manuelle Bestätigung erforderlich
- Schnelle Feedback-Loops

### Production
- Deployment nur bei Version-Tags (`v*.*.*`)
- Manuelle Bestätigung möglich via `workflow_dispatch`
- Vollständige Test-Suite vor Deployment
- Database Migrations vor Deployment
- Blue-Green Deployment

## Monitoring & Alerting

### Health Checks
- Alle 30 Sekunden (Railway)
- Nach jedem Deployment (GitHub Actions)
- Automatische Alerts bei Failures

### Log Analysis
- Stündliche Log-Sammlung
- Automatische Error Detection
- Daily Performance Reports

### Notifications
- GitHub Issues bei kritischen Fehlern
- Deployment Notifications
- Daily/Weekly Reports

## Rollback-Strategie

### Automatischer Rollback
- Bei Health Check Failures (>3 Services)
- Bei Error Rate >5% (5 Minuten)
- Bei Response Time >2s (p95, 5 Minuten)
- Bei Database Connection Failures

### Manueller Rollback
- Via Railway Dashboard
- Via GitHub Actions (Rollback Workflow)

## Best Practices

1. **Immer Tests vor Deployment** - Vollständige Test-Suite muss bestehen
2. **Migrations separat** - Migrations laufen vor Deployment
3. **Health Checks** - Nach jedem Deployment
4. **Smoke Tests** - Basis-Funktionalität validieren
5. **Monitoring** - Kontinuierliche Überwachung
6. **Documentation** - Alle Änderungen dokumentieren

## Troubleshooting

### Deployment schlägt fehl
1. Prüfe GitHub Actions Logs
2. Prüfe Railway Logs
3. Führe Health Checks manuell aus
4. Prüfe Environment Variables

### Migration schlägt fehl
1. Prüfe Migration Status: `./scripts/migrate.sh status production`
2. Prüfe Database Connectivity
3. Prüfe Migration Logs

### Health Checks schlagen fehl
1. Prüfe Service Logs
2. Prüfe Service URLs
3. Prüfe Environment Variables
4. Prüfe Database/Redis Connectivity












