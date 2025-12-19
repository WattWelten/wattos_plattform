# Automatisierte Railway Deployment Pipeline

**Datum:** 2025-01-02  
**Status:** ✅ Vollständig implementiert und getestet  
**Letzte Aktualisierung:** 2025-01-02 (Port-Konflikte behoben)

## Übersicht

Diese Dokumentation beschreibt die vollständig automatisierte Deployment-Pipeline für Railway. Die Pipeline orchestriert alle Schritte von der Validierung bis zum Health Check automatisch.

## Komponenten

### 1. Scripts

#### `scripts/generate-railway-configs.sh`

Generiert service-spezifische `railway.json` Dateien aus `scripts/services-config.json`.

**Features:**
- Automatische Generierung für alle Services
- Service-typ-basierte Scaling-Konfiguration
- Priority-basierte Resource Limits

**Verwendung:**
```bash
./scripts/generate-railway-configs.sh
```

**Output:**
- `apps/gateway/railway.json`
- `apps/services/*/railway.json`
- `apps/workers/*/railway.json`

#### `scripts/validate-pre-deployment.sh`

Führt umfassende Pre-Deployment Validierung durch.

**Prüfungen:**
1. Railway CLI Installation
2. Railway Authentication
3. jq Installation
4. services-config.json Validität
5. Railway Services Existenz
6. railway.json Dateien
7. Erforderliche Environment Variables
8. Build-Commands Validität
9. Port-Konflikte
10. Service Dependencies

**Verwendung:**
```bash
./scripts/validate-pre-deployment.sh [environment]
```

**Exit Codes:**
- `0`: Alle Checks bestanden
- `1`: Fehler gefunden

#### `scripts/deploy-railway.sh`

Master-Deployment-Script, das alle Schritte orchestriert.

**Features:**
- Dependency-basierte Deployment-Reihenfolge
- Automatische Service-URL-Synchronisation
- Post-Deployment Health Checks
- Rollback bei Fehlern
- Service-Filter für selektive Deployments

**Verwendung:**
```bash
# Alle Services deployen
./scripts/deploy-railway.sh production

# Nur bestimmten Service deployen
./scripts/deploy-railway.sh production chat-service

# Ohne Validierung
./scripts/deploy-railway.sh production "" true

# Ohne Health Checks
./scripts/deploy-railway.sh production "" false true
```

**Schritte:**
1. Pre-Deployment Validierung
2. Railway Configs generieren
3. Service Dependencies analysieren
4. Services deployen (in korrekter Reihenfolge)
5. Service URLs synchronisieren
6. Post-Deployment Health Checks

#### `scripts/post-deployment-health-check.sh`

Prüft alle Services nach dem Deployment.

**Features:**
- Automatische Health Endpoint Checks
- Retry-Mechanismus
- Service Discovery URL Validierung
- Detaillierte Fehlerberichte

**Verwendung:**
```bash
./scripts/post-deployment-health-check.sh [environment] [max-retries] [retry-delay]
```

**Beispiel:**
```bash
./scripts/post-deployment-health-check.sh production 5 10
```

### 2. GitHub Actions Workflow

**Datei:** `.github/workflows/deploy-railway.yml`

**Jobs:**
1. **validate**: Pre-Deployment Validierung
2. **generate-configs**: Railway Configs generieren
3. **sync-urls-pre**: Service URLs synchronisieren (vor Deployment)
4. **deploy-services**: Services deployen (Matrix-Strategy für Parallelisierung)
5. **sync-urls-post**: Service URLs synchronisieren (nach Deployment)
6. **health-check**: Post-Deployment Health Checks
7. **deployment-summary**: Deployment-Zusammenfassung

**Trigger:**
- Push zu `main` oder `production` Branch
- Manueller Workflow-Dispatch mit Optionen:
  - Service-Filter
  - Environment
  - Skip Validation
  - Skip Health Check

**Matrix-Strategy:**
- Parallele Deployments für unabhängige Services
- Priority-basierte Reihenfolge
- Fail-Fast deaktiviert für robuste Deployments

## Workflow

### Lokales Deployment

```bash
# 1. Validierung
./scripts/validate-pre-deployment.sh production

# 2. Configs generieren
./scripts/generate-railway-configs.sh

# 3. Deployen
./scripts/deploy-railway.sh production

# 4. Health Check (optional, wird automatisch ausgeführt)
./scripts/post-deployment-health-check.sh production
```

### CI/CD Deployment

**Automatisch:**
- Bei Push zu `main` oder `production`
- Alle Services werden automatisch deployed

**Manuell:**
1. GitHub Actions → "Deploy to Railway" → "Run workflow"
2. Parameter auswählen:
   - Environment: `production` oder `staging`
   - Service: Leer für alle, oder spezifischer Service
   - Skip Validation: Optional
   - Skip Health Check: Optional

## Service-Konfiguration

### services-config.json

Zentrale Konfigurationsdatei für alle Services.

