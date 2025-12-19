# Deployment-Validierung

## Übersicht

Dieses Dokument beschreibt das Deployment-Validierungssystem der WattOS KI Plattform. Die Validierung erfolgt sowohl vor als auch nach dem Deployment.

## Pre-Deployment Validierung

### Validierungs-Scripts

#### 1. Environment Variables Validator

**Script:** `scripts/validate-env-vars.sh`

**Validierungen:**

- Vollständigkeit (required vs optional)
- Format-Validierung (URLs, Ports, etc.)
- Typ-Validierung (boolean, string, number)
- Service-spezifische Validierung

**Usage:**
```bash
./scripts/validate-env-vars.sh [staging|production]
```

#### 2. Dependencies Validator

**Script:** `scripts/validate-dependencies.sh`

**Validierungen:**

- Dependency Vulnerabilities
- Outdated Dependencies
- Lock File Sync
- Node/pnpm Version Compatibility

**Usage:**
```bash
./scripts/validate-dependencies.sh [staging|production]
```

#### 3. Service Configuration Validator

**Script:** `scripts/validate-config.sh`

**Validierungen:**

- Service-Pfade existieren
- Port-Konflikte
- Dependency-Graph Validität
- Build-Status

**Usage:**
```bash
./scripts/validate-config.sh [staging|production]
```

#### 4. Pre-Deployment Validator (Master)

**Script:** `scripts/validate-deployment.sh`

**Führt alle Pre-Deployment Checks aus:**

1. Environment Variables Validation
2. Dependencies Validation
3. Service Configuration Validation
4. Build Status Check
5. Test Status Check

**Usage:**
```bash
./scripts/validate-deployment.sh [staging|production]
```

## Post-Deployment Validierung

### Validierungen

1. **All Services Health Checks**
   - Alle Services müssen `/health` Endpoint haben
   - Alle Health Checks müssen erfolgreich sein

2. **API Endpoints Response Times**
   - Response Time < 2s (p95)
   - API Gateway erreichbar

3. **Database Connectivity**
   - PostgreSQL erreichbar
   - Migrationen erfolgreich

4. **Redis Connectivity**
   - Redis erreichbar
   - Feature Flags funktionieren

5. **Frontend-Backend Integration**
   - Frontend erreichbar
   - CORS korrekt konfiguriert

6. **WebSocket Connectivity**
   - WebSocket Endpoint erreichbar (wenn implementiert)

7. **LLM Gateway Provider Health**
   - LLM Gateway erreichbar
   - Provider Health Checks

8. **RAG Vector Store Connectivity**
   - RAG Service erreichbar
   - Vector Store funktioniert

## Environment Variables Schema

### JSON Schema

**Datei:** `schemas/env-vars.schema.json`

- Vollständige Validierung aller Environment Variables
- Typ-Validierung
- Format-Validierung (URLs, Ports, etc.)
- Required/Optional Flags

### Type-Safe Validator

**Datei:** `packages/config/src/env-validator.ts`

- Zod-basierte Validierung
- Type-Safe Environment Variable Access
- Automatische Validierung beim Service-Start

**Usage:**
```typescript
import { getEnv, getEnvVar } from '@wattweiser/config';

// Validiert automatisch beim ersten Aufruf
const env = getEnv();

// Type-safe Access
const databaseUrl = getEnvVar('DATABASE_URL');
```

## Service Dependency Graph

### Dependency Analyzer

**Script:** `scripts/analyze-service-dependencies.sh`

**Features:**

- Visual Dependency Graph (Mermaid)
- Dependency Details pro Service
- Optimale Deployment-Reihenfolge
- Zirkuläre Abhängigkeiten Detection

**Output:** `docs/SERVICE_DEPENDENCIES.md`

**Usage:**
```bash
./scripts/analyze-service-dependencies.sh
```

## Rollback-Kriterien

### Automatischer Rollback bei:

- Health Check Failures (>3 Services)
- Error Rate >5% (5 Minuten)
- Response Time >2s (p95, 5 Minuten)
- Database Connection Failures
- Critical Service Down

### Rollback-Mechanismus

1. GitHub Actions erkennt Fehler
2. Automatischer Rollback zu vorheriger Version
3. Notification an Team
4. GitHub Issue wird erstellt

## Integration in CI/CD

### Pre-Deployment

**Workflow:** `.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-production.yml`

```yaml
- name: Pre-deployment validation
  run: |
    chmod +x scripts/validate-deployment.sh || true
    ./scripts/validate-deployment.sh ${{ env.ENVIRONMENT }}
```

### Post-Deployment

```yaml
- name: Post-deployment validation
  run: |
    chmod +x scripts/validate-deployment.sh || true
    ./scripts/validate-deployment.sh ${{ env.ENVIRONMENT }}
```

## Best Practices

### 1. Immer Validierung vor Deployment

- Pre-Deployment Checks sind Pflicht
- Kein Deployment ohne erfolgreiche Validierung

### 2. Validierung nach Deployment

- Post-Deployment Checks bestätigen Erfolg
- Rollback bei Fehlern

### 3. Environment Variables

- Schema-basierte Validierung
- Type-Safe Access
- Dokumentation aller Variablen

### 4. Service Dependencies

- Dependency-Graph berücksichtigen
- Optimale Deployment-Reihenfolge
- Keine zirkulären Abhängigkeiten

## Troubleshooting

### Validierung schlägt fehl

1. **Environment Variables:**
   ```bash
   ./scripts/validate-env-vars.sh production
   ```

2. **Dependencies:**
   ```bash
   ./scripts/validate-dependencies.sh production
   ```

3. **Service Configuration:**
   ```bash
   ./scripts/validate-config.sh production
   ```

### Post-Deployment Validierung schlägt fehl

1. Prüfe Service Logs
2. Prüfe Health Check Endpoints
3. Prüfe Service URLs
4. Prüfe Database/Redis Connectivity

## Weiterführende Dokumentation

- [QUALITY_ASSURANCE.md](QUALITY_ASSURANCE.md) - Umfassende Qualitätssicherung
- [SERVICE_DEPENDENCIES.md](SERVICE_DEPENDENCIES.md) - Service-Abhängigkeiten
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Environment Variables












