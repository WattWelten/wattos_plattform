#!/bin/bash
set -euo pipefail

# Railway Deployment Analyse Script
# Prüft alle Services, identifiziert Probleme und schlägt Lösungen vor

ENVIRONMENT=${1:-production}
REPORT_DIR="railway-analysis-$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="$REPORT_DIR/analysis-report.md"
ERRORS_FILE="$REPORT_DIR/errors.json"
SOLUTIONS_FILE="$REPORT_DIR/solutions.md"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services Definition
# Railway verwendet @wattweiser/ Service-Namen
declare -A SERVICES=(
  ["@wattweiser/gateway"]="3001:apps/gateway"
  ["@wattweiser/chat-service"]="3006:apps/services/chat-service"
  ["@wattweiser/rag-service"]="3007:apps/services/rag-service"
  ["@wattweiser/agent-service"]="3008:apps/services/agent-service"
  ["@wattweiser/llm-gateway"]="3009:apps/services/llm-gateway"
  ["@wattweiser/tool-service"]="3005:apps/services/tool-service"
  ["@wattweiser/admin-service"]="3008:apps/services/admin-service"
  ["@wattweiser/customer-intelligence-service"]="3014:apps/services/customer-intelligence-service"
  ["@wattweiser/crawler-service"]="3015:apps/services/crawler-service"
  ["@wattweiser/voice-service"]="3016:apps/services/voice-service"
  ["@wattweiser/avatar-service"]="3009:apps/services/avatar-service"
  ["@wattweiser/character-service"]="3013:apps/services/character-service"
  ["@wattweiser/summary-service"]="3006:apps/services/summary-service"
  ["@wattweiser/feedback-service"]="3010:apps/services/feedback-service"
  ["@wattweiser/metaverse-service"]="3010:apps/services/metaverse-service"
  ["@wattweiser/ingestion-service"]="8001:apps/services/ingestion-service"
  ["@wattweiser/web"]="3000:apps/web"
)

# Kritische Environment Variables
CRITICAL_VARS=(
  "DATABASE_URL"
  "REDIS_URL"
  "DEPLOYMENT_PLATFORM"
  "NODE_ENV"
  "PORT"
)

# Service Discovery Variables
SERVICE_VARS=(
  "CHAT_SERVICE_URL"
  "RAG_SERVICE_URL"
  "LLM_GATEWAY_URL"
  "AGENT_SERVICE_URL"
  "TOOL_SERVICE_URL"
)

# Fehler-Sammlung
declare -a ERRORS=()
declare -a WARNINGS=()
declare -a SOLUTIONS=()

# Helper Functions
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✅${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }

# Initialisierung
init_report() {
  mkdir -p "$REPORT_DIR"
  cat > "$REPORT_FILE" <<EOF
# Railway Deployment Analyse Report

**Datum:** $(date +"%Y-%m-%d %H:%M:%S")
**Umgebung:** $ENVIRONMENT
**Railway CLI Version:** $(railway --version 2>/dev/null || echo "Nicht installiert")

## Zusammenfassung

EOF
  echo "[]" > "$ERRORS_FILE"
  log_info "Report-Verzeichnis erstellt: $REPORT_DIR"
}

