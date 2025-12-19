#!/bin/bash
set -euo pipefail

# Service Dependency Graph Analyzer
# Analysiert Service-Abhängigkeiten und generiert Dependency-Graph

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/services-config.json"
OUTPUT_FILE="${SCRIPT_DIR}/../docs/SERVICE_DEPENDENCIES.md"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: services-config.json not found at $CONFIG_FILE"
  exit 1
fi

# Prüfe ob jq installiert ist
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required but not installed."
  exit 1
fi

echo "Analyzing service dependencies..."
echo ""

# Erstelle Output-Datei
cat > "$OUTPUT_FILE" << 'EOF'
# Service Dependencies

> **Automatisch generiert** - Diese Dokumentation wird automatisch aus `scripts/services-config.json` generiert.
> **Letzte Aktualisierung:** $(date +"%Y-%m-%d %H:%M:%S")

## Übersicht

Dieses Dokument beschreibt die Abhängigkeiten zwischen den Services der WattOS KI Plattform und die optimale Deployment-Reihenfolge.

## Dependency Graph

EOF

# Generiere Mermaid Diagramm
echo "### Visual Dependency Graph" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo '```mermaid' >> "$OUTPUT_FILE"
echo 'graph TD' >> "$OUTPUT_FILE"

# Infrastructure Nodes
echo "    PostgreSQL[PostgreSQL]" >> "$OUTPUT_FILE"
echo "    Redis[Redis]" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Service Nodes und Dependencies
SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE")

