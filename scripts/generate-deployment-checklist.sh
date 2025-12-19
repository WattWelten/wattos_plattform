#!/bin/bash
set -euo pipefail

# Deployment Checklist Generator
# Generiert eine automatische Deployment-Checkliste basierend auf services-config.json

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/services-config.json"
OUTPUT_FILE="${SCRIPT_DIR}/../docs/DEPLOYMENT_CHECKLIST.md"
ENVIRONMENT="${1:-production}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: services-config.json not found at $CONFIG_FILE"
  exit 1
fi

# Prüfe ob jq installiert ist
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed. Please install jq first."
  exit 1
fi

echo "Generating deployment checklist for environment: $ENVIRONMENT"
echo "Reading service configuration from: $CONFIG_FILE"

# Erstelle Output-Datei
cat > "$OUTPUT_FILE" << 'EOF'
# Deployment Checklist

> **Automatisch generiert** - Diese Checkliste wird automatisch aus `scripts/services-config.json` generiert.
> **Letzte Aktualisierung:** $(date +"%Y-%m-%d %H:%M:%S")

## Übersicht

Diese Checkliste führt durch das vollständige Deployment der WattOS KI Plattform.
Alle Schritte müssen in der angegebenen Reihenfolge ausgeführt werden.

## Voraussetzungen

- [ ] Railway Account erstellt und eingeloggt
- [ ] Railway CLI installiert: `npm i -g @railway/cli`
- [ ] Railway Login durchgeführt: `railway login`
- [ ] Projekt verlinkt: `railway link <PROJECT_ID>`
- [ ] GitHub Secrets konfiguriert (siehe [SECRETS_SETUP.md](SECRETS_SETUP.md))

## Phase 0: Infrastructure Setup

EOF

# Infrastructure Dependencies sammeln
echo "### Infrastructure Services" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

INFRA_NEEDED=$(jq -r '[.services[].infrastructureDependencies[]] | unique | .[]' "$CONFIG_FILE" 2>/dev/null || echo "")

if echo "$INFRA_NEEDED" | grep -q "postgresql"; then
  echo "- [ ] **PostgreSQL Service** erstellt: \`railway add postgresql\`" >> "$OUTPUT_FILE"
  echo "  - [ ] \`DATABASE_URL\` automatisch gesetzt (Railway)" >> "$OUTPUT_FILE"
fi

if echo "$INFRA_NEEDED" | grep -q "redis"; then
  echo "- [ ] **Redis Service** erstellt: \`railway add redis\`" >> "$OUTPUT_FILE"
  echo "  - [ ] \`REDIS_URL\` automatisch gesetzt (Railway)" >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"
echo "### Shared Environment Variables" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "- [ ] \`NODE_ENV=production\` gesetzt (shared)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Services nach Deployment-Priorität sortieren
echo "## Phase 1: Core Services (Priority 1)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

PRIORITY_1_SERVICES=$(jq -r '.services | to_entries[] | select(.value.deploymentPriority == 1) | .key' "$CONFIG_FILE")