# Prüfe Dependencies
check_dependencies() {
  log_info "Prüfe Dependencies..."
  local missing_deps=()
  
  if ! command -v railway &> /dev/null; then
    missing_deps+=("railway")
    ERRORS+=("Railway CLI ist nicht installiert")
    SOLUTIONS+=("Installiere Railway CLI: npm i -g @railway/cli")
  fi
  
  if ! command -v jq &> /dev/null; then
    missing_deps+=("jq")
    WARNINGS+=("jq ist nicht installiert - JSON-Parsing wird eingeschränkt sein")
    SOLUTIONS+=("Installiere jq: brew install jq (macOS) oder apt-get install jq (Linux) oder choco install jq (Windows)")
  fi
  
  if ! command -v curl &> /dev/null; then
    missing_deps+=("curl")
    WARNINGS+=("curl ist nicht installiert - Health Checks werden übersprungen")
    SOLUTIONS+=("Installiere curl: brew install curl (macOS) oder apt-get install curl (Linux)")
  fi
  
  if [ ${#missing_deps[@]} -gt 0 ]; then
    log_warning "Fehlende Dependencies: ${missing_deps[*]}"
  else
    log_success "Alle Dependencies vorhanden"
  fi
  
  return 0
}

# Prüfe Railway CLI
check_railway_cli() {
  log_info "Prüfe Railway CLI..."
  if ! command -v railway &> /dev/null; then
    ERRORS+=("Railway CLI ist nicht installiert")
    SOLUTIONS+=("Installiere Railway CLI: npm i -g @railway/cli")
    return 1
  fi
  
  # Prüfe Authentifizierung - verschiedene Methoden
  if railway whoami &> /dev/null 2>&1; then
    log_success "Railway CLI ist installiert und authentifiziert"
    return 0
  elif railway status &> /dev/null 2>&1; then
    log_success "Railway CLI ist installiert und authentifiziert (via status)"
    return 0
  else
    ERRORS+=("Nicht bei Railway eingeloggt")
    SOLUTIONS+=("Führe aus: railway login")
    return 1
  fi
}

# Prüfe Konfigurationsdateien
check_config_files() {
  log_info "Prüfe Konfigurationsdateien..."
  
  local has_json=false
  local has_toml=false
  
  if [ -f "railway.json" ]; then
    has_json=true
    log_success "railway.json gefunden"
  fi
  
  if [ -f "railway.toml" ]; then
    has_toml=true
    log_warning "railway.toml gefunden (kann mit railway.json kollidieren)"
  fi
  
  if [ "$has_json" = true ] && [ "$has_toml" = true ]; then
    ERRORS+=("Sowohl railway.json als auch railway.toml existieren - Konflikt möglich")
    SOLUTIONS+=("Lösche railway.toml oder benenne es um (Railway priorisiert railway.json)")
  fi
  
  # Prüfe Start-Command in railway.json
  if [ -f "railway.json" ]; then
    local start_cmd=""
    if command -v jq &> /dev/null; then
      start_cmd=$(jq -r '.deploy.startCommand // empty' railway.json 2>/dev/null || echo "")
    else
      # Fallback: grep für startCommand
      start_cmd=$(grep -i "startCommand" railway.json | sed 's/.*"startCommand"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
    fi
    
    if [ -n "$start_cmd" ]; then
      if [[ "$start_cmd" == *"npm run start:prod"* ]] && ! grep -q "start:prod" package.json; then
        ERRORS+=("railway.json verwendet 'npm run start:prod', aber Script existiert nicht in package.json")
        SOLUTIONS+=("Ändere startCommand in railway.json zu service-spezifischem Command (z.B. 'cd apps/gateway && npm run start:prod')")
      fi
    else
      WARNINGS+=("Kein startCommand in railway.json definiert")
      SOLUTIONS+=("Füge startCommand in railway.json hinzu (z.B. 'cd apps/gateway && node dist/main')")
    fi
  fi
}

# Prüfe Services in Railway
check_railway_services() {
  log_info "Prüfe Railway Services..."
  
  # Überspringe interaktive Service-Liste, verwende direkt bekannte Services
  log_info "Verwende bekannte Service-Liste (${#SERVICES[@]} Services)"
  
  # Versuche einige Services zu prüfen, ob sie existieren
  local found_services=0
  local checked_services=0
  local max_checks=3  # Prüfe nur erste 3 Services als Sample
  
  for service_name in "${!SERVICES[@]}"; do
    if [ $checked_services -ge $max_checks ]; then
      break
    fi
    
    # Prüfe ob Service existiert (non-blocking)
    if command -v timeout &> /dev/null; then
      if timeout 3 railway status --service "$service_name" &> /dev/null 2>&1; then
        ((found_services++))
      fi
    else
      # Windows: Versuche es ohne timeout
      if railway status --service "$service_name" &> /dev/null 2>&1; then
        ((found_services++))
      fi
    fi
    ((checked_services++))
  done
  
  if [ $found_services -gt 0 ]; then
    log_success "Services gefunden (Sample-Prüfung: $found_services/$checked_services)"
    return 0
  else
    log_warning "Konnte Services nicht direkt prüfen - verwende erwartete Service-Liste"
    # Verwende trotzdem die bekannte Liste
    return 0
  fi
}

# Prüfe Environment Variables für einen Service
check_service_env_vars() {
  local service_name=$1
  log_info "Prüfe Environment Variables für $service_name..."
  
  local vars_json="[]"
  local vars_text=""
  local missing_vars=()
  
  # Versuche JSON-Output mit Timeout
  if command -v jq &> /dev/null; then
    if command -v timeout &> /dev/null; then
      vars_json=$(timeout 10 railway variables --service "$service_name" --json 2>/dev/null || echo "[]")
    else
      vars_json=$(railway variables --service "$service_name" --json 2>/dev/null || echo "[]")
    fi
    echo "$vars_json" > "$REPORT_DIR/${service_name}-env-vars.json"
    
    # Prüfe kritische Variablen
    for var in "${CRITICAL_VARS[@]}"; do
      local value=$(echo "$vars_json" | jq -r ".[] | select(.name == \"$var\") | .value" 2>/dev/null || echo "")
      if [ -z "$value" ] || [ "$value" = "null" ]; then
        missing_vars+=("$var")
      fi
    done
  else
    # Fallback: Text-Parsing mit Timeout
    if command -v timeout &> /dev/null; then
      vars_text=$(timeout 10 railway variables --service "$service_name" 2>/dev/null || echo "")
    else
      vars_text=$(railway variables --service "$service_name" 2>/dev/null || echo "")
    fi
    echo "$vars_text" > "$REPORT_DIR/${service_name}-env-vars.txt"
    
    # Prüfe kritische Variablen via Text-Suche
    for var in "${CRITICAL_VARS[@]}"; do
      if ! echo "$vars_text" | grep -q "$var"; then
        missing_vars+=("$var")
      fi
    done
  fi
  
  if [ ${#missing_vars[@]} -gt 0 ]; then
    WARNINGS+=("Service '$service_name' fehlt: ${missing_vars[*]}")
    SOLUTIONS+=("Setze fehlende Variablen für $service_name: railway variables set <VAR>=<value> --service $service_name")
  else
    log_success "Alle kritischen Environment Variables für $service_name vorhanden"
  fi
}

# Prüfe Logs für einen Service
check_service_logs() {
  local service_name=$1
  log_info "Analysiere Logs für $service_name..."
  
  local log_file="$REPORT_DIR/${service_name}-logs.txt"
  
  # Verwende Timeout für Log-Abruf
  if command -v timeout &> /dev/null; then
    timeout 15 railway logs --service "$service_name" --tail 200 > "$log_file" 2>&1 || {
      WARNINGS+=("Konnte Logs für $service_name nicht abrufen (Timeout oder Fehler)")
      return 1
    }
  else
    # Fallback ohne timeout (Windows)
    railway logs --service "$service_name" --tail 200 > "$log_file" 2>&1 || {
      WARNINGS+=("Konnte Logs für $service_name nicht abrufen")
      return 1
    }
  fi
  
  # Analysiere Logs auf Fehler
  local error_count=$(grep -i "error\|failed\|exception\|fatal" "$log_file" | wc -l || echo "0")
  local build_errors=$(grep -i "build.*fail\|compile.*error\|npm.*error\|pnpm.*error" "$log_file" | wc -l || echo "0")
  local start_errors=$(grep -i "cannot.*start\|failed.*start\|port.*already.*in.*use" "$log_file" | wc -l || echo "0")
  
  if [ "$error_count" -gt 0 ]; then
    WARNINGS+=("$service_name: $error_count Fehler in Logs gefunden")
    echo "**$service_name Logs:**" >> "$REPORT_FILE"
    grep -i "error\|failed\|exception" "$log_file" | head -10 >> "$REPORT_FILE" || true
    echo "" >> "$REPORT_FILE"
  fi
  
  if [ "$build_errors" -gt 0 ]; then
    ERRORS+=("$service_name: Build-Fehler erkannt")
    SOLUTIONS+=("Prüfe Build-Logs für $service_name: railway logs --service $service_name | grep -i build")
  fi
  
  if [ "$start_errors" -gt 0 ]; then
    ERRORS+=("$service_name: Start-Fehler erkannt")
    SOLUTIONS+=("Prüfe Start-Command für $service_name und Port-Konflikte")
  fi
  
  log_success "Logs für $service_name analysiert ($error_count Fehler gefunden)"
}

# Prüfe Health Check für einen Service
check_service_health() {
  local service_name=$1
  log_info "Prüfe Health Check für $service_name..."
  
  # Prüfe ob curl verfügbar ist
  if ! command -v curl &> /dev/null; then
    WARNINGS+=("curl nicht verfügbar - Health Check für $service_name übersprungen")
    return 0
  fi
  
  local service_url=""
  
  # Versuche Service-URL zu finden
  if command -v jq &> /dev/null; then
    # Versuche via JSON
    service_url=$(railway service "$service_name" --json 2>/dev/null | jq -r '.domain // .url // empty' 2>/dev/null || echo "")
  fi
  
  # Fallback: Text-Parsing
  if [ -z "$service_url" ] || [ "$service_url" = "null" ]; then
    service_url=$(railway variables --service "$service_name" 2>/dev/null | grep -i "RAILWAY_PUBLIC_DOMAIN\|URL" | head -1 | awk '{print $2}' || echo "")
  fi
  
  # Fallback: railway domain command
  if [ -z "$service_url" ] || [ "$service_url" = "null" ]; then
    service_url=$(railway domain --service "$service_name" 2>/dev/null || echo "")
  fi
  
  if [ -z "$service_url" ] || [ "$service_url" = "null" ]; then
    WARNINGS+=("$service_name: Keine öffentliche URL gefunden - Health Check übersprungen")
    return 0
  fi
  
  # Füge https:// hinzu falls nicht vorhanden
  if [[ ! "$service_url" == http* ]]; then
    service_url="https://$service_url"
  fi
  
  # Teste Health Check
  local health_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${service_url}/health" 2>/dev/null || echo "000")
  
  if [ "$health_status" = "200" ]; then
    log_success "$service_name Health Check: OK"
    echo "$service_name|$service_url|OK" >> "$REPORT_DIR/health-checks.txt"
  else
    ERRORS+=("$service_name Health Check fehlgeschlagen (HTTP $health_status)")
    SOLUTIONS+=("Prüfe ob $service_name läuft: railway logs --service $service_name")
    echo "$service_name|$service_url|FAILED ($health_status)" >> "$REPORT_DIR/health-checks.txt"
  fi
}

# Prüfe Port-Konflikte
check_port_conflicts() {
  log_info "Prüfe Port-Konflikte..."
  
  declare -A port_usage=()
  local conflicts=()
  
  for service_name in "${!SERVICES[@]}"; do
    local port_path="${SERVICES[$service_name]}"
    local port="${port_path%%:*}"
    
    if [[ -n "${port_usage[$port]:-}" ]]; then
      conflicts+=("Port $port: ${port_usage[$port]} und $service_name")
    else
      port_usage[$port]="$service_name"
    fi
  done
  
  if [ ${#conflicts[@]} -gt 0 ]; then
    WARNINGS+=("Port-Konflikte erkannt: ${conflicts[*]}")
    SOLUTIONS+=("Railway setzt automatisch PORT env var - Services sollten process.env.PORT verwenden, nicht hardcoded Ports")
  else
    log_success "Keine Port-Konflikte erkannt"
  fi
}

# Prüfe Service Discovery
check_service_discovery() {
  log_info "Prüfe Service Discovery Konfiguration..."
  
  local missing_urls=()
  
  for var in "${SERVICE_VARS[@]}"; do
    # Prüfe ob Variable in mindestens einem Service gesetzt ist
    local found=false
    for service_name in "${!SERVICES[@]}"; do
      local value=$(railway variables --service "$service_name" 2>/dev/null | grep "$var" | awk '{print $2}' || echo "")
      if [ -n "$value" ]; then
        found=true
        break
      fi
    done
    
    if [ "$found" = false ]; then
      missing_urls+=("$var")
    fi
  done
  
  if [ ${#missing_urls[@]} -gt 0 ]; then
    WARNINGS+=("Service Discovery URLs fehlen: ${missing_urls[*]}")
    SOLUTIONS+=("Führe aus: ./scripts/sync-service-urls.sh $ENVIRONMENT")
  else
    log_success "Service Discovery URLs konfiguriert"
  fi
}

# Generiere Lösungsvorschläge
generate_solutions() {
  log_info "Generiere Lösungsvorschläge..."
  
  cat > "$SOLUTIONS_FILE" <<EOF
# Lösungsvorschläge für Railway Deployment Probleme

## Identifizierte Probleme

### Kritische Fehler (${#ERRORS[@]})
EOF
  
  for i in "${!ERRORS[@]}"; do
    echo "$((i+1)). ${ERRORS[$i]}" >> "$SOLUTIONS_FILE"
  done
  
  cat >> "$SOLUTIONS_FILE" <<EOF

### Warnungen (${#WARNINGS[@]})
EOF
  
  for i in "${!WARNINGS[@]}"; do
    echo "$((i+1)). ${WARNINGS[$i]}" >> "$SOLUTIONS_FILE"
  done
  
  cat >> "$SOLUTIONS_FILE" <<EOF

## Empfohlene Lösungen

EOF
  
  # Entferne Duplikate
  local unique_solutions=($(printf '%s\n' "${SOLUTIONS[@]}" | sort -u))
  
  for i in "${!unique_solutions[@]}"; do
    echo "$((i+1)). ${unique_solutions[$i]}" >> "$SOLUTIONS_FILE"
  done
  
  cat >> "$SOLUTIONS_FILE" <<EOF

## Nächste Schritte

1. **Kritische Fehler beheben:**
   - Beginne mit den oben genannten kritischen Fehlern
   - Prüfe Logs für Details: railway logs --service <service-name>

2. **Warnungen adressieren:**
   - Prüfe ob Warnungen tatsächlich Probleme verursachen
   - Setze fehlende Environment Variables

3. **Service Discovery konfigurieren:**
   - Führe aus: ./scripts/sync-service-urls.sh $ENVIRONMENT
   - Prüfe Service-URLs: railway variables --service <service-name>

4. **Health Checks testen:**
   - Teste jeden Service: curl https://<service-url>/health
   - Prüfe Railway Dashboard für Service-Status

5. **Monitoring einrichten:**
   - Aktiviere Railway Monitoring für alle Services
   - Setze Alerts für Fehlerraten

## Weitere Hilfe

- Railway Dokumentation: https://docs.railway.app
- Service Discovery Guide: docs/SERVICE_DISCOVERY.md
- Deployment Guide: docs/DEPLOYMENT_RAILWAY.md
EOF
}

# Generiere finalen Report
generate_final_report() {
  log_info "Generiere finalen Report..."
  
  {
    echo ""
    echo "## Fehler-Zusammenfassung"
    echo ""
    echo "**Kritische Fehler:** ${#ERRORS[@]}"
    echo "**Warnungen:** ${#WARNINGS[@]}"
    echo ""
    echo "### Kritische Fehler"
    echo ""
    for i in "${!ERRORS[@]}"; do
      echo "$((i+1)). ${ERRORS[$i]}"
    done
    echo ""
    echo "### Warnungen"
    echo ""
    for i in "${!WARNINGS[@]}"; do
      echo "$((i+1)). ${WARNINGS[$i]}"
    done
    echo ""
    echo "---"
    echo ""
    echo "Siehe [Lösungsvorschläge]($SOLUTIONS_FILE) für Details."
    echo ""
    echo "## Service-Status"
    echo ""
    if [ -f "$REPORT_DIR/health-checks.txt" ]; then
      echo "| Service | URL | Status |"
      echo "|---------|-----|--------|"
      while IFS='|' read -r service url status; do
        echo "| $service | $url | $status |"
      done < "$REPORT_DIR/health-checks.txt"
    fi
  } >> "$REPORT_FILE"
  
  log_success "Report generiert: $REPORT_FILE"
}

# Main Execution
main() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 Railway Deployment Analyse"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  init_report
  
  # Basis-Checks
  check_dependencies
  
  if ! check_railway_cli; then
    log_error "Railway CLI Check fehlgeschlagen - weitere Checks übersprungen"
    exit 1
  fi
  
  check_config_files
  check_port_conflicts
  check_service_discovery
  
  # Service-spezifische Checks
  # Überspringe check_railway_services, da railway service list interaktiv ist
  log_info "Prüfe bekannte Services direkt (${#SERVICES[@]} Services)"
  
  local service_index=0
  local total_services=${#SERVICES[@]}
  
  for service_name in "${!SERVICES[@]}"; do
    ((service_index++))
    echo ""
    log_info "Analysiere Service: $service_name ($service_index/$total_services)"
    
    # Prüfe direkt Logs und Environment Variables (überspringe Service-Existenz-Prüfung)
    check_service_env_vars "$service_name" || true
    check_service_logs "$service_name" || true
    check_service_health "$service_name" || true
  done
  
  # Generiere Reports
  generate_solutions
  generate_final_report
  
  # Zusammenfassung
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Analyse abgeschlossen"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "📁 Report-Verzeichnis: $REPORT_DIR"
  echo "📄 Haupt-Report: $REPORT_FILE"
  echo "💡 Lösungen: $SOLUTIONS_FILE"
  echo ""
  echo "**Zusammenfassung:**"
  echo "  ❌ Kritische Fehler: ${#ERRORS[@]}"
  echo "  ⚠️  Warnungen: ${#WARNINGS[@]}"
  echo ""
  
  if [ ${#ERRORS[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
    log_success "Keine Probleme gefunden! 🎉"
    exit 0
  elif [ ${#ERRORS[@]} -eq 0 ]; then
    log_warning "Nur Warnungen - Deployment sollte funktionieren"
    exit 0
  else
    log_error "Kritische Fehler gefunden - Deployment wird wahrscheinlich fehlschlagen"
    exit 1
  fi
}

# Script ausführen
main "$@"