while IFS= read -r service_key; do
  SERVICE_NAME=$(jq -r ".services[\"$service_key\"].displayName" "$CONFIG_FILE")
  SERVICE_DISPLAY=$(echo "$SERVICE_NAME" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
  
  # Service Node
  echo "    ${service_key}[${SERVICE_NAME}]" >> "$OUTPUT_FILE"
  
  # Infrastructure Dependencies
  INFRA_DEPS=$(jq -r ".services[\"$service_key\"].infrastructureDependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
  while IFS= read -r infra; do
    if [ -n "$infra" ]; then
      echo "    ${infra} --> ${service_key}" >> "$OUTPUT_FILE"
    fi
  done <<< "$INFRA_DEPS"
  
  # Service Dependencies
  SERVICE_DEPS=$(jq -r ".services[\"$service_key\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
  while IFS= read -r dep; do
    if [ -n "$dep" ]; then
      echo "    ${dep} --> ${service_key}" >> "$OUTPUT_FILE"
    fi
  done <<< "$SERVICE_DEPS"
  
  echo "" >> "$OUTPUT_FILE"
done <<< "$SERVICES"

echo '```' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Dependency Details
echo "## Dependency Details" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Gruppiere nach Deployment-Priorität
for priority in 1 2 3 4 5; do
  PRIORITY_SERVICES=$(jq -r ".services | to_entries[] | select(.value.deploymentPriority == $priority) | .key" "$CONFIG_FILE")
  
  if [ -n "$PRIORITY_SERVICES" ]; then
    echo "### Priority $priority Services" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    while IFS= read -r service_key; do
      SERVICE_NAME=$(jq -r ".services[\"$service_key\"].displayName" "$CONFIG_FILE")
      
      echo "#### $SERVICE_NAME" >> "$OUTPUT_FILE"
      echo "" >> "$OUTPUT_FILE"
      
      # Infrastructure Dependencies
      INFRA_DEPS=$(jq -r ".services[\"$service_key\"].infrastructureDependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
      if [ -n "$INFRA_DEPS" ]; then
        echo "**Infrastructure Dependencies:**" >> "$OUTPUT_FILE"
        while IFS= read -r infra; do
          if [ -n "$infra" ]; then
            echo "- $infra" >> "$OUTPUT_FILE"
          fi
        done <<< "$INFRA_DEPS"
        echo "" >> "$OUTPUT_FILE"
      fi
      
      # Service Dependencies
      SERVICE_DEPS=$(jq -r ".services[\"$service_key\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
      if [ -n "$SERVICE_DEPS" ]; then
        echo "**Service Dependencies:**" >> "$OUTPUT_FILE"
        while IFS= read -r dep; do
          if [ -n "$dep" ]; then
            DEP_NAME=$(jq -r ".services[\"$dep\"].displayName" "$CONFIG_FILE" 2>/dev/null || echo "$dep")
            echo "- $DEP_NAME ($dep)" >> "$OUTPUT_FILE"
          fi
        done <<< "$SERVICE_DEPS"
        echo "" >> "$OUTPUT_FILE"
      fi
      
      if [ -z "$INFRA_DEPS" ] && [ -z "$SERVICE_DEPS" ]; then
        echo "*No dependencies*" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
      fi
    done <<< "$PRIORITY_SERVICES"
  fi
done

# Optimale Deployment-Reihenfolge
cat >> "$OUTPUT_FILE" << 'EOF'

## Optimale Deployment-Reihenfolge

Basierend auf den Service-Abhängigkeiten wird folgende Deployment-Reihenfolge empfohlen:

### Phase 1: Infrastructure (Priority 1)

1. **PostgreSQL** - Datenbank-Service
2. **Redis** - Cache/Queue-Service

### Phase 2: Core Services (Priority 1)

1. **LLM Gateway** - Keine Service-Dependencies
2. **API Gateway** - Abhängig von Redis

### Phase 3: Essential Services (Priority 2)

1. **RAG Service** - Abhängig von LLM Gateway, PostgreSQL
2. **Tool Service** - Keine Service-Dependencies
3. **Agent Service** - Abhängig von LLM Gateway, Tool Service
4. **Chat Service** - Abhängig von LLM Gateway, RAG Service

### Phase 4: Advanced Services (Priority 3)

1. **Crawler Service** - Keine Service-Dependencies
2. **Voice Service** - Abhängig von LLM Gateway, Chat Service
3. **Customer Intelligence Service** - Abhängig von allen Core Services
4. **Avatar Service** - Abhängig von Voice Service

### Phase 5: Supporting Services (Priority 4-5)

1. **Admin Service** - Abhängig von PostgreSQL, Redis
2. **Character Service** - Abhängig von PostgreSQL
3. **Summary Service** - Abhängig von LLM Gateway
4. **Feedback Service** - Abhängig von PostgreSQL
5. **Ingestion Service** - Abhängig von Admin Service (Python)
6. **Metaverse Service** - Keine Dependencies
7. **Workers** - Abhängig von Redis und entsprechenden Services

## Zirkuläre Abhängigkeiten

EOF

# Prüfe auf zirkuläre Abhängigkeiten
echo "Prüfe auf zirkuläre Abhängigkeiten..." >&2

CIRCULAR_FOUND=false

for service_key in $SERVICES; do
  DEPS=$(jq -r ".services[\"$service_key\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
  
  while IFS= read -r dep; do
    if [ -z "$dep" ]; then
      continue
    fi
    
    # Prüfe ob Dependency wiederum von diesem Service abhängt
    DEP_DEPS=$(jq -r ".services[\"$dep\"].dependencies[]?" "$CONFIG_FILE" 2>/dev/null || echo "")
    if echo "$DEP_DEPS" | grep -q "^${service_key}$"; then
      SERVICE_NAME=$(jq -r ".services[\"$service_key\"].displayName" "$CONFIG_FILE")
      DEP_NAME=$(jq -r ".services[\"$dep\"].displayName" "$CONFIG_FILE")
      echo "⚠️  Circular dependency detected: $SERVICE_NAME ↔ $DEP_NAME" >&2
      CIRCULAR_FOUND=true
    fi
  done <<< "$DEPS"
done

if [ "$CIRCULAR_FOUND" = "false" ]; then
  echo "✅ **Keine zirkulären Abhängigkeiten gefunden**" >> "$OUTPUT_FILE"
else
  echo "⚠️  **Zirkuläre Abhängigkeiten gefunden - siehe Logs**" >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" << 'EOF'

## Dependency-Statistiken

EOF

# Statistiken
TOTAL_SERVICES=$(jq '.services | length' "$CONFIG_FILE")
SERVICES_WITH_DEPS=$(jq '[.services[] | select(.dependencies != null and (.dependencies | length) > 0)] | length' "$CONFIG_FILE")
SERVICES_WITHOUT_DEPS=$((TOTAL_SERVICES - SERVICES_WITH_DEPS))

echo "- **Gesamt Services:** $TOTAL_SERVICES" >> "$OUTPUT_FILE"
echo "- **Services mit Dependencies:** $SERVICES_WITH_DEPS" >> "$OUTPUT_FILE"
echo "- **Services ohne Dependencies:** $SERVICES_WITHOUT_DEPS" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << 'EOF'

## Hinweise

- Services sollten in der Reihenfolge ihrer Dependencies deployed werden
- Infrastructure Services (PostgreSQL, Redis) müssen zuerst deployed werden
- Services ohne Dependencies können parallel deployed werden
- Bei zirkulären Abhängigkeiten muss eine Abhängigkeit optional gemacht werden

---

**Hinweis:** Diese Dokumentation wird automatisch generiert. Bei Änderungen an Service-Konfigurationen die Dokumentation neu generieren:
```bash
./scripts/analyze-service-dependencies.sh
```

EOF

echo "✅ Service dependency analysis completed: $OUTPUT_FILE"
echo ""
echo "Summary:"
echo "  - Total services: $TOTAL_SERVICES"
echo "  - Services with dependencies: $SERVICES_WITH_DEPS"
echo "  - Services without dependencies: $SERVICES_WITHOUT_DEPS"