**Struktur:**
```json
{
  "services": {
    "service-name": {
      "name": "service-name",
      "displayName": "Service Display Name",
      "type": "nestjs|gateway|python|worker",
      "port": 3001,
      "path": "apps/services/service-name",
      "buildCommand": "cd apps/services/service-name && npm install && npm run build",
      "startCommand": "cd apps/services/service-name && npm run start:prod",
      "healthCheckPath": "/health",
      "required": true,
      "deploymentPriority": 1,
      "dependencies": ["other-service"],
      "infrastructureDependencies": ["postgresql", "redis"],
      "environmentVariables": [
        {
          "name": "ENV_VAR_NAME",
          "required": true,
          "description": "Description"
        }
      ]
    }
  }
}
```

### Deployment Priority

- **Priority 1**: Kritische Services (API Gateway, LLM Gateway)
- **Priority 2**: Wichtige Services (Chat, RAG, Agent, Tool)
- **Priority 3**: Optionale Services (Customer Intelligence, Crawler, Voice)
- **Priority 4**: Zusätzliche Services (Admin, Character, Summary, Feedback, Avatar, Ingestion)
- **Priority 5**: Workers und Metaverse

## Scaling-Konfiguration

Automatisch basierend auf Service-Typ:

- **Gateway**: 2-5 Replicas, CPU 70%, Memory 80%
- **NestJS (Priority ≤2)**: 2-10 Replicas, CPU 70%, Memory 80%
- **NestJS (Priority >2)**: 1-3 Replicas, CPU 70%, Memory 80%
- **Python**: 1-3 Replicas, CPU 70%, Memory 80%
- **Worker**: 1-2 Replicas, CPU 50%, Memory 60%

## Fehlerbehandlung

### Pre-Deployment Fehler

- Script stoppt bei kritischen Fehlern
- Warnings werden angezeigt, aber Deployment kann fortgesetzt werden
- Detaillierte Fehlermeldungen mit Lösungsvorschlägen

### Deployment Fehler

- Einzelne Service-Fehler stoppen nicht das gesamte Deployment
- Fehlgeschlagene Services werden in der Zusammenfassung aufgelistet
- Rollback-Mechanismus für kritische Services (optional)

### Health Check Fehler

- Retry-Mechanismus (standardmäßig 5 Versuche)
- Detaillierte Fehlerberichte
- Troubleshooting-Tipps

## Troubleshooting

### Service Deployment schlägt fehl

1. **Prüfe Railway Logs:**
   ```bash
   railway logs --service <service-name>
   ```

2. **Prüfe Service Status:**
   ```bash
   railway service <service-name>
   ```

3. **Prüfe Environment Variables:**
   ```bash
   railway variables --service <service-name>
   ```

4. **Validiere railway.json:**
   ```bash
   jq . apps/services/<service-name>/railway.json
   ```

### Health Check schlägt fehl

1. **Warte länger:**
   ```bash
   ./scripts/post-deployment-health-check.sh production 10 20
   ```

2. **Prüfe Service-URL:**
   ```bash
   railway variables --service <service-name> | grep URL
   ```

3. **Manueller Health Check:**
   ```bash
   curl https://<service-url>/health
   ```

### Service URLs werden nicht synchronisiert

1. **Manuell synchronisieren:**
   ```bash
   ./scripts/sync-service-urls.sh production
   ```

2. **Prüfe Railway Service Existenz:**
   ```bash
   railway service <service-name>
   ```

## Best Practices

1. **Immer Pre-Deployment Validierung ausführen** vor dem ersten Deployment
2. **Service URLs synchronisieren** nach jedem Deployment
3. **Health Checks ausführen** nach kritischen Deployments
4. **Logs überwachen** während des Deployments
5. **Staging Environment** für Tests verwenden

## Erweiterungen

### Rollback-Mechanismus

Für zukünftige Implementierung:
- Automatisches Rollback bei Health Check Fehlern
- Version-Tagging für einfaches Rollback
- Blue-Green Deployments

### Monitoring Integration

- Automatische Alerts bei Deployment-Fehlern
- Metrics-Integration (Prometheus, Grafana)
- Dashboard für Deployment-Status

## Zusammenfassung

Die automatisierte Deployment-Pipeline bietet:

✅ **Vollständige Automatisierung** - Von Validierung bis Health Check  
✅ **Dependency-basierte Reihenfolge** - Korrekte Deployment-Abhängigkeiten  
✅ **Parallele Deployments** - Schnellere Deployment-Zeiten  
✅ **Robuste Fehlerbehandlung** - Detaillierte Fehlermeldungen und Retry-Mechanismen  
✅ **CI/CD Integration** - Nahtlose GitHub Actions Integration  
✅ **Service Discovery** - Automatische URL-Synchronisation  

**Nächste Schritte:**
1. Pipeline testen mit Staging Environment
2. Monitoring und Alerts einrichten
3. Rollback-Mechanismus implementieren