if [ -n "$PRIORITY_1_SERVICES" ]; then
  while IFS= read -r service; do
    SERVICE_NAME=$(jq -r ".services[\"$service\"].displayName" "$CONFIG_FILE")
    SERVICE_PATH=$(jq -r ".services[\"$service\"].path" "$CONFIG_FILE")
    BUILD_CMD=$(jq -r ".services[\"$service\"].buildCommand" "$CONFIG_FILE")
    
    echo "### $SERVICE_NAME" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "- [ ] Railway Service erstellt: \`railway service create $service\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service ausgewählt: \`railway service $service\`" >> "$OUTPUT_FILE"
    
    # Environment Variables
    ENV_VARS=$(jq -r ".services[\"$service\"].environmentVariables[]? | select(.required == true) | \"- [ ] \\\\\`\" + .name + \"\\\\\` gesetzt\" + (if .description then \": \" + .description else \"\" end)" "$CONFIG_FILE" 2>/dev/null || echo "")
    if [ -n "$ENV_VARS" ]; then
      echo "- [ ] **Environment Variables:**" >> "$OUTPUT_FILE"
      echo "$ENV_VARS" >> "$OUTPUT_FILE"
    fi
    
    # Dependencies
    DEPS=$(jq -r ".services[\"$service\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
    if [ -n "$DEPS" ]; then
      echo "- [ ] **Service Dependencies deployed:**" >> "$OUTPUT_FILE"
      while IFS= read -r dep; do
        DEP_NAME=$(jq -r ".services[\"$dep\"].displayName" "$CONFIG_FILE" 2>/dev/null || echo "$dep")
        echo "  - [ ] $DEP_NAME" >> "$OUTPUT_FILE"
      done <<< "$DEPS"
    fi
    
    echo "- [ ] Build Command validiert: \`$BUILD_CMD\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service deployed: \`railway up\`" >> "$OUTPUT_FILE"
    echo "- [ ] Health Check erfolgreich: \`curl <SERVICE_URL>/health\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service URL gesetzt in abhängigen Services" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done <<< "$PRIORITY_1_SERVICES"
else
  echo "*Keine Priority-1 Services*" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Priority 2 Services
echo "## Phase 2: Essential Services (Priority 2)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

PRIORITY_2_SERVICES=$(jq -r '.services | to_entries[] | select(.value.deploymentPriority == 2) | .key' "$CONFIG_FILE")

if [ -n "$PRIORITY_2_SERVICES" ]; then
  while IFS= read -r service; do
    SERVICE_NAME=$(jq -r ".services[\"$service\"].displayName" "$CONFIG_FILE")
    SERVICE_PATH=$(jq -r ".services[\"$service\"].path" "$CONFIG_FILE")
    BUILD_CMD=$(jq -r ".services[\"$service\"].buildCommand" "$CONFIG_FILE")
    
    echo "### $SERVICE_NAME" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "- [ ] Railway Service erstellt: \`railway service create $service\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service ausgewählt: \`railway service $service\`" >> "$OUTPUT_FILE"
    
    ENV_VARS=$(jq -r ".services[\"$service\"].environmentVariables[]? | select(.required == true) | \"- [ ] \\\\\`\" + .name + \"\\\\\` gesetzt\" + (if .description then \": \" + .description else \"\" end)" "$CONFIG_FILE" 2>/dev/null || echo "")
    if [ -n "$ENV_VARS" ]; then
      echo "- [ ] **Environment Variables:**" >> "$OUTPUT_FILE"
      echo "$ENV_VARS" >> "$OUTPUT_FILE"
    fi
    
    DEPS=$(jq -r ".services[\"$service\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
    if [ -n "$DEPS" ]; then
      echo "- [ ] **Service Dependencies deployed:**" >> "$OUTPUT_FILE"
      while IFS= read -r dep; do
        DEP_NAME=$(jq -r ".services[\"$dep\"].displayName" "$CONFIG_FILE" 2>/dev/null || echo "$dep")
        echo "  - [ ] $DEP_NAME" >> "$OUTPUT_FILE"
      done <<< "$DEPS"
    fi
    
    echo "- [ ] Build Command validiert: \`$BUILD_CMD\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service deployed: \`railway up\`" >> "$OUTPUT_FILE"
    echo "- [ ] Health Check erfolgreich: \`curl <SERVICE_URL>/health\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service URL gesetzt in abhängigen Services" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done <<< "$PRIORITY_2_SERVICES"
else
  echo "*Keine Priority-2 Services*" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Priority 3 Services
echo "## Phase 3: Advanced Services (Priority 3)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

PRIORITY_3_SERVICES=$(jq -r '.services | to_entries[] | select(.value.deploymentPriority == 3) | .key' "$CONFIG_FILE")

if [ -n "$PRIORITY_3_SERVICES" ]; then
  while IFS= read -r service; do
    SERVICE_NAME=$(jq -r ".services[\"$service\"].displayName" "$CONFIG_FILE")
    SERVICE_PATH=$(jq -r ".services[\"$service\"].path" "$CONFIG_FILE")
    BUILD_CMD=$(jq -r ".services[\"$service\"].buildCommand" "$CONFIG_FILE")
    
    echo "### $SERVICE_NAME" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "- [ ] Railway Service erstellt: \`railway service create $service\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service ausgewählt: \`railway service $service\`" >> "$OUTPUT_FILE"
    
    ENV_VARS=$(jq -r ".services[\"$service\"].environmentVariables[]? | select(.required == true) | \"- [ ] \\\\\`\" + .name + \"\\\\\` gesetzt\" + (if .description then \": \" + .description else \"\" end)" "$CONFIG_FILE" 2>/dev/null || echo "")
    if [ -n "$ENV_VARS" ]; then
      echo "- [ ] **Environment Variables:**" >> "$OUTPUT_FILE"
      echo "$ENV_VARS" >> "$OUTPUT_FILE"
    fi
    
    DEPS=$(jq -r ".services[\"$service\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
    if [ -n "$DEPS" ]; then
      echo "- [ ] **Service Dependencies deployed:**" >> "$OUTPUT_FILE"
      while IFS= read -r dep; do
        DEP_NAME=$(jq -r ".services[\"$dep\"].displayName" "$CONFIG_FILE" 2>/dev/null || echo "$dep")
        echo "  - [ ] $DEP_NAME" >> "$OUTPUT_FILE"
      done <<< "$DEPS"
    fi
    
    echo "- [ ] Build Command validiert: \`$BUILD_CMD\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service deployed: \`railway up\`" >> "$OUTPUT_FILE"
    echo "- [ ] Health Check erfolgreich: \`curl <SERVICE_URL>/health\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service URL gesetzt in abhängigen Services" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done <<< "$PRIORITY_3_SERVICES"
else
  echo "*Keine Priority-3 Services*" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Priority 4 & 5 Services
echo "## Phase 4: Supporting Services (Priority 4-5)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

PRIORITY_4_5_SERVICES=$(jq -r '.services | to_entries[] | select(.value.deploymentPriority >= 4) | .key' "$CONFIG_FILE")

if [ -n "$PRIORITY_4_5_SERVICES" ]; then
  while IFS= read -r service; do
    SERVICE_NAME=$(jq -r ".services[\"$service\"].displayName" "$CONFIG_FILE")
    SERVICE_PATH=$(jq -r ".services[\"$service\"].path" "$CONFIG_FILE")
    BUILD_CMD=$(jq -r ".services[\"$service\"].buildCommand" "$CONFIG_FILE")
    SERVICE_TYPE=$(jq -r ".services[\"$service\"].type" "$CONFIG_FILE")
    
    echo "### $SERVICE_NAME" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    if [ "$SERVICE_TYPE" = "python" ]; then
      echo "> **Python Service** - Erfordert Python Runtime auf Railway" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    elif [ "$SERVICE_TYPE" = "worker" ]; then
      echo "> **Worker Service** - Läuft als Background Worker" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
    fi
    
    echo "- [ ] Railway Service erstellt: \`railway service create $service\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service ausgewählt: \`railway service $service\`" >> "$OUTPUT_FILE"
    
    ENV_VARS=$(jq -r ".services[\"$service\"].environmentVariables[]? | select(.required == true) | \"- [ ] \\\\\`\" + .name + \"\\\\\` gesetzt\" + (if .description then \": \" + .description else \"\" end)" "$CONFIG_FILE" 2>/dev/null || echo "")
    if [ -n "$ENV_VARS" ]; then
      echo "- [ ] **Environment Variables:**" >> "$OUTPUT_FILE"
      echo "$ENV_VARS" >> "$OUTPUT_FILE"
    fi
    
    DEPS=$(jq -r ".services[\"$service\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
    if [ -n "$DEPS" ]; then
      echo "- [ ] **Service Dependencies deployed:**" >> "$OUTPUT_FILE"
      while IFS= read -r dep; do
        DEP_NAME=$(jq -r ".services[\"$dep\"].displayName" "$CONFIG_FILE" 2>/dev/null || echo "$dep")
        echo "  - [ ] $DEP_NAME" >> "$OUTPUT_FILE"
      done <<< "$DEPS"
    fi
    
    echo "- [ ] Build Command validiert: \`$BUILD_CMD\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service deployed: \`railway up\`" >> "$OUTPUT_FILE"
    echo "- [ ] Health Check erfolgreich: \`curl <SERVICE_URL>/health\`" >> "$OUTPUT_FILE"
    echo "- [ ] Service URL gesetzt in abhängigen Services" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done <<< "$PRIORITY_4_5_SERVICES"
else
  echo "*Keine Priority-4/5 Services*" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
fi

# Post-Deployment
cat >> "$OUTPUT_FILE" << 'EOF'
## Phase 5: Post-Deployment Validation

- [ ] **Database Migration ausgeführt:**
  - [ ] Prisma Client generiert: `cd packages/db && npx prisma generate`
  - [ ] Migrationen deployed: `npx prisma migrate deploy`

- [ ] **Service URLs synchronisiert:**
  - [ ] Alle Service-URLs in Railway abgerufen
  - [ ] Service-URLs in abhängigen Services gesetzt
  - [ ] Script ausgeführt: `./scripts/sync-service-urls.sh $ENVIRONMENT`

- [ ] **Health Checks durchgeführt:**
  - [ ] Alle Services Health Checks erfolgreich
  - [ ] Script ausgeführt: `./scripts/health-check.sh $ENVIRONMENT`

- [ ] **Smoke Tests durchgeführt:**
  - [ ] Alle Smoke Tests erfolgreich
  - [ ] Script ausgeführt: `./scripts/smoke-tests.sh $ENVIRONMENT`

- [ ] **Deployment Validation:**
  - [ ] Vollständige Validierung erfolgreich
  - [ ] Script ausgeführt: `./scripts/validate-deployment.sh $ENVIRONMENT`

- [ ] **Monitoring aktiviert:**
  - [ ] Railway Monitoring für alle Services aktiviert
  - [ ] Alerts konfiguriert
  - [ ] Logs überprüft

- [ ] **Frontend Integration:**
  - [ ] Frontend deployed (Vercel)
  - [ ] `NEXT_PUBLIC_API_URL` auf API Gateway URL gesetzt
  - [ ] CORS korrekt konfiguriert
  - [ ] Frontend-Backend Integration getestet

## Service-Status Übersicht

EOF

# Service-Status-Tabelle generieren
echo "| Service | Status | Health Check | URL |" >> "$OUTPUT_FILE"
echo "|---------|--------|--------------|-----|" >> "$OUTPUT_FILE"

ALL_SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE")

while IFS= read -r service; do
  SERVICE_NAME=$(jq -r ".services[\"$service\"].displayName" "$CONFIG_FILE")
  echo "| $SERVICE_NAME | ⬜ Nicht deployed | - | - |" >> "$OUTPUT_FILE"
done <<< "$ALL_SERVICES"

cat >> "$OUTPUT_FILE" << 'EOF'

**Legende:**
- ✅ Deployed und gesund
- ⚠️ Deployed, aber Probleme
- ❌ Deployment fehlgeschlagen
- ⬜ Nicht deployed

## Fehlende Services in Dokumentation

Die folgenden Services sind im Code vorhanden, aber noch nicht vollständig in der Deployment-Dokumentation:

EOF

# Undokumentierte Services finden
UNDOCUMENTED=$(jq -r '.services | to_entries[] | select(.value.documented == false) | "- **\(.value.displayName)** (\(.key)) - Typ: \(.value.type)"' "$CONFIG_FILE")

if [ -n "$UNDOCUMENTED" ]; then
  echo "$UNDOCUMENTED" >> "$OUTPUT_FILE"
else
  echo "*Alle Services sind dokumentiert*" >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" << 'EOF'

## Nächste Schritte

Nach erfolgreichem Deployment:

1. Vollständige Integration Tests durchführen
2. Performance Monitoring aktivieren
3. Cost Monitoring einrichten
4. Dokumentation aktualisieren mit tatsächlichen Service-URLs
5. Team über Deployment informieren

## Troubleshooting

Bei Problemen siehe:
- [Deployment Railway Guide](DEPLOYMENT_RAILWAY.md)
- [First Deployment Guide](FIRST_DEPLOYMENT.md)
- [Runbooks](runbooks/)

---

**Hinweis:** Diese Checkliste wird automatisch generiert. Bei Änderungen an Services-Konfiguration die Checkliste neu generieren:
```bash
./scripts/generate-deployment-checklist.sh [staging|production]
```

EOF

echo "✅ Deployment checklist generated: $OUTPUT_FILE"
echo ""
echo "Summary:"
echo "  - Total services: $(jq '.services | length' "$CONFIG_FILE")"
echo "  - Documented: $(jq '[.services[].documented] | map(select(. == true)) | length' "$CONFIG_FILE")"
echo "  - Undocumented: $(jq '[.services[].documented] | map(select(. == false)) | length' "$CONFIG_FILE")"
echo ""
echo "Next steps:"
echo "  1. Review generated checklist: $OUTPUT_FILE"
echo "  2. Update services-config.json for any missing services"
echo "  3. Re-generate checklist after updates"












